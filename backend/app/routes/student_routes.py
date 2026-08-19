from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel

# 1. IMPORT OUR SECURITY TOOLS
from app.core.permissions import require_permission, Permission, require_student_ownership
from app.core.database import get_db
from app.auth.auth import get_current_active_user
from app.utils.audit import log_audit

# 2. FIXED IMPORTS: Removed 'Appointment' because it doesn't exist in the database models yet
from app.models.models import User, Student, ClearanceRequest, Notification
from app.schemas.schemas import StudentResponse

# Setup the router with the correct prefix so the frontend can find it
router = APIRouter(prefix="/students", tags=["Students"])

# ==================== STUDENT ROUTES ====================

# 1. View Own Profile
@router.get("/")
async def get_students(
    skip: int = 0, limit: int = 1000, search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all students with optional search and pagination"""
    query = db.query(Student)
    if search:
        query = query.filter(
            (Student.first_name.ilike(f"%{search}%")) |
            (Student.last_name.ilike(f"%{search}%")) |
            (Student.student_id.ilike(f"%{search}%"))
        )
    return query.offset(skip).limit(limit).all()

@router.get("/me", response_model=StudentResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Student: View Profile
    Security: Users can ONLY see their own profile.
    """
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student

# 2. Apply for Clearance
@router.post("/request-clearance")
async def request_clearance(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Student: Apply for Clearance
    Security: Only students can apply. Checks if request already exists.
    """
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Access Denied. Only students can apply.")

    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Check for existing pending requests
    existing = db.query(ClearanceRequest).filter(
        ClearanceRequest.student_id == student.id,
        ClearanceRequest.overall_status.in_(["pending", "in_progress"])
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending clearance request.")

    # Create new request
    new_request = ClearanceRequest(
        student_id=student.id,
        student_user_id=current_user.id,
        overall_status="pending"
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return {"message": "Clearance request submitted!", "id": new_request.id}

# 3. View Clearance Status
@router.get("/clearance-status")
async def view_clearance_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Student: View Clearance Progress
    """
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    request = db.query(ClearanceRequest).filter(
        ClearanceRequest.student_id == student.id
    ).order_by(ClearanceRequest.created_at.desc()).first()

    if not request:
        return {"status": "No active request found"}

    return {
        "request_id": request.id,
        "overall_status": request.overall_status
    }

# 4. View Notifications
@router.get("/notifications")
async def view_notifications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Student: View Notifications
    Security: Only view notifications meant for this user.
    """
    notifications = db.query(Notification).filter(
        Notification.recipient_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()

    return notifications

# ==================== BULK IMPORT STUDENTS ====================

class StudentImportItem(BaseModel):
    student_id: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    program: Optional[str] = None
    year_of_study: Optional[int] = None

@router.post("/bulk-import")
async def bulk_import_students(
    students_data: List[StudentImportItem],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USER_CREATE))
):
    """
    Bulk import students - APPEND MODE.
    Adds new students or updates existing ones. NEVER deletes.
    """
    # Security: cap the number of rows per import
    MAX_IMPORT_ROWS = 5000
    if len(students_data) > MAX_IMPORT_ROWS:
        raise HTTPException(
            status_code=413, 
            detail=f"Too many rows. Maximum {MAX_IMPORT_ROWS} per import."
        )

    created_count = 0
    updated_count = 0
    errors = []

    for item in students_data:
        try:
            if not item.student_id or not item.first_name or not item.last_name:
                errors.append(f"Missing required fields for row: {item.student_id or 'UNKNOWN'}")
                continue

            # Check if student already exists
            existing = db.query(Student).filter(Student.student_id == item.student_id).first()

            if existing:
                # UPDATE existing student (append mode - don't delete)
                existing.first_name = item.first_name
                existing.last_name = item.last_name
                if item.email: existing.email = item.email
                if item.program: existing.program = item.program
                if item.year_of_study: existing.year_of_study = item.year_of_study
                updated_count += 1
            else:
                # CREATE new student
                new_student = Student(
                    student_id=item.student_id,
                    first_name=item.first_name,
                    last_name=item.last_name,
                    email=item.email,
                    program=item.program,
                    year_of_study=item.year_of_study or 1
                )
                db.add(new_student)
                created_count += 1

            db.commit()

        except Exception as e:
            errors.append(f"Row {item.student_id}: {str(e)}")
            db.rollback()

    await log_audit(db, current_user.id, "STUDENTS_BULK_IMPORTED", "admin",
                    f"Imported students: {created_count} created, {updated_count} updated")

    return {
        "message": f"Import complete! {created_count} created, {updated_count} updated.",
        "created": created_count,
        "updated": updated_count,
        "errors": errors
    }
