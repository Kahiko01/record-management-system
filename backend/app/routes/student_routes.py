from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from typing import List

# 1. IMPORT OUR SECURITY TOOLS
from app.core.permissions import require_permission, Permission, require_student_ownership
from app.core.database import get_db
from app.auth.auth import get_current_active_user

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
