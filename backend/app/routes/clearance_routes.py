from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..core.database import get_db
from ..models.models import (
    User, Student, ClearanceRequest, FinanceClearance,
    ExaminationClearance, RegistryInventory, CollectionAppointment,
    CertificateCollection, Notification, AuditLog,
    ClearanceStatus, CertificateStatus, AppointmentStatus,
    NotificationType, CollectionMethod
)
from ..schemas.schemas import (
    ClearanceRequestCreate, ClearanceRequestResponse,
    FinanceClearanceUpdate, FinanceClearanceResponse,
    ExaminationClearanceUpdate, ExaminationClearanceResponse,
    RegistryInventoryCreate, RegistryInventoryUpdate, RegistryInventoryResponse,
    AppointmentCreate, AppointmentUpdate, AppointmentResponse,
    CollectionCreate, CollectionResponse,
    ClearanceStatsResponse, NotificationResponse, NotificationUpdate
)
from ..auth.auth import get_current_active_user, role_required
from ..utils.audit import log_audit

router = APIRouter(prefix="/clearance", tags=["Clearance"])

# ========================================
# STUDENT ENDPOINTS
# ========================================

@router.post("/request", response_model=ClearanceRequestResponse)
async def request_clearance(
    request_data: ClearanceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["student"]))
):
    """Student requests clearance"""
    student = db.query(Student).filter(
        Student.id == request_data.student_id,
        Student.user_id == current_user.id
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    existing = db.query(ClearanceRequest).filter(
        ClearanceRequest.student_id == student.id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Clearance request already exists")

    clearance_request = ClearanceRequest(
        student_id=student.id,
        student_user_id=current_user.id,
        overall_status="pending"
    )
    db.add(clearance_request)
    db.commit()
    db.refresh(clearance_request)

    finance = FinanceClearance(
        clearance_request_id=clearance_request.id,
        status=ClearanceStatus.PENDING
    )
    db.add(finance)

    examination = ExaminationClearance(
        clearance_request_id=clearance_request.id,
        status=ClearanceStatus.PENDING
    )
    db.add(examination)
    db.commit()

    notification = Notification(
        student_id=student.id,
        sender_id=current_user.id,
        notification_type=NotificationType.CLEARANCE_REQUEST,
        title="Clearance Request Submitted",
        message=f"Your clearance request has been submitted. Please wait for department approvals."
    )
    db.add(notification)
    db.commit()

    await log_audit(db, current_user.id, "CLEARANCE_REQUEST_SUBMITTED", "student",
                    f"Student {student.student_id} requested clearance")

    return clearance_request

@router.get("/my-status", response_model=ClearanceRequestResponse)
async def get_my_clearance_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["student"]))
):
    """Get current user's clearance status"""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    clearance = db.query(ClearanceRequest).filter(
        ClearanceRequest.student_id == student.id
    ).first()

    if not clearance:
        raise HTTPException(status_code=404, detail="No clearance request found")

    return clearance

# ========================================
# FINANCE OFFICE ENDPOINTS - FIXED
# ========================================

