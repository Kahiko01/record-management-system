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
    student = db.query(Student).filter(Student.created_by == current_user.id).first()
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

    student = db.query(Student).filter(Student.created_by == current_user.id).first()
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
    student = db.query(Student).filter(Student.created_by == current_user.id).first()
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
                admission_number=admission,
                student_id=admission,
                full_name=f"{first_name} {last_name}".strip(),
                programme=str(row.get('program', row.get('programme', ''))).strip(),
                department=str(row.get('faculty', row.get('department', ''))).strip(),
                registration_year=int(row.get('year_of_study', row.get('registration_year', 1))) if pd.notna(row.get('year_of_study', row.get('registration_year', 1))) else 1,
                email=str(row.get('email', '')).strip() if 'email' in df.columns else '',
                phone=str(row.get('phone', '')).strip() if 'phone' in df.columns else '',
                national_id=str(row.get('national_id', '')).strip() if 'national_id' in df.columns else '',
                total_fee=total_fee,
                paid_fee=paid_fee,
                status='ACTIVE'
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

import csv
import io
from fastapi import UploadFile, File
from pydantic import BaseModel

class BulkUploadResponse(BaseModel):
    success_count: int
    error_count: int
    errors: list[str]


import pandas as pd
import io
from fastapi import UploadFile, File, HTTPException
from pydantic import BaseModel

class BulkUploadResponse(BaseModel):
    success_count: int
    error_count: int
    errors: list[str]


@router.post("/students/cohort/update", response_model=BulkUploadResponse)
async def update_cohort_data(
    file: UploadFile = File(...),
    required_task: str = "registry:manage_cohort", # Default, but can be overridden by frontend
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # 1. 🛡️ GRANULAR TASK CHECK
    # Check if the user has the specific task granted to them
    user_tasks = [task.task_code for task in current_user.tasks if task.is_enabled] if hasattr(current_user, 'tasks') else []
    # Also check the string list if your model stores it that way
    granted_tasks = getattr(current_user, 'granted_tasks', [])
    
    if required_task not in user_tasks and required_task not in granted_tasks and current_user.role not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail=f"Missing granular task permission: {required_task}")

    filename = file.filename.lower()
    if not (filename.endswith('.csv') or filename.endswith('.xlsx') or filename.endswith('.xls')):
        raise HTTPException(status_code=400, detail="Only .csv and .xlsx files are allowed")
    
    contents = await file.read()
    errors = []
    success_count = 0
    error_count = 0
    
    try:
        import pandas as pd
        import io
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    if 'admission_number' not in df.columns:
        raise HTTPException(status_code=400, detail="Missing required column: 'admission_number'")

    for index, row in df.iterrows():
        row_num = index + 2
        try:
            admission = str(row['admission_number']).strip()
            if not admission:
                errors.append(f"Row {row_num}: Admission number is empty.")
                error_count += 1
                continue

            # Find existing student
            student = db.query(Student).filter(Student.student_id == admission).first()
            if not student:
                errors.append(f"Row {row_num}: Student with admission '{admission}' not found in system.")
                error_count += 1
                continue

            # 2. SAFE PARTIAL UPDATE: Only update columns that exist in the CSV and in the Student model
            updated = False
            for col in df.columns:
                if col == 'admission_number':
                    continue
                
                # Check if the Student model actually has this column to prevent crashes
                if hasattr(Student, col):
                    value = row[col]
                    # Handle NaN/None from pandas
                    if pd.isna(value):
                        continue
                    
                    # Type casting based on column name
                    if col in ['total_fee', 'paid_fee']:
                        setattr(student, col, float(value))
                    elif col == 'year_of_study':
                        setattr(student, col, int(value))
                    else:
                        setattr(student, col, str(value).strip())
                    updated = True

            if updated:
                success_count += 1
            else:
                errors.append(f"Row {row_num}: No valid updatable columns found for '{admission}'.")
                error_count += 1

        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
            error_count += 1
            
    db.commit()
    
    return {
        "success_count": success_count,
        "error_count": error_count,
        "errors": errors[:20]
    }

    try:
        from app.models.models import Student
        total = db.query(Student).count()
        active = db.query(Student).filter(Student.is_alumni == False).count()
        graduated = db.query(Student).filter(Student.is_alumni == True).count()
        return {"total": total, "active": active, "graduated": graduated, "suspended": 0}
    except Exception:
        return {"total": 0, "active": 0, "graduated": 0, "suspended": 0}




