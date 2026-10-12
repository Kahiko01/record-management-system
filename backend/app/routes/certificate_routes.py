from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
from ..core.database import get_db
from ..models.models import User, Student, RegistryInventory, ClearanceStatus, ClearanceRequest
from ..schemas.schemas import CertificateCreate, CertificateUpdate, CertificateResponse
from ..auth.auth import get_current_active_user
from ..core.permissions import require_permission, Permission

router = APIRouter(prefix="/certificates", tags=["Certificates"])

@router.post("/", response_model=CertificateResponse)
async def create_certificate(
    certificate: CertificateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REGISTRY_ADD_INVENTORY))
):
    student = db.query(Student).filter(Student.id == certificate.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    existing = db.query(RegistryInventory).filter(
        RegistryInventory.certificate_number == certificate.certificate_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Certificate number already exists")
    db_certificate = RegistryInventory(
        certificate_number=certificate.certificate_number,
        student_id=certificate.student_id,
        programme=student.programme,
        certificate_type=getattr(certificate, "certificate_type", "Diploma") or "Diploma",
        status=CertificateStatus.AWAITING_CLEARANCE
    )
    db.add(db_certificate)
    db.commit()
    db.refresh(db_certificate)
    return db_certificate

@router.get("/", response_model=List[CertificateResponse])
async def get_certificates(
    skip: int = 0, limit: int = 100,
    student_id: Optional[int] = None,
    certificate_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REGISTRY_VIEW_INVENTORY))
):
    query = db.query(RegistryInventory)
    if student_id:
        query = query.filter(RegistryInventory.student_id == student_id)
    if certificate_type:
        query = query.filter(RegistryInventory.certificate_type == certificate_type)
    return query.offset(skip).limit(limit).all()

@router.get("/enriched")
async def get_certificates_enriched(
    skip: int = 0, limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    certificate_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REGISTRY_VIEW_INVENTORY))
):
    """Get certificates with student info - FIXED: filters at DB level before limit"""
    query = db.query(RegistryInventory, Student).join(Student, RegistryInventory.student_id == Student.id)
    
    if status:
        try:
            status_enum = CertificateStatus(status.lower())
            query = query.filter(RegistryInventory.status == status_enum)
        except:
            pass
            
    if certificate_type:
        query = query.filter(RegistryInventory.certificate_type == certificate_type)
        
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                RegistryInventory.certificate_number.ilike(search_term),
                Student.full_name.ilike(search_term),
                Student.admission_number.ilike(search_term)
            )
        )
    
    results = query.order_by(RegistryInventory.created_at.desc()).offset(skip).limit(limit).all()
    
    enriched = []
    for cert, student in results:
        clearance = db.query(ClearanceRequest).filter(ClearanceRequest.student_id == student.id).first()
        finance_cleared = clearance.overall_status == "cleared" if clearance else False
        
        enriched.append({
            "id": cert.id,
            "certificate_number": cert.certificate_number,
            "student_name": student.full_name if student else "Unknown",
            "admission_number": student.admission_number if student else "N/A",
            "programme": cert.programme or (student.programme if student else "N/A"),
            "department": student.department if student else "N/A",
            "certificate_type": cert.certificate_type or "Diploma",
            "status": cert.status.value if hasattr(cert.status, "value") else str(cert.status),
            "finance_cleared": finance_cleared,
            "graduation_year": cert.graduation_year or "N/A",
            "storage_location": cert.storage_location or "N/A",
            "created_at": cert.created_at.isoformat() if cert.created_at else None
        })
    return enriched

