from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from ..core.database import get_db
from ..models.models import (
    User, Student, ClearanceRequest, FinanceClearance,
    ExaminationClearance, RegistryInventory, CollectionAppointment,
    CertificateCollection, Notification, AuditLog,
    ClearanceStatus, CertificateStatus, AppointmentStatus,
    NotificationType, CollectionMethod, AcademicClearance, DeanApproval,
    StorageLocation
)
from ..schemas.schemas import (
    ClearanceRequestCreate, ClearanceRequestResponse,
    RegistryInventoryCreate, RegistryInventoryUpdate, RegistryInventoryResponse,
    AppointmentCreate, AppointmentUpdate, AppointmentResponse,
    CollectionCreate, CollectionResponse,
    ClearanceStatsResponse, NotificationResponse, NotificationUpdate
)
from ..auth.auth import get_current_active_user
from ..core.permissions import require_permission, require_any_permission, Permission
from ..core.websocket_manager import manager
from ..utils.audit import log_audit

router = APIRouter(prefix="/clearance", tags=["Clearance"])

# ========================================
# 1. STUDENT SUBMITS CLEARANCE REQUEST
# ========================================

@router.post("/request", response_model=ClearanceRequestResponse)
async def request_clearance(
    request_data: ClearanceRequestCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.STUDENT_APPLY_CLEARANCE))
):
    student = db.query(Student).filter(Student.id == request_data.student_id, Student.user_id == current_user.id).first()
    if not student: raise HTTPException(status_code=404, detail="Student not found")
    existing = db.query(ClearanceRequest).filter(ClearanceRequest.student_id == student.id).first()
    if existing: raise HTTPException(status_code=400, detail="Clearance request already exists")

    clearance_request = ClearanceRequest(student_id=student.id, student_user_id=current_user.id, overall_status="pending")
    db.add(clearance_request); db.commit(); db.refresh(clearance_request)

    finance = FinanceClearance(clearance_request_id=clearance_request.id, status=ClearanceStatus.PENDING)
    exam = ExaminationClearance(clearance_request_id=clearance_request.id, status=ClearanceStatus.PENDING)
    db.add(finance); db.add(exam); db.commit()

    notification = Notification(student_id=student.id, sender_id=current_user.id, notification_type=NotificationType.CLEARANCE_REQUEST, title="Clearance Request Submitted", message="Your clearance request has been submitted.")
    db.add(notification); db.commit()
    await log_audit(db, current_user.id, "CLEARANCE_REQUESTED", "student", f"Student {student.student_id} requested clearance")
    return clearance_request

@router.get("/my-status", response_model=ClearanceRequestResponse)
async def get_my_clearance_status(
    db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.STUDENT_VIEW_CLEARANCE_PROGRESS))
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student: raise HTTPException(status_code=404, detail="Student profile not found")
    clearance = db.query(ClearanceRequest).filter(ClearanceRequest.student_id == student.id).first()
    if not clearance: raise HTTPException(status_code=404, detail="No clearance request found")
    return clearance

# ========================================
# 2. FINANCE DEPARTMENT REVIEWS
# ========================================

@router.get("/finance/pending")
async def get_finance_pending(
    search: Optional[str] = None, course: Optional[str] = None, level: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.FINANCE_VIEW_PENDING))
):
    query = db.query(Student)
    if search: query = query.filter((Student.first_name.ilike(f"%{search}%")) | (Student.last_name.ilike(f"%{search}%")) | (Student.student_id.ilike(f"%{search}%")))
    if course: query = query.filter(Student.program.ilike(f"%{course}%"))
    if level:
        try: query = query.filter(Student.year_of_study == int(level))
        except ValueError: pass
    students = query.all()
    result = []
    for student in students:
        clearance = db.query(ClearanceRequest).filter(ClearanceRequest.student_id == student.id).first()
        if not clearance:
            continue
        finance = db.query(FinanceClearance).filter(FinanceClearance.clearance_request_id == clearance.id).first()
        if not finance:
            continue
        finance_status = finance.status.value if hasattr(finance.status, 'value') else str(finance.status)
        if finance_status.upper() in ["PENDING", "NOT_CLEARED"]:
            result.append({
                "id": finance.id,
                "clearance_request_id": clearance.id,
                "student_id": student.id,
                "request_date": clearance.request_date.isoformat() if clearance.request_date else None,
                "overall_status": clearance.overall_status,
                "amount_due": finance.amount_due or 0,
                "amount_paid": finance.amount_paid or 0,
                "status": finance_status,
                "student": {
                    "id": student.id,
                    "student_id": student.student_id,
                    "first_name": student.first_name,
                    "last_name": student.last_name,
                    "program": student.program,
                    "year_of_study": student.year_of_study,
                    "email": student.email,
                    "user_id": student.user_id
                }
            })
    return result

