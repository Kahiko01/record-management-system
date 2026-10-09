from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
from ..core.database import get_db
from ..models.models import User, Student, RegistryInventory
from ..models.appointment_link import AppointmentLink
from ..auth.auth import get_current_active_user
from ..core.permissions import require_permission, Permission
from ..utils.audit import log_audit

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.post("/generate-link")
async def generate_appointment_link(
    certificate_id: int,
    expires_hours: int = 24,
    appointment_date: str = None,
    appointment_time: str = None,
    notes: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REGISTRY_UPDATE_INVENTORY))
):
    """Generate a secure appointment link for a student"""
    # Verify certificate exists
    cert = db.query(RegistryInventory).filter(RegistryInventory.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    # Generate secure token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=expires_hours)
    
    # Create appointment link
    link = AppointmentLink(
        token=token,
        certificate_id=certificate_id,
        student_id=cert.student_id,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
        expires_at=expires_at,
        created_by=current_user.id,
        notes=notes
    )
    
    db.add(link)
    db.commit()
    db.refresh(link)
    
    # Log audit
    await log_audit(
        db,
        current_user.id,
        "APPOINTMENT_LINK_GENERATED",
        "registry",
        f"Generated appointment link for certificate {cert.certificate_number} (expires in {expires_hours} hours)"
    )
    
    return {
        "message": "Appointment link generated successfully",
        "token": token,
        "link": f"http://localhost:3000/appointment/confirm/{token}",
        "expires_at": expires_at.isoformat(),
        "certificate_number": cert.certificate_number,
        "student_name": db.query(Student).filter(Student.id == cert.student_id).first().full_name
    }

@router.get("/validate/{token}")
async def validate_appointment_link(token: str, db: Session = Depends(get_db)):
    """Validate an appointment link and return details"""
    link = db.query(AppointmentLink).filter(
        AppointmentLink.token == token,
        AppointmentLink.is_active == True
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Invalid or expired link")
    
    if datetime.utcnow() > link.expires_at:
        raise HTTPException(status_code=410, detail="This appointment link has expired")
    
    if link.used_at:
        raise HTTPException(status_code=410, detail="This appointment link has already been used")
    
    cert = db.query(RegistryInventory).filter(RegistryInventory.id == link.certificate_id).first()
    student = db.query(Student).filter(Student.id == link.student_id).first()
    
    # Default safe clearance status
    clearance_status = [
        {"department": "Finance", "status": "pending", "balance": 0.0, "comment": "Pending review"},
        {"department": "Library", "status": "pending", "balance": 0.0, "comment": "Pending review"},
        {"department": "Examinations", "status": "pending", "balance": 0.0, "comment": "Pending review"},
        {"department": "Discipline", "status": "pending", "balance": 0.0, "comment": "Pending review"},
        {"department": "Accommodation", "status": "pending", "balance": 0.0, "comment": "Pending review"},
        {"department": "Dean of Students", "status": "pending", "balance": 0.0, "comment": "Pending review"},
    ]
    
    try:
        from app.models.models import ClearanceRequest
        clearance = db.query(ClearanceRequest).filter(ClearanceRequest.student_id == student.id).first()
        if clearance:
            clearance_status = [
                {"department": "Finance", "status": "cleared" if getattr(clearance, 'finance_cleared', False) else "pending", "balance": float(getattr(clearance, 'finance_balance', 0.0)) if getattr(clearance, 'finance_balance', 0.0) else 0.0, "comment": str(getattr(clearance, 'finance_comment', '')) or "Pending review"},
                {"department": "Library", "status": "cleared" if getattr(clearance, 'library_cleared', False) else "pending", "balance": 0.0, "comment": str(getattr(clearance, 'library_comment', '')) or "Pending review"},
                {"department": "Examinations", "status": "cleared" if getattr(clearance, 'exams_cleared', False) else "pending", "balance": 0.0, "comment": str(getattr(clearance, 'exams_comment', '')) or "Pending review"},
                {"department": "Discipline", "status": "cleared" if getattr(clearance, 'discipline_cleared', False) else "pending", "balance": 0.0, "comment": str(getattr(clearance, 'discipline_comment', '')) or "Pending review"},
                {"department": "Accommodation", "status": "cleared" if getattr(clearance, 'accommodation_cleared', False) else "pending", "balance": 0.0, "comment": str(getattr(clearance, 'accommodation_comment', '')) or "Pending review"},
                {"department": "Dean of Students", "status": "cleared" if getattr(clearance, 'dean_cleared', False) else "pending", "balance": 0.0, "comment": str(getattr(clearance, 'dean_comment', '')) or "Pending review"},
            ]
    except Exception as e:
        print(f"⚠️ Clearance lookup skipped (model/columns may not exist yet): {e}")

    overall_cleared = all(c["status"] == "cleared" for c in clearance_status)
    
    return {
        "valid": True,
        "certificate_number": cert.certificate_number,
        "certificate_type": cert.certificate_type,
        "student_name": student.full_name,
        "admission_number": student.admission_number,
        "programme": student.programme,
        "appointment_date": link.appointment_date,
        "appointment_time": link.appointment_time,
        "expires_at": link.expires_at.isoformat(),
        "notes": link.notes,
        "clearance_status": clearance_status,
        "overall_cleared": overall_cleared
    }


@router.post("/confirm/{token}")
async def confirm_appointment(
    token: str,
    confirmation_data: dict,
    db: Session = Depends(get_db)
):
    """Student confirms their appointment"""
    link = db.query(AppointmentLink).filter(
        AppointmentLink.token == token,
        AppointmentLink.is_active == True
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Invalid or expired link")
    
    if datetime.utcnow() > link.expires_at:
        raise HTTPException(status_code=410, detail="This appointment link has expired")
    
    if link.used_at:
        raise HTTPException(status_code=410, detail="This appointment link has already been used")
    
    # Update appointment details if provided
    if confirmation_data.get("appointment_date"):
        link.appointment_date = confirmation_data["appointment_date"]
    if confirmation_data.get("appointment_time"):
        link.appointment_time = confirmation_data["appointment_time"]
    
    # Mark as used
    link.used_at = datetime.utcnow()
    link.is_active = False
    
    db.commit()
    
    # Get details for response
    cert = db.query(RegistryInventory).filter(RegistryInventory.id == link.certificate_id).first()
    student = db.query(Student).filter(Student.id == link.student_id).first()
    
    # Log audit
    await log_audit(
        db,
        link.created_by,
        "APPOINTMENT_CONFIRMED",
        "registry",
        f"Student {student.full_name} confirmed appointment for certificate {cert.certificate_number}"
    )
    
    return {
        "message": "Appointment confirmed successfully",
        "certificate_number": cert.certificate_number,
        "student_name": student.full_name,
        "appointment_date": link.appointment_date,
        "appointment_time": link.appointment_time,
        "confirmation_code": f"CONF-{link.id:06d}"
    }

@router.get("/pending")
async def get_pending_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REGISTRY_VIEW_INVENTORY))
):
    """Get all pending appointment links"""
    links = db.query(AppointmentLink).filter(
        AppointmentLink.is_active == True,
        AppointmentLink.expires_at > datetime.utcnow()
    ).all()
    
    result = []
    for link in links:
        cert = db.query(RegistryInventory).filter(RegistryInventory.id == link.certificate_id).first()
        student = db.query(Student).filter(Student.id == link.student_id).first()
        
        result.append({
            "id": link.id,
            "token": link.token,
            "certificate_number": cert.certificate_number,
            "student_name": student.full_name,
            "admission_number": student.admission_number,
            "appointment_date": link.appointment_date,
            "appointment_time": link.appointment_time,
            "expires_at": link.expires_at.isoformat(),
            "created_at": link.created_at.isoformat(),
            "link": f"http://localhost:3000/appointment/confirm/{link.token}"
        })
    
    return result
