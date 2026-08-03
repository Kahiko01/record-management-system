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
    NotificationType, CollectionMethod, AcademicClearance, DeanApproval
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
from ..core.permissions import require_role
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
    
    exam = ExaminationClearance(
        clearance_request_id=clearance_request.id,
        status=ClearanceStatus.PENDING
    )
    db.add(exam)
    db.commit()
    
    notification = Notification(
        student_id=student.id,
        sender_id=current_user.id,
        notification_type=NotificationType.CLEARANCE_REQUEST,
        title="Clearance Request Submitted",
        message=f"Your clearance request has been submitted."
    )
    db.add(notification)
    db.commit()
    
    return clearance_request

@router.get("/my-status", response_model=ClearanceRequestResponse)
async def get_my_clearance_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["student"]))
):
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
# FINANCE OFFICE ENDPOINTS
# ========================================

@router.get("/finance/pending")
async def get_finance_pending(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["finance", "super_admin"]))
):
    students = db.query(Student).all()
    result = []
    
    for student in students:
        clearance = db.query(ClearanceRequest).filter(
            ClearanceRequest.student_id == student.id
        ).first()
        
        finance_status = "pending"
        if clearance:
            finance = db.query(FinanceClearance).filter(
                FinanceClearance.clearance_request_id == clearance.id
            ).first()
            if finance:
                finance_status = finance.status.value if hasattr(finance.status, 'value') else str(finance.status)
        
        if finance_status in ["pending", "not_cleared"]:
            result.append({
                "id": student.id,
                "student_id": student.id,
                "student_user_id": clearance.student_user_id if clearance else None,
                "request_date": clearance.request_date.isoformat() if clearance else None,
                "overall_status": clearance.overall_status if clearance else "not_applied",
                "collection_eligible": clearance.collection_eligible if clearance else False,
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
                    "status": finance_status
                } if finance_status else None
            })
    
    return result

@router.put("/finance/{clearance_id}", response_model=FinanceClearanceResponse)
async def update_finance_clearance(
    clearance_id: int,
    update_data: FinanceClearanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["finance", "super_admin"]))
):
    finance = db.query(FinanceClearance).filter(
        FinanceClearance.clearance_request_id == clearance_id
    ).first()
    
    if not finance:
        raise HTTPException(status_code=404, detail="Finance clearance not found")
    
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
    
    return finance

# ========================================
# EXAMINATION OFFICE ENDPOINTS
# ========================================

@router.get("/examination/pending")
async def get_examination_pending(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["examination_office", "super_admin"]))
):
    students = db.query(Student).all()
    result = []
    
    for student in students:
        clearance = db.query(ClearanceRequest).filter(
            ClearanceRequest.student_id == student.id
        ).first()
        
        exam_status = "pending"
        if clearance:
            exam = db.query(ExaminationClearance).filter(
                ExaminationClearance.clearance_request_id == clearance.id
            ).first()
            if exam:
                exam_status = exam.status.value if hasattr(exam.status, 'value') else str(exam.status)
        
        if exam_status in ["pending", "not_cleared"]:
            result.append({
                "id": student.id,
                "student_id": student.id,
                "student_user_id": clearance.student_user_id if clearance else None,
                "request_date": clearance.request_date.isoformat() if clearance else None,
                "overall_status": clearance.overall_status if clearance else "not_applied",
                "collection_eligible": clearance.collection_eligible if clearance else False,
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
                "examination_clearance": {
                    "status": exam_status
                } if exam_status else None
            })
    
    return result

@router.put("/examination/{clearance_id}", response_model=ExaminationClearanceResponse)
async def update_examination_clearance(
    clearance_id: int,
    update_data: ExaminationClearanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["examination_office", "super_admin"]))
):
    exam = db.query(ExaminationClearance).filter(
        ExaminationClearance.clearance_request_id == clearance_id
    ).first()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Examination clearance not found")
    
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
    
    return exam

# ========================================
# REGISTRY OFFICE ENDPOINTS
# ========================================

@router.get("/registry/cleared-students")
async def get_cleared_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["registry_officer", "super_admin"]))
):
    cleared = db.query(ClearanceRequest).filter(
        ClearanceRequest.overall_status == "cleared",
        ClearanceRequest.collection_eligible == True
    ).all()
    return cleared

@router.get("/registry/inventory")
async def get_certificate_inventory(
    skip: int = 0,
    limit: int = 100,
    student_id: Optional[int] = None,
    status: Optional[CertificateStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["registry_officer", "super_admin", "internal_auditor"]))
):
    query = db.query(RegistryInventory)
    if student_id:
        query = query.filter(RegistryInventory.student_id == student_id)
    if status:
        query = query.filter(RegistryInventory.status == status)
    return query.offset(skip).limit(limit).all()

@router.post("/registry/inventory", response_model=RegistryInventoryResponse)
async def create_certificate_inventory(
    inventory: RegistryInventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["registry_officer", "super_admin"]))
):
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
    
    return db_inventory

# ========================================
# APPOINTMENT ENDPOINTS
# ========================================

@router.post("/appointment", response_model=AppointmentResponse)
async def create_appointment(
    appointment: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["student", "registry_officer", "super_admin"]))
):
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
    
    return db_appointment

# ========================================
# COLLECTION ENDPOINTS
# ========================================

@router.post("/collect", response_model=CollectionResponse)
async def record_collection(
    collection: CollectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["registry_officer", "super_admin"]))
):
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
    
    return db_collection

# ========================================
# DASHBOARD STATS
# ========================================

@router.get("/stats/dashboard", response_model=ClearanceStatsResponse)
async def get_clearance_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
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