@router.put("/finance/{finance_id}")
async def update_finance_clearance(
    finance_id: int, update_data: dict, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.FINANCE_APPROVE))
):
    finance = db.query(FinanceClearance).filter(FinanceClearance.id == finance_id).first()
    if not finance: raise HTTPException(status_code=404, detail="Finance clearance not found")
    status_str = update_data.get("status", "pending")
    remarks = update_data.get("remarks", "")

    # Update the finance status
    finance.status = status_str
    db.commit()

    # Log the action
    await log_audit(db, current_user.id, "FINANCE_CLEARANCE_UPDATED", "finance", f"Status: {status_str}. Remarks: {remarks or 'None'}")

    # Send notification to student
    clearance = db.query(ClearanceRequest).filter(ClearanceRequest.id == finance.clearance_request_id).first()
    if clearance:
        msg = "Your Finance clearance has been approved." if status_str == "cleared" else f"Your Finance clearance was rejected. Reason: {remarks}"
        notification = Notification(student_id=clearance.student_id, sender_id=current_user.id, notification_type=NotificationType.CLEARANCE_REQUEST, title="Finance Clearance Update", message=msg)
        db.add(notification)
        db.commit()

    return {"message": f"Finance clearance updated to {status_str}", "finance_id": finance_id}

# ========================================
# 3. EXAMINATIONS OFFICE REVIEWS
# ========================================

@router.get("/examination/pending")
async def get_examination_pending(
    search: Optional[str] = None, course: Optional[str] = None, level: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.EXAM_VIEW_PENDING))
):
    query = db.query(Student)
    if search: query = query.filter((Student.first_name.ilike(f"%{search}%")) | (Student.last_name.ilike(f"%{search}%")) | (Student.student_id.ilike(f"%{search}%")))
    if course: query = query.filter(Student.program.ilike(f"%{course}%"))
    if level:
        try: query = query.filter(Student.year_of_study == int(level))
        except ValueError: pass
    students = query.all()
    result = []
    for student in students:
        clearance = db.query(ClearanceRequest).filter(ClearanceRequest.student_id == student.id).first()
        exam_status = "pending"
        if clearance:
            exam = db.query(ExaminationClearance).filter(ExaminationClearance.clearance_request_id == clearance.id).first()
            if exam: exam_status = exam.status.value if hasattr(exam.status, 'value') else str(exam.status)
        if exam_status in ["pending", "not_cleared"]:
            result.append({"id": student.id, "student_id": student.id, "student_user_id": clearance.student_user_id if clearance else None, "request_date": clearance.request_date.isoformat() if clearance else None, "overall_status": clearance.overall_status if clearance else "not_applied", "collection_eligible": clearance.collection_eligible if clearance else False, "student": {"id": student.id, "student_id": student.student_id, "first_name": student.first_name, "last_name": student.last_name, "program": student.program, "year_of_study": student.year_of_study, "email": student.email, "user_id": student.user_id}, "examination_clearance": {"status": exam_status} if exam_status else None})
    return result