@router.get("/finance/pending")
async def get_finance_pending(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["finance", "super_admin"]))
):
    """Get all students with finance status (pending or not_cleared)"""

    # Get all students
    students = db.query(Student).all()
    result = []

    for student in students:
        # Get clearance
        clearance = db.query(ClearanceRequest).filter(
            ClearanceRequest.student_id == student.id
        ).first()

        finance_status = "pending"
        exam_status = "pending"
        overall_status = "not_applied"

        if clearance:
            # Get finance clearance
            finance = db.query(FinanceClearance).filter(
                FinanceClearance.clearance_request_id == clearance.id
            ).first()
            if finance:
                finance_status = finance.status.value if hasattr(finance.status, 'value') else str(finance.status)

            # Get examination clearance
            exam = db.query(ExaminationClearance).filter(
                ExaminationClearance.clearance_request_id == clearance.id
            ).first()
            if exam:
                exam_status = exam.status.value if hasattr(exam.status, 'value') else str(exam.status)

            overall_status = clearance.overall_status

        # Only include students with pending or not_cleared finance
        if finance_status in ["pending", "not_cleared"]:
            result.append({
                "id": student.id,
                "student_id": student.student_id,
                "student_user_id": clearance.student_user_id if clearance else None,
                "request_date": clearance.request_date.isoformat() if clearance else None,
                "overall_status": overall_status,
                "collection_eligible": clearance.collection_eligible if clearance else False,
                "collection_eligible_date": clearance.collection_eligible_date.isoformat() if clearance and clearance.collection_eligible_date else None,
                "created_at": clearance.created_at.isoformat() if clearance else None,
                "updated_at": clearance.updated_at.isoformat() if clearance else None,
                "student": {
                    "id": student.id,
                    "student_id": student.student_id,
                    "first_name": student.first_name,
                    "last_name": student.last_name,
                    "program": student.program,
                    "year_of_study": student.year_of_study,
                    "email": student.email,
                    "user_id": student.user_id
                },
                "finance_clearance": {
                    "id": finance.id if finance else None,
                    "clearance_request_id": finance.clearance_request_id if finance else None,
                    "status": finance_status,
                    "remarks": finance.remarks if finance else None,
                    "amount_due": finance.amount_due if finance else 0,
                    "amount_paid": finance.amount_paid if finance else 0,
                    "outstanding_balance": finance.outstanding_balance if finance else 0,
                    "cleared_by": finance.cleared_by if finance else None,
                    "cleared_at": finance.cleared_at.isoformat() if finance and finance.cleared_at else None,
                    "created_at": finance.created_at.isoformat() if finance else None,
                    "updated_at": finance.updated_at.isoformat() if finance and finance.updated_at else None
                } if finance else None,
                "examination_clearance": {
                    "id": exam.id if exam else None,
                    "clearance_request_id": exam.clearance_request_id if exam else None,
                    "status": exam_status,
                    "remarks": exam.remarks if exam else None,
                    "results_released": exam.results_released if exam else False,
                    "program_completed": exam.program_completed if exam else False,
                    "graduation_approved": exam.graduation_approved if exam else False,
                    "no_missing_grades": exam.no_missing_grades if exam else False,
                    "credits_completed": exam.credits_completed if exam else False,
                    "cleared_by": exam.cleared_by if exam else None,
                    "cleared_at": exam.cleared_at.isoformat() if exam and exam.cleared_at else None,
                    "created_at": exam.created_at.isoformat() if exam else None,
                    "updated_at": exam.updated_at.isoformat() if exam and exam.updated_at else None
                } if exam else None
            })

    return result

@router.put("/finance/{clearance_id}", response_model=FinanceClearanceResponse)
async def update_finance_clearance(
    clearance_id: int,
    update_data: FinanceClearanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["finance", "super_admin"]))
):
    """Finance officer updates clearance status"""
    finance = db.query(FinanceClearance).filter(
        FinanceClearance.clearance_request_id == clearance_id
    ).first()

    if not finance:
        raise HTTPException(status_code=404, detail="Finance clearance not found")

    old_status = finance.status

    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(finance, key, value)

    if update_data.status in [ClearanceStatus.CLEARED, ClearanceStatus.NOT_CLEARED]:
        finance.cleared_by = current_user.id
        finance.cleared_at = datetime.utcnow()

    db.commit()
    db.refresh(finance)

    clearance = db.query(ClearanceRequest).filter(
        ClearanceRequest.id == clearance_id
    ).first()

    exam = db.query(ExaminationClearance).filter(
        ExaminationClearance.clearance_request_id == clearance_id
    ).first()

    if finance.status == ClearanceStatus.CLEARED and exam.status == ClearanceStatus.CLEARED:
        clearance.overall_status = "cleared"
        clearance.collection_eligible = True
        clearance.collection_eligible_date = datetime.utcnow()
    elif finance.status == ClearanceStatus.NOT_CLEARED or exam.status == ClearanceStatus.NOT_CLEARED:
        clearance.overall_status = "rejected"
        clearance.collection_eligible = False
    else:
        clearance.overall_status = "in_progress"

    db.commit()

    student = db.query(Student).filter(Student.id == clearance.student_id).first()

    if update_data.status == ClearanceStatus.CLEARED:
        notification = Notification(
            student_id=student.id,
            sender_id=current_user.id,
            notification_type=NotificationType.FINANCE_APPROVED,
            title="Finance Clearance Approved",
            message=f"Your finance clearance has been approved by {current_user.full_name}."
        )
    elif update_data.status == ClearanceStatus.NOT_CLEARED:
        notification = Notification(
            student_id=student.id,
            sender_id=current_user.id,
            notification_type=NotificationType.FINANCE_REJECTED,
            title="Finance Clearance Rejected",
            message=f"Your finance clearance was rejected. Reason: {update_data.remarks or 'No reason provided'}"
        )
    else:
        notification = None

    if notification:
        db.add(notification)
        db.commit()

    await log_audit(db, current_user.id, "FINANCE_CLEARANCE_UPDATED", "finance",
                    f"Finance clearance updated from {old_status} to {update_data.status}")

    return finance

