from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..models.models import User, Student, RegistryInventory, ClearanceStatus
from ..schemas.schemas import CertificateCreate, CertificateUpdate, CertificateResponse, CertificateStatus
from ..auth.auth import get_current_active_user
from ..core.permissions import require_permission, Permission
from ..utils.audit import log_audit
from ..utils.qr_generator import generate_qr_code
from ..utils.pdf_generator import generate_certificate_pdf
from datetime import datetime

router = APIRouter(prefix="/certificates", tags=["Certificates"])

@router.post("/", response_model=CertificateResponse)
async def create_certificate(
    certificate: CertificateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REGISTRY_ADD_INVENTORY))
):
    # Check if student exists
    student = db.query(Student).filter(Student.id == certificate.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Check if certificate number is unique
    existing = db.query(RegistryInventory).filter(
        RegistryInventory.certificate_number == certificate.certificate_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Certificate number already exists")

    db_certificate = RegistryInventory(
        certificate_number=certificate.certificate_number,
        student_id=certificate.student_id,
        programme=student.program,
        status=CertificateStatus.AWAITING_CLEARANCE
    )
    db.add(db_certificate)
    db.commit()
    db.refresh(db_certificate)

    await log_audit(db, current_user.id, "CERTIFICATE_CREATED", "registry",
                    f"Created certificate: {certificate.certificate_number} for student {student.student_id}")

    return db_certificate

@router.get("/", response_model=List[CertificateResponse])
async def get_certificates(
    skip: int = 0,
    limit: int = 100,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REGISTRY_VIEW_INVENTORY))
):
    query = db.query(RegistryInventory)
    if student_id:
        query = query.filter(RegistryInventory.student_id == student_id)
    return query.offset(skip).limit(limit).all()

@router.get("/{certificate_id}", response_model=CertificateResponse)
async def get_certificate(
    certificate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REGISTRY_VIEW_INVENTORY))
):
    certificate = db.query(RegistryInventory).filter(RegistryInventory.id == certificate_id).first()
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return certificate

@router.put("/{certificate_id}", response_model=CertificateResponse)
async def update_certificate(
    certificate_id: int,
    certificate_update: CertificateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REGISTRY_UPDATE_INVENTORY))
):
    certificate = db.query(RegistryInventory).filter(RegistryInventory.id == certificate_id).first()
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    for key, value in certificate_update.model_dump(exclude_unset=True).items():
        setattr(certificate, key, value)

    db.commit()
    db.refresh(certificate)

    await log_audit(db, current_user.id, "CERTIFICATE_UPDATED", "registry",
                    f"Updated certificate: {certificate.certificate_number}")

    return certificate

@router.post("/{certificate_id}/verify")
async def verify_certificate(
    certificate_id: int,
    db: Session = Depends(get_db)
):
    """
    PUBLIC ENDPOINT: No security guard here! 
    This allows employers or anyone with a QR code to verify a certificate 
    without needing to log into the university system.
    """
    certificate = db.query(RegistryInventory).filter(RegistryInventory.id == certificate_id).first()
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    student = db.query(Student).filter(Student.id == certificate.student_id).first()

    return {
        "valid": certificate.status == CertificateStatus.COLLECTED,
        "certificate_number": certificate.certificate_number,
        "student_name": f"{student.first_name} {student.last_name}",
        "programme": certificate.programme,
        "status": certificate.status,
        "collection_date": certificate.collection.created_at if hasattr(certificate, 'collection') and certificate.collection else None
    }