@router.put("/examination/{clearance_id}")
async def update_examination_clearance(
    clearance_id: int, update_data: dict, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.EXAM_APPROVE))
):
    exam = db.query(ExaminationClearance).filter(ExaminationClearance.clearance_request_id == clearance_id).first()
    if not exam: raise HTTPException(status_code=404, detail="Examination clearance not found")
    status_str = update_data.get("status", "pending")
    remarks = update_data.get("remarks", "")
    if status_str == "cleared": exam.status = ClearanceStatus.CLEARED
    elif status_str == "not_cleared": exam.status = ClearanceStatus.NOT_CLEARED
    exam.cleared_by = current_user.id; exam.cleared_at = datetime.utcnow()
    db.commit(); db.refresh(exam)
    clearance = db.query(ClearanceRequest).filter(ClearanceRequest.id == clearance_id).first()
    finance = db.query(FinanceClearance).filter(FinanceClearance.clearance_request_id == clearance_id).first()
    finance_status_str = finance.status.value if hasattr(finance.status, 'value') else str(finance.status) if finance else "pending"
    exam_status_str = exam.status.value if hasattr(exam.status, 'value') else str(exam.status)
    if finance_status_str == "cleared" and exam_status_str == "cleared":
        clearance.overall_status = "cleared"; clearance.collection_eligible = True; clearance.collection_eligible_date = datetime.utcnow()
    elif finance_status_str == "not_cleared" or exam_status_str == "not_cleared":
        clearance.overall_status = "rejected"; clearance.collection_eligible = False
    else: clearance.overall_status = "in_progress"
    db.commit()
    checklist_items = [f"{key.replace('_', ' ').title()}: {'Yes' if value else 'No'}" for key, value in update_data.items() if isinstance(value, bool)]
    audit_details = f"Status: {status_str}. Remarks: {remarks or 'None'}. Checklist: [{', '.join(checklist_items)}]"
    await log_audit(db, current_user.id, "EXAM_CLEARANCE_UPDATED", "examination", audit_details)
    msg = "Your Examination clearance has been approved." if status_str == "cleared" else f"Your Examination clearance was rejected. Reason: {remarks}"
    notification = Notification(student_id=clearance.student_id, sender_id=current_user.id, notification_type=NotificationType.CLEARANCE_REQUEST, title="Examination Clearance Update", message=msg)
    db.add(notification); db.commit()
    return exam

# ========================================
# 3.5 DEAN'S OFFICE REVIEWS
# ========================================

@router.get("/dean/pending")
async def get_dean_pending(
    search: Optional[str] = None, course: Optional[str] = None, level: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.DEAN_VIEW_PENDING))
):
    query = db.query(Student)
    if search: query = query.filter((Student.first_name.ilike(f"%{search}%")) | (Student.last_name.ilike(f"%{search}%")) | (Student.student_id.ilike(f"%{search}%")))
    if course: query = query.filter(Student.program.ilike(f"%{course}%"))
    if level:
        try: query = query.filter(Student.year_of_study == int(level))
        except ValueError: pass
    students = query.all()
    result = []
    for student in students:
        clearance = db.query(ClearanceRequest).filter(ClearanceRequest.student_id == student.id).first()
        if clearance:
            result.append({"id": clearance.id, "student_id": student.id, "student_user_id": clearance.student_user_id, "request_date": clearance.request_date.isoformat() if clearance.request_date else None, "overall_status": clearance.overall_status, "collection_eligible": clearance.collection_eligible, "student": {"id": student.id, "student_id": student.student_id, "first_name": student.first_name, "last_name": student.last_name, "program": student.program, "year_of_study": student.year_of_study, "email": student.email, "user_id": student.user_id}})
    return result

@router.put("/dean/{clearance_id}")
async def update_dean_clearance(
    clearance_id: int, update_data: dict, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.DEAN_APPROVE))
):
    clearance = db.query(ClearanceRequest).filter(ClearanceRequest.id == clearance_id).first()
    if not clearance: raise HTTPException(status_code=404, detail="Clearance request not found")
    status_str = update_data.get("status", "pending")
    remarks = update_data.get("remarks", "")
    checklist_items = [f"{key.replace('_', ' ').title()}: {'Yes' if value else 'No'}" for key, value in update_data.items() if isinstance(value, bool)]
    audit_details = f"Status: {status_str}. Remarks: {remarks or 'None'}. Checklist: [{', '.join(checklist_items)}]"
    await log_audit(db, current_user.id, "DEAN_CLEARANCE_UPDATED", "dean", audit_details)
    msg = "Your Dean clearance has been approved." if status_str == "cleared" else f"Your Dean clearance was rejected. Reason: {remarks}"
    notification = Notification(student_id=clearance.student_id, sender_id=current_user.id, notification_type=NotificationType.CLEARANCE_REQUEST, title="Dean Clearance Update", message=msg)
    db.add(notification); db.commit()
    return {"message": f"Dean clearance updated to {status_str}", "clearance_id": clearance_id}