# ========================================
# EXAMINATION OFFICE ENDPOINTS - FIXED
# ========================================

@router.get("/examination/pending")
async def get_examination_pending(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["examination_office", "super_admin"]))
):
    """Get all students with examination status (pending or not_cleared)"""

    # Get all students
    students = db.query(Student).all()
    result = []

    for student in students:
        # Get clearance
        clearance = db.query(ClearanceRequest).filter(
            ClearanceRequest.student_id == student.id
        ).first()

        finance_status = "pending"
        exam_status = "pending"
        overall_status = "not_applied"

        if clearance:
            # Get finance clearance
            finance = db.query(FinanceClearance).filter(
                FinanceClearance.clearance_request_id == clearance.id
            ).first()
            if finance:
                finance_status = finance.status.value if hasattr(finance.status, 'value') else str(finance.status)

            # Get examination clearance
            exam = db.query(ExaminationClearance).filter(
                ExaminationClearance.clearance_request_id == clearance.id
            ).first()
            if exam:
                exam_status = exam.status.value if hasattr(exam.status, 'value') else str(exam.status)

            overall_status = clearance.overall_status

        # Only include students with pending or not_cleared examination
        if exam_status in ["pending", "not_cleared"]:
            result.append({
                "id": student.id,
                "student_id": student.student_id,
                "student_user_id": clearance.student_user_id if clearance else None,
                "request_date": clearance.request_date.isoformat() if clearance else None,
                "overall_status": overall_status,
                "collection_eligible": clearance.collection_eligible if clearance else False,
                "collection_eligible_date": clearance.collection_eligible_date.isoformat() if clearance and clearance.collection_eligible_date else None,
                "created_at": clearance.created_at.isoformat() if clearance else None,
                "updated_at": clearance.updated_at.isoformat() if clearance else None,
                "student": {
                    "id": student.id,
                    "student_id": student.student_id,
                    "first_name": student.first_name,
                    "last_name": student.last_name,
                    "program": student.program,
                    "year_of_study": student.year_of_study,
                    "email": student.email,
                    "user_id": student.user_id
                },
                "finance_clearance": {
                    "id": finance.id if finance else None,
                    "clearance_request_id": finance.clearance_request_id if finance else None,
                    "status": finance_status,
                    "remarks": finance.remarks if finance else None,
                    "amount_due": finance.amount_due if finance else 0,
                    "amount_paid": finance.amount_paid if finance else 0,
                    "outstanding_balance": finance.outstanding_balance if finance else 0,
                    "cleared_by": finance.cleared_by if finance else None,
                    "cleared_at": finance.cleared_at.isoformat() if finance and finance.cleared_at else None,
                    "created_at": finance.created_at.isoformat() if finance else None,
                    "updated_at": finance.updated_at.isoformat() if finance and finance.updated_at else None
                } if finance else None,
                "examination_clearance": {
                    "id": exam.id if exam else None,
                    "clearance_request_id": exam.clearance_request_id if exam else None,
                    "status": exam_status,
                    "remarks": exam.remarks if exam else None,
                    "results_released": exam.results_released if exam else False,
                    "program_completed": exam.program_completed if exam else False,
                    "graduation_approved": exam.graduation_approved if exam else False,
                    "no_missing_grades": exam.no_missing_grades if exam else False,
                    "credits_completed": exam.credits_completed if exam else False,
                    "cleared_by": exam.cleared_by if exam else None,
                    "cleared_at": exam.cleared_at.isoformat() if exam and exam.cleared_at else None,
                    "created_at": exam.created_at.isoformat() if exam else None,
                    "updated_at": exam.updated_at.isoformat() if exam and exam.updated_at else None
                } if exam else None
            })

    return result

