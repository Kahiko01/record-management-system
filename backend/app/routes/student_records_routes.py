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
    active = db.query(Student).filter(Student.status == "ACTIVE", Student.deleted_at == None).count()
    graduated = db.query(Student).filter(Student.status == "GRADUATED", Student.deleted_at == None).count()
    
    programme_counts = (
        db.query(Student.programme, func.count(Student.id))
        .filter(Student.deleted_at == None)
        .group_by(Student.programme)
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
                Student.admission_number.ilike(search_term),
                Student.full_name.ilike(search_term),
                Student.email.ilike(search_term),
                Student.national_id.ilike(search_term)
            )
        )
    
    if program:
        query = query.filter(Student.programme == program)
        
    total = query.count()
    students = query.order_by(Student.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    
    return {
        "students": [
            {
                "id": s.id,
                "admission_number": s.admission_number,
                "full_name": s.full_name,
                "programme": s.programme,
                "department": s.department,
                "school": s.school,
                "registration_year": s.registration_year,
                "status": s.status or "ACTIVE",
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
        db.query(Student.programme)
        .filter(Student.programme != None, Student.deleted_at == None)
        .distinct()
        .order_by(Student.programme)
        .all()
    )
    return [p[0] for p in programmes if p[0]]

@router.post("/", response_model=dict)
async def create_student(
    student_data: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new student record manually"""
    # Check for duplicate admission number
    existing = db.query(Student).filter(Student.admission_number == student_data.admission_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Admission number already exists")
    
    # Check for duplicate national ID (if provided)
    if student_data.national_id:
        existing_nid = db.query(Student).filter(Student.national_id == student_data.national_id).first()
        if existing_nid:
            raise HTTPException(status_code=400, detail="National ID already registered")

    new_student = Student(
        admission_number=student_data.admission_number,
        full_name=student_data.full_name,
        programme=student_data.programme,
        department=student_data.department,
        school=student_data.school,
        registration_year=student_data.registration_year,
        status=student_data.status or "ACTIVE",
        gender=student_data.gender,
        date_of_birth=student_data.date_of_birth,
        national_id=student_data.national_id,
        email=student_data.email,
        phone=student_data.phone,
        address=student_data.address,
        guardian_name=student_data.guardian_name,
        guardian_phone=student_data.guardian_phone,
        created_by=current_user.id
    )
    
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    
    await log_audit(
        db, current_user.id, "STUDENT_CREATED", "students",
        details=f"Created student: {new_student.full_name} ({new_student.admission_number})",
        ip_address=None, # Add request IP if available
        severity="info"
    )
    
    return {"message": "Student created successfully", "student_id": new_student.id, "admission_number": new_student.admission_number}


import csv
import io
from fastapi import UploadFile, File

from pydantic import BaseModel
from typing import Optional

class StudentImportData(BaseModel):
    admission_number: str
    full_name: str
    programme: str
    department: Optional[str] = None
    school: Optional[str] = None
    registration_year: Optional[int] = None
    status: Optional[str] = "ACTIVE"
    gender: Optional[str] = None
    national_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None





@router.post("/bulk-preview")
async def preview_bulk_students(
    file: UploadFile = File(..., description="CSV file to preview"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Preview and validate student data from CSV before importing"""
    print(f"📁 Received file: {file.filename}, content-type: {file.content_type}")
    
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        contents = await file.read()
        csv_data = contents.decode('utf-8')
        print(f"📄 CSV data length: {len(csv_data)} characters")
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
    
    import csv
    import io
    
    try:
        reader = csv.DictReader(io.StringIO(csv_data))
        print(f"📊 CSV columns found: {reader.fieldnames}")
    except Exception as e:
        print(f"❌ Error parsing CSV: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")
    
    valid_students = []
    errors = []
    
    required_cols = {'admission_number', 'full_name', 'programme'}
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV file is empty or has no headers")
    
    if not required_cols.issubset(set(reader.fieldnames)):
        missing = required_cols - set(reader.fieldnames)
        raise HTTPException(status_code=400, detail=f"CSV must contain columns: {', '.join(required_cols)}. Missing: {', '.join(missing)}")
    
    # Get existing data for validation
    existing_admissions = {s.admission_number for s in db.query(Student.admission_number).filter(Student.deleted_at == None).all()}
    existing_nids = {s.national_id for s in db.query(Student.national_id).filter(Student.deleted_at == None).all() if s.national_id}
    
    row_num = 1
    for row in reader:
        row_num += 1
        admission = row.get('admission_number', '').strip()
        full_name = row.get('full_name', '').strip()
        programme = row.get('programme', '').strip()
        national_id = row.get('national_id', '').strip()
        
        row_errors = []
        if not admission:
            row_errors.append("Missing admission_number")
        elif admission in existing_admissions:
            row_errors.append("Admission number already exists")
            
        if not full_name:
            row_errors.append("Missing full_name")
        if not programme:
            row_errors.append("Missing programme")
            
        if national_id and national_id in existing_nids:
            row_errors.append("National ID already registered")
            
        if row_errors:
            errors.append({
                "row": row_num,
                "admission_number": admission or "N/A",
                "full_name": full_name or "N/A",
                "errors": row_errors
            })
        else:
            valid_students.append({
                "admission_number": admission,
                "full_name": full_name,
                "programme": programme,
                "department": row.get('department', '').strip(),
                "school": row.get('school', '').strip(),
                "registration_year": int(row.get('registration_year', 0)) if row.get('registration_year') else None,
                "status": row.get('status', 'ACTIVE').strip(),
                "gender": row.get('gender', '').strip(),
                "national_id": national_id,
                "email": row.get('email', '').strip(),
                "phone": row.get('phone', '').strip()
            })
    
    print(f"✅ Preview complete: {len(valid_students)} valid, {len(errors)} invalid")
    
    return {
        "total_rows": row_num - 1,
        "valid_count": len(valid_students),
        "invalid_count": len(errors),
        "errors": errors,
        "preview": valid_students[:10],
        "all_valid_students": valid_students
    }







from fastapi import Body



from fastapi import Request


@router.get("/{student_id}")
async def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a single student by ID for editing"""
    student = db.query(Student).filter(Student.id == student_id, Student.deleted_at == None).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return {
        "id": student.id,
        "admission_number": student.admission_number,
        "full_name": student.full_name,
        "programme": student.programme,
        "department": student.department,
        "school": student.school,
        "registration_year": student.registration_year,
        "status": student.status,
        "gender": student.gender,
        "date_of_birth": student.date_of_birth,
        "national_id": student.national_id,
        "email": student.email,
        "phone": student.phone,
        "address": student.address,
        "guardian_name": student.guardian_name,
        "guardian_phone": student.guardian_phone
    }

@router.post("/bulk-import-records")
async def confirm_bulk_import(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Confirm and execute the bulk import of validated students"""
    # Read the raw JSON body directly
    try:
        body = await request.json()
        print(f"📥 Received body type: {type(body)}")
        print(f"📥 Received {len(body) if isinstance(body, list) else 'N/A'} items")
        if isinstance(body, list) and len(body) > 0:
            print(f"📋 First item keys: {list(body[0].keys())}")
    except Exception as e:
        print(f"❌ Failed to parse JSON body: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    
    if not isinstance(body, list):
        raise HTTPException(status_code=400, detail="Expected a JSON array of students")
    
    created_count = 0
    errors = []
    
    for idx, data in enumerate(body):
        try:
            if not isinstance(data, dict):
                errors.append(f"Row {idx+1}: Data must be an object")
                continue
            
            admission = str(data.get('admission_number', '')).strip()
            full_name = str(data.get('full_name', '')).strip()
            programme = str(data.get('programme', '')).strip()
            
            if not admission or not full_name or not programme:
                errors.append(f"Row {idx+1}: Missing required fields")
                continue
            
            # Check for duplicate admission number
            existing = db.query(Student).filter(
                Student.admission_number == admission,
                Student.deleted_at == None
            ).first()
            
            if existing:
                errors.append(f"Row {idx+1}: Admission number {admission} already exists")
                continue
            
            # Parse registration_year safely
            reg_year = data.get('registration_year')
            try:
                reg_year = int(reg_year) if reg_year else None
            except (ValueError, TypeError):
                reg_year = None
            
            new_student = Student(
                admission_number=admission,
                full_name=full_name,
                programme=programme,
                department=str(data.get('department', '')).strip() or None,
                school=str(data.get('school', '')).strip() or None,
                registration_year=reg_year,
                status=str(data.get('status', 'ACTIVE')).strip() or 'ACTIVE',
                gender=str(data.get('gender', '')).strip() or None,
                national_id=str(data.get('national_id', '')).strip() or None,
                email=str(data.get('email', '')).strip() or None,
                phone=str(data.get('phone', '')).strip() or None,
                created_by=current_user.id
            )
            db.add(new_student)
            created_count += 1
            print(f"✅ Prepared student: {full_name} ({admission})")
            
        except Exception as e:
            errors.append(f"Row {idx+1}: Error - {str(e)}")
            print(f"❌ Error on row {idx+1}: {e}")
            continue
    
    try:
        db.commit()
        print(f"✅ Successfully imported {created_count} students")
    except Exception as e:
        db.rollback()
        print(f"❌ Database commit failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save: {str(e)}")
    
    try:
        await log_audit(
            db, current_user.id, "BULK_STUDENTS_IMPORTED", "students",
            details=f"Bulk imported {created_count} students",
            severity="info"
        )
    except:
        pass
    
    if errors:
        return {"message": f"Imported {created_count} students with {len(errors)} errors", "count": created_count, "errors": errors}
    
    return {"message": f"Successfully imported {created_count} students", "count": created_count}

@router.post("/bulk-delete-preview")
async def preview_bulk_delete(
    admission_numbers: list[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Preview students that will be deleted before actually deleting them"""
    students_to_delete = db.query(Student).filter(
        Student.admission_number.in_(admission_numbers),
        Student.deleted_at == None
    ).all()
    
    found_admissions = {s.admission_number for s in students_to_delete}
    not_found = [adm for adm in admission_numbers if adm not in found_admissions]
    
    return {
        "found_count": len(students_to_delete),
        "not_found_count": len(not_found),
        "not_found_admissions": not_found,
        "preview": [{"admission_number": s.admission_number, "full_name": s.full_name, "programme": s.programme} for s in students_to_delete[:10]]
    }

@router.post("/bulk-delete")
async def confirm_bulk_delete(
    admission_numbers: list[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Soft delete the confirmed students"""
    deleted_count = db.query(Student).filter(
        Student.admission_number.in_(admission_numbers),
        Student.deleted_at == None
    ).update({"deleted_at": func.now()}, synchronize_session=False)
    
    db.commit()
    
    await log_audit(
        db, current_user.id, "BULK_STUDENTS_DELETED", "students",
        details=f"Soft deleted {deleted_count} students",
        severity="medium"
    )
    
    return {"message": f"Successfully deleted {deleted_count} students", "count": deleted_count}