# ========================================
# FINANCE PAYMENT BULK UPLOAD (AUTO-CLEAR ENABLED)
# ========================================

class PaymentImportItem(BaseModel):
    student_id: str
    amount_due: float
    amount_paid: float

@router.post("/finance/bulk-payments")
async def bulk_upload_payments(
    payments_data: List[PaymentImportItem],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.FINANCE_VIEW_PENDING))
):
    """Bulk upload payment data from Excel. AUTO-CLEARS if balance <= 0."""
    updated_count = 0
    created_count = 0
    auto_cleared_count = 0
    errors = []

    for item in payments_data:
        try:
            student = db.query(Student).filter(Student.student_id == item.student_id).first()
            if not student:
                errors.append(f"Student {item.student_id} not found")
                continue

            clearance = db.query(ClearanceRequest).filter(ClearanceRequest.student_id == student.id).first()
            if not clearance:
                clearance = ClearanceRequest(
                    student_id=student.id, student_user_id=student.user_id, overall_status="pending"
                )
                db.add(clearance)
                db.commit()
                db.refresh(clearance)

            finance = db.query(FinanceClearance).filter(FinanceClearance.clearance_request_id == clearance.id).first()
            outstanding = item.amount_due - item.amount_paid
            auto_cleared = outstanding <= 0

            if finance:
                finance.amount_due = item.amount_due
                finance.amount_paid = item.amount_paid
                finance.outstanding_balance = outstanding

                if auto_cleared and finance.status != ClearanceStatus.CLEARED:
                    finance.status = ClearanceStatus.CLEARED
                    finance.cleared_at = datetime.utcnow()
                    finance.cleared_by = current_user.id
                    auto_cleared_count += 1

                    notification = Notification(
                        student_id=student.id, sender_id=current_user.id,
                        notification_type=NotificationType.CLEARANCE_REQUEST,
                        title="Finance Auto-Cleared ✅",
                        message=f"Congratulations! Your finance clearance was automatically approved because your fee balance is fully paid."
                    )
                    db.add(notification)
                elif not auto_cleared and finance.status == ClearanceStatus.CLEARED:
                    finance.status = ClearanceStatus.PENDING

                updated_count += 1
            else:
                new_finance = FinanceClearance(
                    clearance_request_id=clearance.id,
                    status=ClearanceStatus.CLEARED if auto_cleared else ClearanceStatus.PENDING,
                    amount_due=item.amount_due,
                    amount_paid=item.amount_paid,
                    outstanding_balance=outstanding,
                    cleared_at=datetime.utcnow() if auto_cleared else None,
                    cleared_by=current_user.id if auto_cleared else None
                )
                db.add(new_finance)
                created_count += 1

                if auto_cleared:
                    auto_cleared_count += 1
                    notification = Notification(
                        student_id=student.id, sender_id=current_user.id,
                        notification_type=NotificationType.CLEARANCE_REQUEST,
                        title="Finance Auto-Cleared ✅",
                        message=f"Congratulations! Your finance clearance was automatically approved because your fee balance is fully paid."
                    )
                    db.add(notification)

            if auto_cleared:
                exam = db.query(ExaminationClearance).filter(ExaminationClearance.clearance_request_id == clearance.id).first()
                exam_status_str = exam.status.value if exam and hasattr(exam.status, 'value') else "pending"

                if exam_status_str == "cleared":
                    clearance.overall_status = "cleared"
                    clearance.collection_eligible = True
                else:
                    clearance.overall_status = "in_progress"

            db.commit()

        except Exception as e:
            errors.append(f"Row {item.student_id}: {str(e)}")

    await log_audit(db, current_user.id, "PAYMENTS_BULK_UPLOADED", "finance",
                    f"Uploaded payments: {updated_count} updated, {created_count} created, {auto_cleared_count} AUTO-CLEARED.")

    return {
        "message": f"Upload complete! {auto_cleared_count} students auto-cleared.",
        "updated": updated_count,
        "created": created_count,
        "auto_cleared": auto_cleared_count,
        "errors": errors
    }