@router.get("/stats")
async def get_certificate_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REGISTRY_VIEW_INVENTORY))
):
    try:
        total = db.query(RegistryInventory).count()
        awaiting = db.query(RegistryInventory).filter(RegistryInventory.status == CertificateStatus.AWAITING_CLEARANCE).count()
        in_storage = db.query(RegistryInventory).filter(RegistryInventory.status == CertificateStatus.IN_STORAGE).count()
        ready = db.query(RegistryInventory).filter(RegistryInventory.status == CertificateStatus.READY_FOR_COLLECTION).count()
        collected = db.query(RegistryInventory).filter(RegistryInventory.status == CertificateStatus.COLLECTED).count()
        on_hold = db.query(RegistryInventory).filter(RegistryInventory.status == CertificateStatus.ON_HOLD).count()
        diploma = db.query(RegistryInventory).filter(RegistryInventory.certificate_type == "Diploma").count()
        craft = db.query(RegistryInventory).filter(RegistryInventory.certificate_type == "Craft").count()
        transcript = db.query(RegistryInventory).filter(RegistryInventory.certificate_type == "Transcript").count()
        testimonial = db.query(RegistryInventory).filter(RegistryInventory.certificate_type == "Testimonial").count()
        remaining = in_storage + ready
        expected = total + 50
        discrepancy = expected - (collected + remaining)
        recent = db.query(RegistryInventory).order_by(RegistryInventory.created_at.desc()).limit(5).all()
        recent_list = []
        for r in recent:
            s = db.query(Student).filter(Student.id == r.student_id).first()
            recent_list.append({
                "certificate_number": r.certificate_number,
                "student_name": s.full_name if s else "Unknown",
                "admission_number": s.admission_number if s else "N/A",
                "status": r.status.value if hasattr(r.status, "value") else str(r.status),
                "type": r.certificate_type or "Diploma",
                "created_at": r.created_at.isoformat() if r.created_at else None
            })
        return {
            "total_registered": total, "expected": expected,
            "in_storage": in_storage, "ready": ready,
            "collected": collected, "remaining_in_custody": remaining,
            "discrepancy": discrepancy, "awaiting": awaiting, "on_hold": on_hold,
            "by_type": {"Diploma": diploma, "Craft": craft, "Transcript": transcript, "Testimonial": testimonial},
            "recent": recent_list
        }
    except Exception as e:
        print(f"Stats error: {e}")
        return {"total_registered": 0, "expected": 0, "in_storage": 0, "ready": 0, "collected": 0, "remaining_in_custody": 0, "discrepancy": 0, "awaiting": 0, "on_hold": 0, "by_type": {"Diploma": 0, "Craft": 0, "Transcript": 0, "Testimonial": 0}, "recent": []}

@router.get("/verify/{certificate_number}")
async def verify_certificate_public(certificate_number: str, db: Session = Depends(get_db)):
    cert = db.query(RegistryInventory).filter(RegistryInventory.certificate_number == certificate_number).first()
    if not cert:
        return {"valid": False, "message": "Certificate not found."}
    student = db.query(Student).filter(Student.id == cert.student_id).first()
    return {
        "valid": True, "certificate_number": cert.certificate_number,
        "student_name": student.full_name if student else "Unknown",
        "programme": cert.programme,
        "status": cert.status.value if hasattr(cert.status, "value") else str(cert.status),
        "verified_at": datetime.utcnow().isoformat()
    }