@router.put("/examination/{clearance_id}", response_model=ExaminationClearanceResponse)
async def update_examination_clearance(
    clearance_id: int,
    update_data: ExaminationClearanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["examination_office", "super_admin"]))
):
    """Examination office updates clearance status"""
    exam = db.query(ExaminationClearance).filter(
        ExaminationClearance.clearance_request_id == clearance_id
    ).first()

    if not exam:
        raise HTTPException(status_code=404, detail="Examination clearance not found")

    old_status = exam.status

    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(exam, key, value)

    if update_data.status in [ClearanceStatus.CLEARED, ClearanceStatus.NOT_CLEARED]:
        exam.cleared_by = current_user.id
        exam.cleared_at = datetime.utcnow()

    db.commit()
    db.refresh(exam)

    clearance = db.query(ClearanceRequest).filter(
        ClearanceRequest.id == clearance_id
    ).first()

    finance = db.query(FinanceClearance).filter(
        FinanceClearance.clearance_request_id == clearance_id
    ).first()

    if finance.status == ClearanceStatus.CLEARED and exam.status == ClearanceStatus.CLEARED:
        clearance.overall_status = "cleared"
        clearance.collection_eligible = True
        clearance.collection_eligible_date = datetime.utcnow()
    elif finance.status == ClearanceStatus.NOT_CLEARED or exam.status == ClearanceStatus.NOT_CLEARED:
        clearance.overall_status = "rejected"
        clearance.collection_eligible = False
    else:
        clearance.overall_status = "in_progress"

    db.commit()

    student = db.query(Student).filter(Student.id == clearance.student_id).first()

    if update_data.status == ClearanceStatus.CLEARED:
        notification = Notification(
            student_id=student.id,
            sender_id=current_user.id,
            notification_type=NotificationType.EXAMINATION_APPROVED,
            title="Examination Clearance Approved",
            message=f"Your examination clearance has been approved by {current_user.full_name}."
        )
    elif update_data.status == ClearanceStatus.NOT_CLEARED:
        notification = Notification(
            student_id=student.id,
            sender_id=current_user.id,
            notification_type=NotificationType.EXAMINATION_REJECTED,
            title="Examination Clearance Rejected",
            message=f"Your examination clearance was rejected. Reason: {update_data.remarks or 'No reason provided'}"
        )
    else:
        notification = None

    if notification:
        db.add(notification)
        db.commit()

    await log_audit(db, current_user.id, "EXAMINATION_CLEARANCE_UPDATED", "examination",
                    f"Examination clearance updated from {old_status} to {update_data.status}")

    return exam

# ========================================
# REGISTRY OFFICE ENDPOINTS
# ========================================

@router.get("/registry/cleared-students", response_model=List[ClearanceRequestResponse])
async def get_cleared_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["registry_officer", "super_admin"]))
):
    """Get all students with full clearance"""
    cleared = db.query(ClearanceRequest).filter(
        ClearanceRequest.overall_status == "cleared",
        ClearanceRequest.collection_eligible == True
    ).all()

    return cleared