# ========================================
# 4. FEE BALANCE ENDPOINTS
# ========================================

@router.get("/finance/balances")
async def get_fee_balances(
    search: Optional[str] = None, course: Optional[str] = None, level: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_permission([
        Permission.FINANCE_VIEW_PENDING, Permission.REGISTRY_VIEW_INVENTORY,
        Permission.EXAM_VIEW_PENDING, Permission.DEAN_VIEW_PENDING,
        Permission.ADMIN_VIEW_ALL_REPORTS, Permission.AUDITOR_VIEW_REPORTS
    ]))
):
    query = db.query(Student)
    if search: query = query.filter((Student.first_name.ilike(f"%{search}%")) | (Student.last_name.ilike(f"%{search}%")) | (Student.student_id.ilike(f"%{search}%")))
    if course: query = query.filter(Student.program.ilike(f"%{course}%"))
    if level:
        try: query = query.filter(Student.year_of_study == int(level))
        except ValueError: pass
    students = query.all()
    result = []
    for student in students:
        clearance = db.query(ClearanceRequest).filter(ClearanceRequest.student_id == student.id).first()
        finance = None
        if clearance:
            finance = db.query(FinanceClearance).filter(FinanceClearance.clearance_request_id == clearance.id).first()
        result.append({
            "student_id": student.id,
            "student_number": student.student_id,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "program": student.program,
            "year_of_study": student.year_of_study,
            "amount_due": finance.amount_due if finance else 0.0,
            "amount_paid": finance.amount_paid if finance else 0.0,
            "outstanding_balance": finance.outstanding_balance if finance else 0.0,
            "finance_status": finance.status.value if finance and hasattr(finance.status, 'value') else "no_request",
            "overall_status": clearance.overall_status if clearance else "no_request"
        })
    return result

@router.get("/finance/balance-summary")
async def get_balance_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_permission([Permission.FINANCE_VIEW_REPORTS, Permission.ADMIN_VIEW_ALL_REPORTS]))
):
    all_finance = db.query(FinanceClearance).all()
    total_due = sum(f.amount_due or 0 for f in all_finance)
    total_paid = sum(f.amount_paid or 0 for f in all_finance)
    total_outstanding = sum(f.outstanding_balance or 0 for f in all_finance)
    cleared_count = sum(1 for f in all_finance if f.status == ClearanceStatus.CLEARED)
    pending_count = sum(1 for f in all_finance if f.status == ClearanceStatus.PENDING)
    not_cleared_count = sum(1 for f in all_finance if f.status == ClearanceStatus.NOT_CLEARED)
    uncleared_outstanding = sum(f.outstanding_balance or 0 for f in all_finance if f.status != ClearanceStatus.CLEARED)
    return {
        "total_due": total_due, "total_paid": total_paid,
        "total_outstanding": total_outstanding, "uncleared_outstanding": uncleared_outstanding,
        "cleared_count": cleared_count, "pending_count": pending_count,
        "not_cleared_count": not_cleared_count, "total_students_with_requests": len(all_finance)
    }

# ========================================
# 5. REGISTRY RECEIVES & MARKS READY
# ========================================

@router.get("/registry/cleared-students")
async def get_cleared_students(
    db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.REGISTRY_SEARCH_CLEARED))
):
    return db.query(ClearanceRequest).filter(ClearanceRequest.overall_status == "cleared", ClearanceRequest.collection_eligible == True).all()

