import enum
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# ============= ENUMS FOR SCHEMAS =============

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    DEAN = "dean"
    FINANCE_OFFICER = "finance_officer"
    EXAM_OFFICER = "exam_officer"
    REGISTRY_OFFICER = "registry_officer"
    # --- ADD THESE 3 LINES ---
    LIBRARY_OFFICER = "library_officer"
    ACCOMMODATION_OFFICER = "accommodation_officer"
    DISCIPLINE_OFFICER = "discipline_officer"
    # -------------------------
    INTERNAL_AUDITOR = "internal_auditor"
class ClearanceStatus(str, Enum):
    PENDING = "pending"
    CLEARED = "cleared"
    NOT_CLEARED = "not_cleared"

class CertificateStatus(str, Enum):
    AWAITING_CLEARANCE = "awaiting_clearance"
    READY_FOR_COLLECTION = "ready_for_collection"
    ON_HOLD = "on_hold"
    COLLECTED = "collected"
    LOST = "lost"
    DAMAGED = "damaged"
    REPLACED = "replaced"

class AppointmentStatus(str, Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    MISSED = "missed"

class CollectionMethod(str, Enum):
    PHYSICAL = "physical"
    AUTHORIZED_REPRESENTATIVE = "authorized_representative"

class NotificationType(str, Enum):
    CLEARANCE_REQUEST = "clearance_request"
    FINANCE_APPROVED = "finance_approved"
    FINANCE_REJECTED = "finance_rejected"
    EXAMINATION_APPROVED = "examination_approved"
    EXAMINATION_REJECTED = "examination_rejected"
    CERTIFICATE_AVAILABLE = "certificate_available"
    APPOINTMENT_CONFIRMED = "appointment_confirmed"
    CERTIFICATE_COLLECTED = "certificate_collected"

# ============= USER SCHEMAS =============

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ============= STUDENT SCHEMAS =============

class StudentBase(BaseModel):
    student_id: str
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    program: str
    year_of_study: int = 1
    enrollment_date: Optional[str] = None
    graduation_date: Optional[str] = None
    national_id: Optional[str] = None
    passport_number: Optional[str] = None

class StudentCreate(StudentBase):
    user_id: int

class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    program: Optional[str] = None
    year_of_study: Optional[int] = None
    graduation_date: Optional[str] = None

class StudentResponse(StudentBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ============= CLEARANCE SCHEMAS =============

class ClearanceRequestCreate(BaseModel):
    student_id: int

class ClearanceRequestResponse(BaseModel):
    id: int
    student_id: int
    student_user_id: int
    request_date: datetime
    overall_status: str
    collection_eligible: bool
    collection_eligible_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Nested data
    student: Optional[StudentResponse] = None
    finance_clearance: Optional['FinanceClearanceResponse'] = None
    examination_clearance: Optional['ExaminationClearanceResponse'] = None

    class Config:
        from_attributes = True

class FinanceClearanceUpdate(BaseModel):
    status: ClearanceStatus
    remarks: Optional[str] = None
    amount_due: Optional[float] = None
    amount_paid: Optional[float] = None
    outstanding_balance: Optional[float] = None

class FinanceClearanceResponse(BaseModel):
    id: int
    clearance_request_id: int
    status: ClearanceStatus
    remarks: Optional[str] = None
    amount_due: float = 0.0
    amount_paid: float = 0.0
    outstanding_balance: float = 0.0
    cleared_by: Optional[int] = None
    cleared_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ExaminationClearanceUpdate(BaseModel):
    status: ClearanceStatus
    remarks: Optional[str] = None
    results_released: Optional[bool] = None
    program_completed: Optional[bool] = None
    graduation_approved: Optional[bool] = None
    no_missing_grades: Optional[bool] = None
    credits_completed: Optional[bool] = None

class ExaminationClearanceResponse(BaseModel):
    id: int
    clearance_request_id: int
    status: ClearanceStatus
    remarks: Optional[str] = None
    results_released: bool = False
    program_completed: bool = False
    graduation_approved: bool = False
    no_missing_grades: bool = False
    credits_completed: bool = False
    cleared_by: Optional[int] = None
    cleared_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ============= REGISTRY INVENTORY SCHEMAS =============

class RegistryInventoryCreate(BaseModel):
    certificate_number: str
    student_id: int
    programme: str
    graduation_year: Optional[str] = None
    storage_location: Optional[str] = None

class RegistryInventoryUpdate(BaseModel):
    status: Optional[CertificateStatus] = None
    storage_location: Optional[str] = None
    hold_reason: Optional[str] = None
    hold_until: Optional[datetime] = None

class RegistryInventoryResponse(BaseModel):
    id: int
    certificate_number: str
    student_id: int
    programme: str
    graduation_year: Optional[str] = None
    storage_location: Optional[str] = None
    status: CertificateStatus
    date_received: datetime
    marked_available_by: Optional[int] = None
    marked_available_at: Optional[datetime] = None
    hold_reason: Optional[str] = None
    hold_until: Optional[datetime] = None
    is_replacement: bool = False
    collection_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ============= APPOINTMENT SCHEMAS =============

class AppointmentCreate(BaseModel):
    student_id: int
    certificate_id: int
    appointment_date: datetime
    appointment_time: str
    location: Optional[str] = None
    notes: Optional[str] = None

class AppointmentUpdate(BaseModel):
    status: Optional[AppointmentStatus] = None
    appointment_date: Optional[datetime] = None
    appointment_time: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: int
    student_id: int
    certificate_id: int
    appointment_date: datetime
    appointment_time: str
    location: Optional[str] = None
    status: AppointmentStatus
    notes: Optional[str] = None
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ============= COLLECTION SCHEMAS =============

class CollectionCreate(BaseModel):
    certificate_id: int
    student_id: int
    collection_method: CollectionMethod
    identification_document: str
    identification_number: str
    recipient_name: str
    notes: Optional[str] = None

class CollectionResponse(BaseModel):
    id: int
    certificate_id: int
    student_id: int
    collection_date: datetime
    collection_time: str
    collection_method: CollectionMethod
    identification_document: str
    identification_number: str
    recipient_name: str
    registry_officer_id: int
    acknowledgement_received: bool = True
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ============= NOTIFICATION SCHEMAS =============

class NotificationResponse(BaseModel):
    id: int
    student_id: int
    notification_type: NotificationType
    title: str
    message: str
    is_read: bool = False
    read_at: Optional[datetime] = None
    link: Optional[str] = None
    extra_data: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationUpdate(BaseModel):
    is_read: bool

# ============= TOKEN SCHEMAS =============

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    username: Optional[str] = None

# ============= AUDIT LOG SCHEMAS =============

class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    action: str
    module: str
    details: Optional[str] = None
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ============= DASHBOARD STATS SCHEMAS =============

class ClearanceStatsResponse(BaseModel):
    total_students: int
    pending_clearance: int
    in_progress_clearance: int
    cleared_students: int
    finance_pending: int
    finance_cleared: int
    finance_not_cleared: int
    examination_pending: int
    examination_cleared: int
    examination_not_cleared: int
    certificates_ready: int
    certificates_collected: int
    appointments_scheduled: int

    # Department queues
    finance_queue: int
    examination_queue: int
    registry_queue: int

# ============= CERTIFICATE SCHEMAS (Original) =============

class CertificateBase(BaseModel):
    certificate_number: str
    student_id: int
    remarks: Optional[str] = None

class CertificateCreate(CertificateBase):
    issued_by: int

class CertificateUpdate(BaseModel):
    status: Optional[CertificateStatus] = None
    remarks: Optional[str] = None

class CertificateResponse(BaseModel):
    id: int
    certificate_number: str
    student_id: int
    issued_by: int
    issued_at: datetime
    status: CertificateStatus
    qr_code: Optional[str] = None
    pdf_path: Optional[str] = None
    remarks: Optional[str] = None
    verified_count: int = 0
    last_verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_students: int
    total_clearances: int
    pending_clearances: int
    finance_uncleared: int
    registry_uncleared: int
    examination_uncleared: int
    total_certificates: int
    certificates_issued: int
    certificates_pending: int

# Fix forward references
ClearanceRequestResponse.model_rebuild()
