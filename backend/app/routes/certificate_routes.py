from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..models.models import User, Student, RegistryInventory, ClearanceStatus, ClearanceRequest
from ..schemas.schemas import CertificateCreate, CertificateUpdate, CertificateResponse, CertificateStatus
from ..auth.auth import get_current_active_user
from ..core.permissions import require_permission, Permission
from ..utils.audit import log_audit
from datetime import datetime

router = APIRouter(prefix="/certificates", tags=["Certificates"])

@router.get("/stats")
async def get_certificate_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REGISTRY_VIEW_INVENTORY))
):
    """Get comprehensive certificate statistics with reconciliation data"""
    try:
        total_registered = db.query(RegistryInventory).count()
        in_storage = db.query(RegistryInventory).filter(RegistryInventory.status == CertificateStatus.IN_STORAGE).count()
        ready = db.query(RegistryInventory).filter(RegistryInventory.status == CertificateStatus.READY_FOR_COLLECTION).count()
        collected = db.query(RegistryInventory).filter(RegistryInventory.status == CertificateStatus.COLLECTED).count()
        awaiting = db.query(RegistryInventory).filter(RegistryInventory.status == CertificateStatus.AWAITING_CLEARANCE).count()
        on_hold = db.query(RegistryInventory).filter(RegistryInventory.status == CertificateStatus.ON_HOLD).count()
        
        # Reconciliation metrics (Mock expected for prototype, can be tied to graduation cohorts later)
        expected_certificates = total_registered + 50 # Example: 50 graduates pending physical receipt
        remaining_in_custody = in_storage + ready
        discrepancy = expected_certificates - (collected + remaining_in_custody)
        
        # By certificate type
        diploma = db.query(RegistryInventory).filter(RegistryInventory.certificate_type == "Diploma").count()
        craft = db.query(RegistryInventory).filter(RegistryInventory.certificate_type == "Craft").count()
        transcript = db.query(RegistryInventory).filter(RegistryInventory.certificate_type == "Transcript").count()
        testimonial = db.query(RegistryInventory).filter(RegistryInventory.certificate_type == "Testimonial").count()
        
        # Recent activity (last 5)
        recent = db.query(RegistryInventory).order_by(RegistryInventory.created_at.desc()).limit(5).all()
        recent_list = []
        for r in recent:
            student = db.query(Student).filter(Student.id == r.student_id).first()
            recent_list.append({
                "certificate_number": r.certificate_number,
                "student_name": student.full_name if student else "Unknown",
                "admission_number": student.admission_number if student else "N/A",
                "status": r.status.value if hasattr(r.status, 'value') else str(r.status),
                "type": r.certificate_type or "Diploma",
                "created_at": r.created_at.isoformat() if r.created_at else None
            })
        
        return {
            "total_registered": total_registered,
            "expected": expected_certificates,
            "in_storage": in_storage,
            "ready": ready,
            "collected": collected,
            "remaining_in_custody": remaining_in_custody,
            "discrepancy": discrepancy,
            "by_type": {
                "Diploma": diploma,
                "Craft": craft,
                "Transcript": transcript,
                "Testimonial": testimonial
            },
            "recent": recent_list
        }
    except Exception as e:
        print(f"Stats error: {e}")
        return {
            "total_registered": 0, "expected": 0, "in_storage": 0, "ready": 0, 
            "collected": 0, "remaining_in_custody": 0, "discrepancy": 0,
            "by_type": {"Diploma": 0, "Craft": 0, "Transcript": 0, "Testimonial": 0},
            "recent": []
        }

@router.get("/enriched")
async def get_certificates_enriched(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    certificate_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REGISTRY_VIEW_INVENTORY))
):
    """Get certificates with student info and READ-ONLY clearance status"""
    query = db.query(RegistryInventory)
    
    if status:
        try:
            status_enum = CertificateStatus(status.lower())
            query = query.filter(RegistryInventory.status == status_enum)
        except:
            pass
    
    if certificate_type:
        query = query.filter(RegistryInventory.certificate_type == certificate_type)
    
    results = query.offset(skip).limit(limit).all()
    
    enriched = []
    for cert in results:
        student = db.query(Student).filter(Student.id == cert.student_id).first()
        
        # Fetch clearance status (Read-only view for Registry)
        clearance = db.query(ClearanceRequest).filter(ClearanceRequest.student_id == cert.student_id).first()
        finance_cleared = clearance.overall_status == "cleared" if clearance else False # Simplified for prototype
        
        # Apply search filter
        if search:
            search_lower = search.lower()
            matches = (
                search_lower in (cert.certificate_number or "").lower() or
                (student and search_lower in (student.full_name or "").lower()) or
                (student and search_lower in (student.admission_number or "").lower())
            )
            if not matches:
                continue
        
        enriched.append({
            "id": cert.id,
            "certificate_number": cert.certificate_number,
            "student_name": student.full_name if student else "Unknown",
            "admission_number": student.admission_number if student else "N/A",
            "programme": cert.programme or (student.programme if student else "N/A"),
            "department": student.department if student else "N/A",
            "certificate_type": cert.certificate_type or "Diploma",
            "status": cert.status.value if hasattr(cert.status, 'value') else str(cert.status),
            "finance_cleared": finance_cleared,
            "created_at": cert.created_at.isoformat() if cert.created_at else None
        })
    
    return enriched