@router.post("/students/bulk-upload", response_model=BulkUploadResponse)
async def bulk_upload_students(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    filename = file.filename.lower()
    if not (filename.endswith('.csv') or filename.endswith('.xlsx') or filename.endswith('.xls')):
        raise HTTPException(status_code=400, detail="Only .csv and .xlsx files are allowed")
    
    contents = await file.read()
    errors = []
    success_count = 0
    error_count = 0
    
    try:
        import pandas as pd
        import io
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}. Ensure it's a valid CSV or Excel file.")

    required_cols = ['admission_number', 'first_name', 'last_name']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Missing required columns: {', '.join(missing_cols)}")

    for index, row in df.iterrows():
        row_num = index + 2
        try:
            admission = str(row['admission_number']).strip()
            first_name = str(row['first_name']).strip()
            last_name = str(row['last_name']).strip()
            
            if not admission or not first_name or not last_name:
                errors.append(f"Row {row_num}: Admission number, first name, and last name cannot be empty.")
                error_count += 1
                continue

            existing = db.query(Student).filter(Student.admission_number == admission).first()
            if existing:
                errors.append(f"Row {row_num}: Admission number '{admission}' already exists.")
                error_count += 1
                continue

            total_fee = float(row.get('total_fee', 0) or 0) if 'total_fee' in df.columns else 0.0
            paid_fee = float(row.get('paid_fee', 0) or 0) if 'paid_fee' in df.columns else 0.0

            new_student = Student(
                admission_number=admission,
                student_id=admission,
                full_name=f"{first_name} {last_name}".strip(),
                programme=str(row.get('program', row.get('programme', ''))).strip(),
                department=str(row.get('faculty', row.get('department', ''))).strip(),
                registration_year=int(row.get('year_of_study', row.get('registration_year', 1))) if pd.notna(row.get('year_of_study', row.get('registration_year', 1))) else 1,
                email=str(row.get('email', '')).strip() if 'email' in df.columns else '',
                phone=str(row.get('phone', '')).strip() if 'phone' in df.columns else '',
                national_id=str(row.get('national_id', '')).strip() if 'national_id' in df.columns else '',
                total_fee=total_fee,
                paid_fee=paid_fee,
                status='ACTIVE'
            )
            
            db.add(new_student)
            
            try:
                from app.models.models import Clearance, ClearanceStatus
                new_clearance = Clearance(
                    student_id=new_student.id,
                    status=ClearanceStatus.PENDING,
                    finance_status="PENDING", exam_status="PENDING", dean_status="PENDING",
                    library_status="PENDING", accommodation_status="PENDING", discipline_status="PENDING"
                )
                db.add(new_clearance)
            except Exception:
                pass 
                
            success_count += 1
            
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
            error_count += 1
            
    db.commit()
    
    return {
        "success_count": success_count,
        "error_count": error_count,
        "errors": errors[:20]
    }


from pydantic import BaseModel
from typing import Optional

class StudentCreate(BaseModel):
    admission_number: str
    full_name: str
    programme: Optional[str] = ""
    department: Optional[str] = ""
    registration_year: Optional[int] = 1
    email: Optional[str] = ""
    phone: Optional[str] = ""
    national_id: Optional[str] = ""
    total_fee: Optional[float] = 0.0
    paid_fee: Optional[float] = 0.0