@router.post("/registry/inventory", response_model=RegistryInventoryResponse)
async def create_certificate_inventory(
    inventory: RegistryInventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["registry_officer", "super_admin"]))
):
    """Add certificate to registry inventory"""
    existing = db.query(RegistryInventory).filter(
        RegistryInventory.certificate_number == inventory.certificate_number
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Certificate number already exists")

    student = db.query(Student).filter(Student.id == inventory.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    db_inventory = RegistryInventory(
        **inventory.model_dump(),
        status=CertificateStatus.AWAITING_CLEARANCE
    )
    db.add(db_inventory)
    db.commit()
    db.refresh(db_inventory)

    await log_audit(db, current_user.id, "CERTIFICATE_ADDED_TO_INVENTORY", "registry",
                    f"Added certificate {inventory.certificate_number} for student {student.student_id}")

    return db_inventory

@router.put("/registry/inventory/{inventory_id}", response_model=RegistryInventoryResponse)
async def update_certificate_inventory(
    inventory_id: int,
    update_data: RegistryInventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["registry_officer", "super_admin"]))
):
    """Update certificate inventory status"""
    inventory = db.query(RegistryInventory).filter(
        RegistryInventory.id == inventory_id
    ).first()

    if not inventory:
        raise HTTPException(status_code=404, detail="Certificate not found")

    old_status = inventory.status

    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(inventory, key, value)

    if update_data.status == CertificateStatus.READY_FOR_COLLECTION:
        inventory.marked_available_by = current_user.id
        inventory.marked_available_at = datetime.utcnow()

        student = db.query(Student).filter(Student.id == inventory.student_id).first()
        notification = Notification(
            student_id=student.id,
            sender_id=current_user.id,
            notification_type=NotificationType.CERTIFICATE_AVAILABLE,
            title="Certificate Ready for Collection",
            message=f"Your certificate ({inventory.certificate_number}) is now ready for collection."
        )
        db.add(notification)

    db.commit()
    db.refresh(inventory)

    await log_audit(db, current_user.id, "CERTIFICATE_INVENTORY_UPDATED", "registry",
                    f"Certificate {inventory.certificate_number} status changed from {old_status} to {update_data.status}")

    return inventory

# ========================================
# REGISTRY INVENTORY - GET & SEARCH ENDPOINTS
# ========================================

@router.get("/registry/inventory", response_model=List[RegistryInventoryResponse])
async def get_certificate_inventory(
    skip: int = 0,
    limit: int = 100,
    student_id: Optional[int] = None,
    status: Optional[CertificateStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all certificates in inventory"""
    query = db.query(RegistryInventory)

    if student_id:
        query = query.filter(RegistryInventory.student_id == student_id)

    if status:
        query = query.filter(RegistryInventory.status == status)

    return query.offset(skip).limit(limit).all()

@router.get("/registry/inventory/search", response_model=List[RegistryInventoryResponse])
async def search_inventory(
    certificate_number: Optional[str] = None,
    student_id: Optional[str] = None,
    student_name: Optional[str] = None,
    programme: Optional[str] = None,
    status: Optional[CertificateStatus] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    graduation_year: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Advanced inventory search with multiple filters"""
    query = db.query(RegistryInventory)

    if certificate_number:
        query = query.filter(RegistryInventory.certificate_number.contains(certificate_number))

    if student_id:
        query = query.filter(RegistryInventory.student_id == student_id)

    if student_name:
        query = query.join(Student).filter(
            (Student.first_name.contains(student_name)) |
            (Student.last_name.contains(student_name)) |
            (Student.middle_name.contains(student_name))
        )

    if programme:
        query = query.filter(RegistryInventory.programme.contains(programme))

    if status:
        query = query.filter(RegistryInventory.status == status)

    if date_from:
        query = query.filter(RegistryInventory.date_received >= date_from)
    if date_to:
        query = query.filter(RegistryInventory.date_received <= date_to)

    if graduation_year:
        query = query.filter(RegistryInventory.graduation_year == graduation_year)

    return query.order_by(RegistryInventory.created_at.desc()).all()

# ========================================
# APPOINTMENT ENDPOINTS
# ========================================

@router.post("/appointment", response_model=AppointmentResponse)
async def create_appointment(
    appointment: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["student", "registry_officer"]))
):
    """Create collection appointment"""
    student = db.query(Student).filter(Student.id == appointment.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    certificate = db.query(RegistryInventory).filter(
        RegistryInventory.id == appointment.certificate_id,
        RegistryInventory.status == CertificateStatus.READY_FOR_COLLECTION
    ).first()

    if not certificate:
        raise HTTPException(status_code=400, detail="Certificate not ready for collection")

    db_appointment = CollectionAppointment(
        **appointment.model_dump(),
        created_by=current_user.id,
        status=AppointmentStatus.SCHEDULED
    )
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)

    await log_audit(db, current_user.id, "APPOINTMENT_CREATED", "appointment",
                    f"Appointment created for student {student.student_id}")

    return db_appointment

