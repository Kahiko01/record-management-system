from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from ..core.database import get_db
from ..models.models import User, Student, UserRole
from ..auth.auth import get_password_hash
from ..core.permissions import require_permission, Permission
from ..utils.audit import log_audit

router = APIRouter(prefix="/students", tags=["Student Import"])

class StudentImportItem(BaseModel):
    student_id: str
    first_name: str
    last_name: str
    email: str
    program: str
    year_of_study: int

@router.post("/bulk-import")
async def bulk_import_students(
    students_data: List[StudentImportItem],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USER_CREATE))
):
    """Bulk import students from Excel. Creates both Student and User accounts."""
    created_count = 0
    skipped_count = 0
    errors = []

    for item in students_data:
        try:
            # Check if student already exists
            existing_student = db.query(Student).filter(Student.student_id == item.student_id).first()
            if existing_student:
                skipped_count += 1
                continue

            # Create User Account (username = ADM No, default password = student123)
            username = item.student_id.strip().lower().replace(" ", "")
            existing_user = db.query(User).filter(User.username == username).first()

            if not existing_user:
                new_user = User(
                    username=username,
                    email=item.email,
                    full_name=f"{item.first_name} {item.last_name}",
                    hashed_password=get_password_hash("student123"),
                    # role=UserRole.STUDENT,  # 🚫 Students don't have system access
                    role=None,  # Students are records, not system users
                    is_active=False  # Disabled by default - no system access
                )
                db.add(new_user)
                db.commit()
                db.refresh(new_user)
                user_id = new_user.id
            else:
                user_id = existing_user.id

            # Create Student Record
            new_student = Student(
                student_id=item.student_id,
                user_id=user_id,
                first_name=item.first_name,
                last_name=item.last_name,
                email=item.email,
                program=item.program,
                year_of_study=item.year_of_study
            )
            db.add(new_student)
            db.commit()
            created_count += 1

        except Exception as e:
            errors.append(f"Row {item.student_id}: {str(e)}")

    await log_audit(db, current_user.id, "STUDENTS_BULK_IMPORTED", "student_management",
                    f"Imported {created_count} students, skipped {skipped_count}")

    return {
        "message": f"Import completed",
        "created": created_count,
        "skipped": skipped_count,
        "errors": errors
    }