@router.get("/registry/inventory")
async def get_certificate_inventory(
    skip: int = 0, limit: int = 100, student_id: Optional[int] = None, status: Optional[CertificateStatus] = None,
    db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.REGISTRY_VIEW_INVENTORY))
):
    query = db.query(RegistryInventory)
    if student_id: query = query.filter(RegistryInventory.student_id == student_id)
    if status: query = query.filter(RegistryInventory.status == status)
    return query.offset(skip).limit(limit).all()

@router.post("/registry/inventory", response_model=RegistryInventoryResponse)
async def create_certificate_inventory(
    inventory: RegistryInventoryCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REGISTRY_ADD_INVENTORY))
):
    existing = db.query(RegistryInventory).filter(RegistryInventory.certificate_number == inventory.certificate_number).first()
    if existing: raise HTTPException(status_code=400, detail="Certificate number already exists")
    student = db.query(Student).filter(Student.id == inventory.student_id).first()
    if not student: raise HTTPException(status_code=404, detail="Student not found")
    db_inventory = RegistryInventory(**inventory.model_dump(), status=CertificateStatus.AWAITING_CLEARANCE)
    db.add(db_inventory); db.commit(); db.refresh(db_inventory)
    await log_audit(db, current_user.id, "CERTIFICATE_ADDED_TO_INVENTORY", "registry", f"Added certificate {inventory.certificate_number} to inventory")
    return db_inventory

@router.put("/registry/mark-ready/{student_id}", response_model=RegistryInventoryResponse)
async def mark_certificate_ready(
    student_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.REGISTRY_MARK_AVAILABLE))
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student: raise HTTPException(status_code=404, detail="Student not found")

    clearance = db.query(ClearanceRequest).filter(ClearanceRequest.student_id == student.id).first()
    if not clearance or clearance.overall_status != "cleared":
        raise HTTPException(status_code=400, detail="Student is not fully cleared yet")

    certificate = db.query(RegistryInventory).filter(RegistryInventory.student_id == student.id).first()

    if not certificate:
        cert_num = f"CERT-{student.student_id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        certificate = RegistryInventory(
            certificate_number=cert_num,
            student_id=student.id,
            programme=student.program,
            graduation_year=str(datetime.utcnow().year),
            storage_location="Main Registry Vault"
        )
        db.add(certificate)
        db.commit()
        db.refresh(certificate)
        await log_audit(db, current_user.id, "CERTIFICATE_AUTO_ADDED", "registry", f"Auto-added certificate {cert_num} to inventory")

    certificate.status = CertificateStatus.READY_FOR_COLLECTION
    certificate.marked_available_by = current_user.id
    certificate.marked_available_at = datetime.utcnow()
    db.commit(); db.refresh(certificate)

    notification = Notification(student_id=certificate.student_id, sender_id=current_user.id, notification_type=NotificationType.CLEARANCE_REQUEST, title="Certificate Ready for Collection", message="Your certificate is now ready for collection at the Registry office.")
    db.add(notification); db.commit()

    await log_audit(db, current_user.id, "CERTIFICATE_MARKED_READY", "registry", f"Marked certificate {certificate.certificate_number} as ready for collection")

    await manager.broadcast_to_role("admin", {
        "type": "CERTIFICATE_READY",
        "message": f"Certificate for {student.first_name} {student.last_name} is ready for collection!"
    })

    await manager.broadcast_to_role("student", {
        "type": "CERTIFICATE_READY",
        "message": "Your certificate is ready for collection!"
    })

    return certificate

# ========================================
# 6. STUDENT COLLECTS CERTIFICATE
# ========================================

@router.post("/appointment", response_model=AppointmentResponse)
async def create_appointment(
    appointment: AppointmentCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_any_permission([Permission.STUDENT_VIEW_APPOINTMENT, Permission.REGISTRY_SCHEDULE_COLLECTION]))
):
    student = db.query(Student).filter(Student.id == appointment.student_id).first()
    if not student: raise HTTPException(status_code=404, detail="Student not found")
    certificate = db.query(RegistryInventory).filter(RegistryInventory.id == appointment.certificate_id, RegistryInventory.status == CertificateStatus.READY_FOR_COLLECTION).first()
    if not certificate: raise HTTPException(status_code=400, detail="Certificate not ready for collection")
    db_appointment = CollectionAppointment(**appointment.model_dump(), created_by=current_user.id, status=AppointmentStatus.SCHEDULED)
    db.add(db_appointment); db.commit(); db.refresh(db_appointment)
    return db_appointment