@router.get("/appointments/my", response_model=List[AppointmentResponse])
async def get_my_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's appointments"""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        return []

    appointments = db.query(CollectionAppointment).filter(
        CollectionAppointment.student_id == student.id
    ).order_by(CollectionAppointment.appointment_date.desc()).all()

    return appointments

@router.get("/appointments", response_model=List[AppointmentResponse])
async def get_all_appointments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["registry_officer", "super_admin"]))
):
    """Get all appointments (Registry only)"""
    return db.query(CollectionAppointment).offset(skip).limit(limit).all()

@router.put("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment_status(
    appointment_id: int,
    update_data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["registry_officer", "super_admin"]))
):
    """Update appointment status (Registry only)"""
    appointment = db.query(CollectionAppointment).filter(
        CollectionAppointment.id == appointment_id
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(appointment, key, value)

    db.commit()
    db.refresh(appointment)

    await log_audit(db, current_user.id, "APPOINTMENT_UPDATED", "appointment",
                    f"Appointment {appointment_id} status updated to {update_data.status}")

    return appointment

# ========================================
# COLLECTION ENDPOINTS
# ========================================

@router.post("/collect", response_model=CollectionResponse)
async def record_collection(
    collection: CollectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["registry_officer", "super_admin"]))
):
    """Record certificate collection"""
    certificate = db.query(RegistryInventory).filter(
        RegistryInventory.id == collection.certificate_id,
        RegistryInventory.status == CertificateStatus.READY_FOR_COLLECTION
    ).first()

    if not certificate:
        raise HTTPException(status_code=400, detail="Certificate not ready for collection")

    student = db.query(Student).filter(Student.id == collection.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    db_collection = CertificateCollection(
        **collection.model_dump(),
        registry_officer_id=current_user.id,
        collection_date=datetime.utcnow(),
        collection_time=datetime.utcnow().strftime("%H:%M"),
        acknowledgement_received=True
    )
    db.add(db_collection)
    db.commit()
    db.refresh(db_collection)

    certificate.status = CertificateStatus.COLLECTED
    certificate.collection_id = db_collection.id
    db.commit()

    notification = Notification(
        student_id=student.id,
        sender_id=current_user.id,
        notification_type=NotificationType.CERTIFICATE_COLLECTED,
        title="Certificate Collected",
        message=f"Your certificate ({certificate.certificate_number}) has been collected."
    )
    db.add(notification)
    db.commit()

    await log_audit(db, current_user.id, "CERTIFICATE_COLLECTED", "registry",
                    f"Certificate {certificate.certificate_number} collected by {student.student_id}")

    return db_collection

# ========================================
# NOTIFICATION ENDPOINTS
# ========================================

@router.get("/notifications", response_model=List[NotificationResponse])
async def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's notifications"""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        return []

    return db.query(Notification).filter(
        Notification.student_id == student.id
    ).order_by(Notification.created_at.desc()).limit(50).all()

@router.put("/notifications/{notification_id}", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: int,
    update_data: NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = update_data.is_read
    if update_data.is_read:
        notification.read_at = datetime.utcnow()

    db.commit()
    db.refresh(notification)

    return notification

# ========================================
# DASHBOARD STATS ENDPOINTS
# ========================================

@router.get("/stats/dashboard", response_model=ClearanceStatsResponse)
async def get_clearance_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get dashboard statistics"""
    total_students = db.query(Student).count()

    pending = db.query(ClearanceRequest).filter(
        ClearanceRequest.overall_status == "pending"
    ).count()

    in_progress = db.query(ClearanceRequest).filter(
        ClearanceRequest.overall_status == "in_progress"
    ).count()

    cleared = db.query(ClearanceRequest).filter(
        ClearanceRequest.overall_status == "cleared"
    ).count()

    finance_pending = db.query(FinanceClearance).filter(
        FinanceClearance.status == ClearanceStatus.PENDING
    ).count()

    finance_cleared = db.query(FinanceClearance).filter(
        FinanceClearance.status == ClearanceStatus.CLEARED
    ).count()

    finance_not_cleared = db.query(FinanceClearance).filter(
        FinanceClearance.status == ClearanceStatus.NOT_CLEARED
    ).count()

    exam_pending = db.query(ExaminationClearance).filter(
        ExaminationClearance.status == ClearanceStatus.PENDING
    ).count()

    exam_cleared = db.query(ExaminationClearance).filter(
        ExaminationClearance.status == ClearanceStatus.CLEARED
    ).count()

    exam_not_cleared = db.query(ExaminationClearance).filter(
        ExaminationClearance.status == ClearanceStatus.NOT_CLEARED
    ).count()

    certificates_ready = db.query(RegistryInventory).filter(
        RegistryInventory.status == CertificateStatus.READY_FOR_COLLECTION
    ).count()

    certificates_collected = db.query(RegistryInventory).filter(
        RegistryInventory.status == CertificateStatus.COLLECTED
    ).count()

    appointments = db.query(CollectionAppointment).filter(
        CollectionAppointment.status == AppointmentStatus.SCHEDULED
    ).count()

    return ClearanceStatsResponse(
        total_students=total_students,
        pending_clearance=pending,
        in_progress_clearance=in_progress,
        cleared_students=cleared,
        finance_pending=finance_pending,
        finance_cleared=finance_cleared,
        finance_not_cleared=finance_not_cleared,
        examination_pending=exam_pending,
        examination_cleared=exam_cleared,
        examination_not_cleared=exam_not_cleared,
        certificates_ready=certificates_ready,
        certificates_collected=certificates_collected,
        appointments_scheduled=appointments,
        finance_queue=finance_pending,
        examination_queue=exam_pending,
        registry_queue=certificates_ready
    )

# ========================================
# ALL STUDENTS WITH STATUS ENDPOINT
# ========================================

@router.get("/all-students-with-status")
async def get_all_students_with_clearance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all students with their clearance status for each department"""
    students = db.query(Student).all()
    result = []

    for student in students:
        clearance = db.query(ClearanceRequest).filter(
            ClearanceRequest.student_id == student.id
        ).first()

        finance_status = "pending"
        exam_status = "pending"
        overall_status = "not_applied"

        if clearance:
            finance = db.query(FinanceClearance).filter(
                FinanceClearance.clearance_request_id == clearance.id
            ).first()
            exam = db.query(ExaminationClearance).filter(
                ExaminationClearance.clearance_request_id == clearance.id
            ).first()

            finance_status = finance.status.value if finance else "pending"
            exam_status = exam.status.value if exam else "pending"
            overall_status = clearance.overall_status

        result.append({
            "student_id": student.id,
            "student_number": student.student_id,
            "name": f"{student.first_name} {student.last_name}",
            "program": student.program,
            "level": student.year_of_study,
            "finance_status": finance_status,
            "examination_status": exam_status,
            "overall_status": overall_status,
            "has_certificate": db.query(RegistryInventory).filter(
                RegistryInventory.student_id == student.id
            ).first() is not None
        })

    return result

# ========================================
# CLEARANCE WORKFLOW - STEP BY STEP
# ========================================

@router.get("/workflow/student/{student_id}")
async def get_student_workflow(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get complete workflow status for a student"""
    
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    clearance = db.query(ClearanceRequest).filter(
        ClearanceRequest.student_id == student.id
    ).first()
    
    if not clearance:
        return {
            "student": {
                "id": student.id,
                "name": f"{student.first_name} {student.last_name}",
                "student_id": student.student_id,
                "program": student.program,
                "level": student.year_of_study
            },
            "workflow": {
                "step_1_finance": {"status": "not_started", "details": "Finance clearance not initiated"},
                "step_2_examination": {"status": "not_started", "details": "Examination clearance not initiated"},
                "step_3_academic": {"status": "not_started", "details": "Academic clearance not initiated"},
                "step_4_dean": {"status": "not_started", "details": "Dean approval not initiated"},
                "step_5_registry": {"status": "not_started", "details": "Registry clearance not initiated"},
                "overall_status": "not_applied"
            }
        }
    
    # Get finance clearance
    finance = db.query(FinanceClearance).filter(
        FinanceClearance.clearance_request_id == clearance.id
    ).first()
    
    # Get examination clearance
    exam = db.query(ExaminationClearance).filter(
        ExaminationClearance.clearance_request_id == clearance.id
    ).first()
    
    # Get academic clearance (if exists)
    academic = db.query(AcademicClearance).filter(
        AcademicClearance.clearance_request_id == clearance.id
    ).first() if hasattr(db, 'query') else None
    
    # Get dean approval (if exists)
    dean = db.query(DeanApproval).filter(
        DeanApproval.clearance_request_id == clearance.id
    ).first() if hasattr(db, 'query') else None
    
    workflow = {
        "student": {
            "id": student.id,
            "name": f"{student.first_name} {student.last_name}",
            "student_id": student.student_id,
            "program": student.program,
            "level": student.year_of_study
        },
        "workflow": {
            "step_1_finance": {
                "status": finance.status if finance else "pending",
                "details": finance.remarks if finance else "Awaiting finance verification",
                "cleared_by": finance.cleared_by if finance else None,
                "cleared_at": finance.cleared_at.isoformat() if finance and finance.cleared_at else None
            },
            "step_2_examination": {
                "status": exam.status if exam else "pending",
                "details": exam.remarks if exam else "Awaiting examination verification",
                "cleared_by": exam.cleared_by if exam else None,
                "cleared_at": exam.cleared_at.isoformat() if exam and exam.cleared_at else None
            },
            "step_3_academic": {
                "status": "cleared" if clearance.overall_status == "cleared" else "pending",
                "details": "Academic records verified" if clearance.overall_status == "cleared" else "Pending academic review"
            },
            "step_4_dean": {
                "status": "cleared" if clearance.overall_status == "cleared" else "pending",
                "details": "Dean approval granted" if clearance.overall_status == "cleared" else "Pending dean approval"
            },
            "step_5_registry": {
                "status": "ready" if clearance.collection_eligible else "pending",
                "details": "Certificate ready for collection" if clearance.collection_eligible else "Awaiting registry processing"
            },
            "overall_status": clearance.overall_status,
            "collection_eligible": clearance.collection_eligible
        }
    }
    
    return workflow

@router.get("/workflow/department/{department}")
async def get_department_workflow(
    department: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all students at a specific workflow step"""
    
    # Map department to the correct status filter
    department_map = {
        "finance": "finance_status",
        "examination": "examination_status",
        "academic": "academic_status",
        "dean": "dean_status",
        "registry": "registry_status"
    }
    
    if department not in department_map:
        raise HTTPException(status_code=400, detail="Invalid department")
    
    # Get all students with their clearance status
    students = db.query(Student).all()
    result = []
    
    for student in students:
        clearance = db.query(ClearanceRequest).filter(
            ClearanceRequest.student_id == student.id
        ).first()
        
        if not clearance:
            continue
        
        # Get department-specific status
        if department == "finance":
            finance = db.query(FinanceClearance).filter(
                FinanceClearance.clearance_request_id == clearance.id
            ).first()
            status = finance.status if finance else "pending"
        elif department == "examination":
            exam = db.query(ExaminationClearance).filter(
                ExaminationClearance.clearance_request_id == clearance.id
            ).first()
            status = exam.status if exam else "pending"
        else:
            status = "pending"
        
        # Only include students pending or not_cleared for this department
        if status in ["pending", "not_cleared"]:
            result.append({
                "student_id": student.id,
                "student_number": student.student_id,
                "name": f"{student.first_name} {student.last_name}",
                "program": student.program,
                "level": student.year_of_study,
                "status": status,
                "clearance_id": clearance.id
            })
    
    return {
        "department": department,
        "pending_count": len(result),
        "students": result
    }