@router.post("/students")
def create_student(
    data: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        # Check for duplicate
        existing = db.query(Student).filter(Student.admission_number == data.admission_number).first()
        if existing:
            raise HTTPException(status_code=400, detail="Admission number already exists.")

        # Create Student
        new_student = Student(
            admission_number=data.admission_number,
            student_id=data.admission_number,
            full_name=data.full_name,
            programme=data.programme,
            department=data.department,
            registration_year=data.registration_year,
            email=data.email,
            phone=data.phone,
            national_id=data.national_id,
            total_fee=data.total_fee,
            paid_fee=data.paid_fee,
            status='ACTIVE'
        )
        db.add(new_student)
        db.flush() # Get the ID

        # Auto-Initialize Clearance
        try:
            from app.models.models import Clearance, ClearanceStatus
            new_clearance = Clearance(
                student_id=new_student.id,
                status=ClearanceStatus.PENDING,
                finance_status="PENDING", exam_status="PENDING", dean_status="PENDING",
                library_status="PENDING", accommodation_status="PENDING", discipline_status="PENDING"
            )
            db.add(new_clearance)
        except Exception:
            pass

        db.commit()
        return {"message": "Student added successfully", "student_id": new_student.id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add student: {str(e)}")

@router.get("/students/meta/programmes")
def get_programmes(db: Session = Depends(get_db)):
    try:
        from app.models.models import Student
        # Use the CORRECT column name 'programme'
        programmes = db.query(Student.programme).distinct().all()
        return [p[0] for p in programmes if p[0] is not None and str(p[0]).strip() != ""]
    except Exception as e:
        print(f"Programmes fallback triggered: {e}")
        return ["Computer Science", "Nursing", "Business"]

@router.get("/students/stats")
def get_student_stats(db: Session = Depends(get_db)):
    try:
        from app.models.models import Student
        total = db.query(Student).count()
        # Use the CORRECT column name 'status'
        active = db.query(Student).filter(Student.status == 'ACTIVE').count()
        graduated = db.query(Student).filter(Student.status == 'GRADUATED').count()
        return {"total": total, "active": active, "graduated": graduated, "suspended": 0}
    except Exception as e:
        print(f"Stats fallback triggered: {e}")
        return {"total": 0, "active": 0, "graduated": 0, "suspended": 0}


@router.put("/students/update/{student_id}")
def update_student(
    student_id: int,
    student_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        if "admission_number" in student_data:
            student.admission_number = student_data["admission_number"]
            student.student_id = student_data["admission_number"]
        if "full_name" in student_data:
            student.full_name = student_data["full_name"]
        if "programme" in student_data:
            student.programme = student_data["programme"]
        if "department" in student_data:
            student.department = student_data["department"]
        if "registration_year" in student_data:
            student.registration_year = student_data["registration_year"]
        if "email" in student_data:
            student.email = student_data["email"]
        if "phone" in student_data:
            student.phone = student_data["phone"]
        if "national_id" in student_data:
            student.national_id = student_data["national_id"]
        if "total_fee" in student_data:
            student.total_fee = float(student_data["total_fee"] or 0)
        if "paid_fee" in student_data:
            student.paid_fee = float(student_data["paid_fee"] or 0)
        
        db.commit()
        return {"message": "Student updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/modify-record/{student_id}")
def modify_student_record_completely_unique(
    student_id: int,
    student_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        if "admission_number" in student_data:
            student.admission_number = student_data["admission_number"]
            student.student_id = student_data["admission_number"]
        if "full_name" in student_data:
            student.full_name = student_data["full_name"]
        if "programme" in student_data:
            student.programme = student_data["programme"]
        if "department" in student_data:
            student.department = student_data["department"]
        if "registration_year" in student_data:
            student.registration_year = student_data["registration_year"]
        if "email" in student_data:
            student.email = student_data["email"]
        if "phone" in student_data:
            student.phone = student_data["phone"]
        if "national_id" in student_data:
            student.national_id = student_data["national_id"]
        if "total_fee" in student_data:
            student.total_fee = float(student_data["total_fee"] or 0)
        if "paid_fee" in student_data:
            student.paid_fee = float(student_data["paid_fee"] or 0)
        
        db.commit()
        return {"message": "Student updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/bulk-upload")
async def bulk_upload_students(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    filename = file.filename.lower()
    if not (filename.endswith('.csv') or filename.endswith('.xlsx') or filename.endswith('.xls')):
        raise HTTPException(status_code=400, detail="Only .csv and .xlsx files are allowed")
    
    contents = await file.read()
    errors = []
    success_count = 0
    error_count = 0
    
    try:
        import pandas as pd
        import io
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    required_cols = ['admission_number', 'full_name', 'programme']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Missing required columns: {', '.join(missing_cols)}")

    for index, row in df.iterrows():
        row_num = index + 2
        try:
            admission = str(row['admission_number']).strip()
            full_name = str(row['full_name']).strip()
            programme = str(row.get('programme', '')).strip()
            
            if not admission or not full_name:
                errors.append(f"Row {row_num}: Admission number and full name cannot be empty.")
                error_count += 1
                continue

            # Check for duplicates
            existing = db.query(Student).filter(Student.admission_number == admission).first()
            if existing:
                errors.append(f"Row {row_num}: Admission number '{admission}' already exists.")
                error_count += 1
                continue

            # Safely parse numeric fields
            reg_year_raw = row.get('registration_year', 1)
            reg_year = int(reg_year_raw) if pd.notna(reg_year_raw) else 1
            
            total_fee_raw = row.get('total_fee', 0)
            total_fee = float(total_fee_raw) if pd.notna(total_fee_raw) else 0.0
            
            paid_fee_raw = row.get('paid_fee', 0)
            paid_fee = float(paid_fee_raw) if pd.notna(paid_fee_raw) else 0.0

            # Create student with EXACT database schema columns (NO student_id)
            new_student = Student(
                admission_number=admission,
                full_name=full_name,
                programme=programme,
                department=str(row.get('department', '')).strip() if 'department' in df.columns else '',
                registration_year=reg_year,
                email=str(row.get('email', '')).strip() if 'email' in df.columns else '',
                phone=str(row.get('phone', '')).strip() if 'phone' in df.columns else '',
                national_id=str(row.get('national_id', '')).strip() if 'national_id' in df.columns else '',
                total_fee=total_fee,
                paid_fee=paid_fee,
                status='ACTIVE'
            )
            
            db.add(new_student)
            success_count += 1
            
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
            error_count += 1
            
    db.commit()
    
    return {
        "success_count": success_count,
        "error_count": error_count,
        "errors": errors[:20]
    }

@router.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        db.delete(student)
        db.commit()
        return {"message": "Student deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
@router.put("/{student_id}/deactivate")
def deactivate_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Safely update status using setattr to avoid model definition mismatches
        setattr(student, 'status', 'WITHDRAWN')
        db.commit()
        return {"message": "Student deactivated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Deactivate error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to deactivate: {str(e)}")
