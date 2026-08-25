from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from ..core.database import get_db
from ..auth.auth import get_current_active_user
from ..models.models import User, Student

router = APIRouter(prefix="/students", tags=["Student Records"])

class StudentCreate(BaseModel):
    student_id: str
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    program: str
    faculty: Optional[str] = None
    year_of_study: Optional[int] = 1
    email: Optional[str] = None
    phone: Optional[str] = None
    national_id: Optional[str] = None

@router.get("/stats")
async def get_student_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    total = db.query(Student).filter(Student.deleted_at == None).count()
    active = db.query(Student).filter(Student.is_alumni == False, Student.deleted_at == None).count()
    graduated = db.query(Student).filter(Student.is_alumni == True, Student.deleted_at == None).count()
    
    programme_counts = (
        db.query(Student.program, func.count(Student.id))
        .filter(Student.deleted_at == None)
        .group_by(Student.program)
        .order_by(func.count(Student.id).desc())
        .limit(5)
        .all()
    )
    
    return {
        "total": total,
        "active": active,
        "graduated": graduated,
        "suspended": 0,
        "by_programme": [{"programme": p or "Unknown", "count": c} for p, c in programme_counts],
        "by_year": []
    }

@router.get("")
async def list_students(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    program: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Student).filter(Student.deleted_at == None)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Student.student_id.ilike(search_term),
                Student.first_name.ilike(search_term),
                Student.last_name.ilike(search_term),
                Student.email.ilike(search_term)
            )
        )
    
    if program:
        query = query.filter(Student.program == program)
        
    total = query.count()
    students = query.order_by(Student.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    
    return {
        "students": [
            {
                "id": s.id,
                "admission_number": s.student_id, # Map to frontend expectation
                "full_name": f"{s.first_name} {s.middle_name or ''} {s.last_name}".strip(),
                "programme": s.program,
                "department": s.faculty,
                "school": s.faculty,
                "registration_year": s.year_of_study,
                "status": "GRADUATED" if s.is_alumni else "ACTIVE",
                "email": s.email,
                "phone": s.phone,
                "created_at": s.created_at.isoformat() if s.created_at else None
            }
            for s in students
        ],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": (total + per_page - 1) // per_page
        }
    }

@router.get("/meta/programmes")
async def get_programmes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    programmes = (
        db.query(Student.program)
        .filter(Student.program != None, Student.deleted_at == None)
        .distinct()
        .order_by(Student.program)
        .all()
    )
    return [p[0] for p in programmes if p[0]]