@router.post("/collect", response_model=CollectionResponse)
async def record_collection(
    collection: CollectionCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.REGISTRY_RECORD_COLLECTION))
):
    certificate = db.query(RegistryInventory).filter(RegistryInventory.id == collection.certificate_id, RegistryInventory.status == CertificateStatus.READY_FOR_COLLECTION).first()
    if not certificate: raise HTTPException(status_code=400, detail="Certificate not ready for collection")
    student = db.query(Student).filter(Student.id == collection.student_id).first()
    if not student: raise HTTPException(status_code=404, detail="Student not found")
    db_collection = CertificateCollection(**collection.model_dump(), registry_officer_id=current_user.id, collection_date=datetime.utcnow(), collection_time=datetime.utcnow().strftime("%H:%M"), acknowledgement_received=True)
    db.add(db_collection); db.commit(); db.refresh(db_collection)
    certificate.status = CertificateStatus.COLLECTED; certificate.collection_id = db_collection.id
    db.commit()
    notification = Notification(student_id=student.id, sender_id=current_user.id, notification_type=NotificationType.CLEARANCE_REQUEST, title="Certificate Collected", message="Your certificate has been officially recorded as collected. Congratulations!")
    db.add(notification); db.commit()
    await log_audit(db, current_user.id, "CERTIFICATE_COLLECTED", "registry", f"Recorded collection of certificate {certificate.certificate_number} by student {student.student_id}")
    return db_collection

# ========================================
# AUDIT LOGS ENDPOINT
# ========================================

@router.get("/audit/logs")
async def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_permission([Permission.ADMIN_VIEW_ALL_LOGS, Permission.AUDITOR_VIEW_LOGS]))
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(200).all()
    return logs

# ========================================
# DASHBOARD STATS
# ========================================

@router.get("/stats/dashboard", response_model=ClearanceStatsResponse)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return ClearanceStatsResponse(
        total_students=db.query(Student).count(),
        pending_clearance=db.query(ClearanceRequest).filter(ClearanceRequest.overall_status == "pending").count(),
        in_progress_clearance=db.query(ClearanceRequest).filter(ClearanceRequest.overall_status == "in_progress").count(),
        cleared_students=db.query(ClearanceRequest).filter(ClearanceRequest.overall_status == "cleared").count(),
        finance_pending=db.query(FinanceClearance).filter(FinanceClearance.status == ClearanceStatus.PENDING).count(),
        finance_cleared=db.query(FinanceClearance).filter(FinanceClearance.status == ClearanceStatus.CLEARED).count(),
        finance_not_cleared=db.query(FinanceClearance).filter(FinanceClearance.status == ClearanceStatus.NOT_CLEARED).count(),
        examination_pending=db.query(ExaminationClearance).filter(ExaminationClearance.status == ClearanceStatus.PENDING).count(),
        examination_cleared=db.query(ExaminationClearance).filter(ExaminationClearance.status == ClearanceStatus.CLEARED).count(),
        examination_not_cleared=db.query(ExaminationClearance).filter(ExaminationClearance.status == ClearanceStatus.NOT_CLEARED).count(),
        certificates_ready=db.query(RegistryInventory).filter(RegistryInventory.status == CertificateStatus.READY_FOR_COLLECTION).count(),
        certificates_collected=db.query(RegistryInventory).filter(RegistryInventory.status == CertificateStatus.COLLECTED).count(),
        appointments_scheduled=db.query(CollectionAppointment).filter(CollectionAppointment.status == AppointmentStatus.SCHEDULED).count(),
        finance_queue=db.query(FinanceClearance).filter(FinanceClearance.status == ClearanceStatus.PENDING).count(),
        examination_queue=db.query(ExaminationClearance).filter(ExaminationClearance.status == ClearanceStatus.PENDING).count(),
        registry_queue=db.query(RegistryInventory).filter(RegistryInventory.status == CertificateStatus.READY_FOR_COLLECTION).count()
    )