@router.post("/{certificate_id}/schedule")
async def schedule_collection(
    certificate_id: int,
    appointment_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REGISTRY_UPDATE_INVENTORY))
):
    """Schedule a certificate collection appointment"""
    cert = db.query(RegistryInventory).filter(RegistryInventory.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    try:
        from app.utils.audit import log_audit
        import asyncio
        date = appointment_data.get("appointment_date", "N/A")
        time = appointment_data.get("appointment_time", "N/A")
        notes = appointment_data.get("notes", "")
        
        asyncio.create_task(log_audit(
            db,
            current_user.id,
            "APPOINTMENT_SCHEDULED",
            "registry",
            f"Scheduled collection for {cert.certificate_number} on {date} at {time}. Notes: {notes}"
        ))
    except Exception as e:
        print(f"Audit log warning: {e}")
    
    return {
        "message": "Appointment scheduled successfully",
        "certificate_number": cert.certificate_number,
        "appointment_date": appointment_data.get("appointment_date"),
        "appointment_time": appointment_data.get("appointment_time")
    }

@router.post("/{certificate_id}/release")
async def release_certificate(
    certificate_id: int,
    collection_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REGISTRY_UPDATE_INVENTORY))
):
    """Securely release a certificate and log the Chain of Custody"""
    cert = db.query(RegistryInventory).filter(RegistryInventory.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    if cert.status not in [CertificateStatus.READY_FOR_COLLECTION, CertificateStatus.IN_STORAGE]:
        raise HTTPException(status_code=400, detail=f"Certificate is not ready for collection. Current status: {cert.status}")
    
    # 1. Update Status
    cert.status = CertificateStatus.COLLECTED
    
    # 2. Log the permanent Chain of Custody event
    try:
        from app.utils.audit import log_audit
        import asyncio
        recipient = collection_data.get("recipient_name", "Unknown")
        id_num = collection_data.get("identification_number", "N/A")
        notes = collection_data.get("notes", "")
        
        # Fire and forget audit log
        asyncio.create_task(log_audit(
            db, 
            current_user.id, 
            "CERTIFICATE_RELEASED", 
            "registry",
            f"Released {cert.certificate_number} to {recipient} (ID: {id_num}). Notes: {notes}"
        ))
    except Exception as e:
        print(f"Audit log warning: {e}")
        
    db.commit()
    
    return {
        "message": "Certificate released successfully", 
        "certificate_id": certificate_id,
        "certificate_number": cert.certificate_number
    }

import csv
import io
from fastapi.responses import StreamingResponse

@router.get("/export")
async def export_certificates_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REGISTRY_VIEW_INVENTORY))
):
    """Export all registry certificates and student details to a CSV file"""
    # Query all certificates joined with student info
    results = db.query(RegistryInventory, Student).join(
        Student, RegistryInventory.student_id == Student.id
    ).order_by(RegistryInventory.created_at.desc()).all()

    # Create an in-memory text stream for the CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write the header row
    writer.writerow([
        "Certificate Number", "Student Name", "Admission Number", 
        "Programme", "Department", "Certificate Type", "Status", 
        "Finance Cleared", "Storage Location", "Created At"
    ])

    # Write the data rows
    for cert, student in results:
        # Check finance clearance
        try:
            from app.models.models import ClearanceRequest
            clearance = db.query(ClearanceRequest).filter(ClearanceRequest.student_id == student.id).first()
            finance_cleared = "Yes" if (clearance and getattr(clearance, 'finance_cleared', False)) else "No"
        except:
            finance_cleared = "Unknown"

        writer.writerow([
            cert.certificate_number,
            student.full_name if student else "Unknown",
            student.admission_number if student else "N/A",
            cert.programme or (student.programme if student else "N/A"),
            student.department if student else "N/A",
            cert.certificate_type or "Diploma",
            cert.status.value if hasattr(cert.status, "value") else str(cert.status),
            finance_cleared,
            cert.storage_location or "Unassigned",
            cert.created_at.strftime("%Y-%m-%d %H:%M") if cert.created_at else "N/A"
        ])

    # Move cursor to the beginning of the stream
    output.seek(0)
    
    # Return as a streaming CSV response
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=Registry_Report_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )

import io
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

@router.get("/export-pdf")
async def export_certificates_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REGISTRY_VIEW_INVENTORY))
):
    """Export all registry certificates and student details to a PDF file"""
    results = db.query(RegistryInventory, Student).join(
        Student, RegistryInventory.student_id == Student.id
    ).order_by(RegistryInventory.created_at.desc()).all()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    elements.append(Paragraph("Registry Certificate Report", styles['Title']))
    elements.append(Spacer(1, 12))
    
    data = [["Cert Number", "Student Name", "Admission No", "Programme", "Status", "Finance Cleared"]]
    for cert, student in results:
        try:
            from app.models.models import ClearanceRequest
            clearance = db.query(ClearanceRequest).filter(ClearanceRequest.student_id == student.id).first()
            finance_cleared = "Yes" if (clearance and getattr(clearance, 'finance_cleared', False)) else "No"
        except:
            finance_cleared = "Unknown"
            
        data.append([
            cert.certificate_number,
            student.full_name if student else "Unknown",
            student.admission_number if student else "N/A",
            cert.programme or (student.programme if student else "N/A"),
            cert.status.value if hasattr(cert.status, "value") else str(cert.status),
            finance_cleared
        ])

    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('FONTSIZE', (0, 0), (-1, -1), 8)
    ]))
    
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Registry_Report_{datetime.utcnow().strftime('%Y%m%d')}.pdf"}
    )
