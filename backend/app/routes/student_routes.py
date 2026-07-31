from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..models.models import (
    User, Student, ClearanceRequest, FinanceClearance, 
    ExaminationClearance, RegistryInventory
)
from ..schemas.schemas import StudentCreate, StudentUpdate, StudentResponse
from ..auth.auth import get_current_active_user, role_required
from ..utils.audit import log_audit

router = APIRouter(prefix="/students", tags=["Students"])

@router.post("/", response_model=StudentResponse)
async def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["super_admin", "registry_officer", "academic_office"]))
):
    # Check if student_id exists
    existing = db.query(Student).filter(Student.student_id == student.student_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student ID already exists")

    # Check if user exists
    user = db.query(User).filter(User.id == student.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db_student = Student(**student.model_dump())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)

    # Create clearance request record
    clearance_request = ClearanceRequest(
        student_id=db_student.id,
        student_user_id=student.user_id,
        overall_status="pending"
    )
    db.add(clearance_request)
    db.commit()
    db.refresh(clearance_request)

    # Create finance clearance record
    finance = FinanceClearance(
        clearance_request_id=clearance_request.id,
        status="pending"
    )
    db.add(finance)

    # Create examination clearance record
    examination = ExaminationClearance(
        clearance_request_id=clearance_request.id,
        status="pending"
    )
    db.add(examination)
    db.commit()

    await log_audit(db, current_user.id, "STUDENT_CREATED", "student", f"Created student: {student.student_id}")

    return db_student

@router.get("/", response_model=List[StudentResponse])
async def get_students(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    adm_no: Optional[str] = None,
    student_name: Optional[str] = None,
    course: Optional[str] = None,
    certificate_no: Optional[str] = None,
    level_from: Optional[int] = None,
    level_to: Optional[int] = None,
    year: Optional[str] = None,
    program: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get students with advanced search filters"""
    query = db.query(Student)
    
    # Search by ADM No (student_id)
    if adm_no:
        query = query.filter(Student.student_id.contains(adm_no))
    
    # Search by student name
    if student_name:
        query = query.filter(
            (Student.first_name.contains(student_name)) |
            (Student.last_name.contains(student_name)) |
            (Student.middle_name.contains(student_name))
        )
    
    # Search by course/program
    if course or program:
        search_program = course or program
        query = query.filter(Student.program.contains(search_program))
    
    # Search by certificate number (from RegistryInventory)
    if certificate_no:
        query = query.join(RegistryInventory).filter(
            RegistryInventory.certificate_number.contains(certificate_no)
        )
    
    # Filter by level (year_of_study)
    if level_from is not None:
        query = query.filter(Student.year_of_study >= level_from)
    if level_to is not None:
        query = query.filter(Student.year_of_study <= level_to)
    
    # Search by year (enrollment or graduation year)
    # Note: If enrollment_date/graduation_date are Date/DateTime objects, 
    # you may need to cast them to String depending on your DB (e.g., cast(Student.enrollment_date, String).contains(year))
    if year:
        query = query.filter(
            (Student.enrollment_date.contains(year)) |
            (Student.graduation_date.contains(year))
        )
    
    # General search (legacy)
    if search:
        query = query.filter(
            (Student.first_name.contains(search)) |
            (Student.last_name.contains(search)) |
            (Student.student_id.contains(search)) |
            (Student.email.contains(search)) |
            (Student.program.contains(search))
        )
    
    return query.offset(skip).limit(limit).all()

@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: int,
    student_update: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["super_admin", "registry_officer", "academic_office"]))
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    for key, value in student_update.model_dump(exclude_unset=True).items():
        setattr(student, key, value)

    db.commit()
    db.refresh(student)

    await log_audit(db, current_user.id, "STUDENT_UPDATED", "student", f"Updated student: {student.student_id}")

    return student

@router.delete("/{student_id}")
async def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["super_admin"]))
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Delete associated clearance records
    clearance = db.query(ClearanceRequest).filter(ClearanceRequest.student_id == student_id).first()
    if clearance:
        db.query(FinanceClearance).filter(FinanceClearance.clearance_request_id == clearance.id).delete()
        db.query(ExaminationClearance).filter(ExaminationClearance.clearance_request_id == clearance.id).delete()
        db.delete(clearance)

    db.delete(student)
    db.commit()

    await log_audit(db, current_user.id, "STUDENT_DELETED", "student", f"Deleted student: {student.student_id}")

    return {"message": "Student deleted successfully"}