# ========================================
# COLLECTIONS & REPORTING ENDPOINT
# ========================================

@router.get("/registry/collections-report")
async def get_collections_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_permission([Permission.REGISTRY_VIEW_REPORTS, Permission.ADMIN_VIEW_ALL_REPORTS, Permission.AUDITOR_VIEW_REPORTS]))
):
    """Generates a comprehensive flat report of all certificates, locations, and collections"""
    results = db.query(RegistryInventory).all()
    report = []

    for cert in results:
        student = db.query(Student).filter(Student.id == cert.student_id).first()
        location = db.query(StorageLocation).filter(StorageLocation.id == cert.storage_location_id).first() if cert.storage_location_id else None
        collection = db.query(CertificateCollection).filter(CertificateCollection.certificate_id == cert.id).first()
        officer = db.query(User).filter(User.id == collection.registry_officer_id).first() if collection else None

        report.append({
            "certificate_number": cert.certificate_number,
            "student_name": f"{student.first_name} {student.last_name}" if student else "Unknown",
            "student_id": student.student_id if student else "N/A",
            "program": cert.programme,
            "status": cert.status.value if hasattr(cert.status, 'value') else str(cert.status),
            "storage_location": location.name if location else (cert.storage_location or "Unassigned"),
            "building": location.building if location else "",
            "room": location.room if location else "",
            "shelf": location.shelf if location else "",
            "collection_date": collection.collection_date.strftime("%Y-%m-%d %H:%M") if collection and collection.collection_date else "",
            "collected_by": officer.full_name if officer else ""
        })
    return report

# ========================================
# NOTIFICATIONS ENDPOINTS
# ========================================

@router.get("/notifications")
async def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        return []

    notifications = db.query(Notification).filter(
        Notification.student_id == student.id
    ).order_by(Notification.created_at.desc()).all()

    result = []
    for n in notifications:
        result.append({
            "id": n.id,
            "student_id": n.student_id,
            "type": n.notification_type.value if hasattr(n.notification_type, "value") else str(n.notification_type),
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None
        })
    return result

@router.put("/notifications/{notification_id}")
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.student_id == student.id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

# ========================================
# CLEARANCE OVERVIEW (FOR SYSTEM USERS)
# ========================================

@router.get("/overview")
async def get_clearance_overview(
    search: Optional[str] = None, course: Optional[str] = None, level: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Student)
    if search: query = query.filter((Student.first_name.ilike(f"%{search}%")) | (Student.last_name.ilike(f"%{search}%")) | (Student.student_id.ilike(f"%{search}%")))
    if course: query = query.filter(Student.program.ilike(f"%{course}%"))
    if level:
        try: query = query.filter(Student.year_of_study == int(level))
        except ValueError: pass
    students = query.all()
    result = []
    for student in students:
        clearance = db.query(ClearanceRequest).filter(ClearanceRequest.student_id == student.id).first()

        finance_status = "no_request"
        exam_status = "no_request"
        dean_status = "no_request"
        overall_status = "no_request"

        if clearance:
            overall_status = clearance.overall_status or "pending"
            finance = db.query(FinanceClearance).filter(FinanceClearance.clearance_request_id == clearance.id).first()
            exam = db.query(ExaminationClearance).filter(ExaminationClearance.clearance_request_id == clearance.id).first()
            dean = db.query(DeanApproval).filter(DeanApproval.clearance_request_id == clearance.id).first()

            finance_status = finance.status.value if finance and hasattr(finance.status, 'value') else (str(finance.status) if finance else "pending")
            exam_status = exam.status.value if exam and hasattr(exam.status, 'value') else (str(exam.status) if exam else "pending")
            dean_status = dean.status.value if dean and hasattr(dean.status, 'value') else (str(dean.status) if dean else "pending")

        result.append({
            "id": student.id,
            "student_id": student.student_id,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "program": student.program,
            "year_of_study": student.year_of_study,
            "finance_status": finance_status,
            "exam_status": exam_status,
            "dean_status": dean_status,
            "overall_status": overall_status
        })
    return result
