from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, Enum, JSON, Table
from datetime import datetime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import enum

# ==========================================
# MULTI-ROLE ASSOCIATION TABLE (The Bridge)
# ==========================================
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("is_department_uploader", Boolean, default=False),
    Column("uploader_department", String, nullable=True)
)

# ==========================================
# ROLES TABLE
# ==========================================
class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False) # e.g., "finance", "dean"
    display_name = Column(String, nullable=False) # e.g., "Finance Officer"
    department = Column(String, nullable=True)

    # Relationship to users
    users = relationship("User", secondary=user_roles, back_populates="roles")


# ============= ENUMS =============

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    REGISTRY_OFFICER = "registry_officer"
    ACADEMIC_OFFICE = "academic_office"
    DEAN = "dean"
    FINANCE = "finance"
    EXAMINATION_OFFICE = "examination_office"
    STUDENT = "student"
    EMPLOYER = "employer"
    INTERNAL_AUDITOR = "internal_auditor"

class ClearanceStatus(str, enum.Enum):
    PENDING = "pending"
    CLEARED = "cleared"
    NOT_CLEARED = "not_cleared"
    WAITING = "waiting"

class CertificateStatus(str, enum.Enum):
    AWAITING_CLEARANCE = "awaiting_clearance"
    IN_STORAGE = "in_storage"
    READY_FOR_COLLECTION = "ready_for_collection"
    ON_HOLD = "on_hold"
    COLLECTED = "collected"
    LOST = "lost"
    DAMAGED = "damaged"
    REPLACED = "replaced"

class CollectionMethod(str, enum.Enum):
    PHYSICAL = "physical"
    AUTHORIZED_REPRESENTATIVE = "authorized_representative"

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    MISSED = "missed"

class NotificationType(str, enum.Enum):
    CLEARANCE_REQUEST = "clearance_request"
    FINANCE_APPROVED = "finance_approved"
    FINANCE_REJECTED = "finance_rejected"
    EXAMINATION_APPROVED = "examination_approved"
    EXAMINATION_REJECTED = "examination_rejected"
    CERTIFICATE_AVAILABLE = "certificate_available"
    APPOINTMENT_CONFIRMED = "appointment_confirmed"
    CERTIFICATE_COLLECTED = "certificate_collected"

# ============= USER MODELS =============

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=True) # Keep this for now for backwards compatibility!
    active_role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    department = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Multi-role relationship
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    active_role = relationship("Role", foreign_keys=[active_role_id])

    # Relationships
    students = relationship("Student", back_populates="user")
    clearance_requests = relationship("ClearanceRequest", back_populates="student_user")
    finance_clearances = relationship("FinanceClearance", back_populates="finance_officer")
    examination_clearances = relationship("ExaminationClearance", back_populates="examination_officer")
    academic_clearances = relationship("AcademicClearance", back_populates="academic_officer")
    dean_approvals = relationship("DeanApproval", back_populates="dean")
    registry_actions = relationship("RegistryInventory", back_populates="registry_officer")
    collections = relationship("CertificateCollection", back_populates="registry_officer")
    audit_logs = relationship("AuditLog", back_populates="user")
    notifications_sent = relationship("Notification", back_populates="sender")
    appointments_created = relationship("CollectionAppointment", back_populates="created_by_user")

# ============= STUDENT MODELS =============

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    middle_name = Column(String)
    date_of_birth = Column(String)
    email = Column(String, nullable=False)
    phone = Column(String)
    address = Column(Text)
    program = Column(String, nullable=False)
    year_of_study = Column(Integer, default=1)
    enrollment_date = Column(String)
    graduation_date = Column(String)
    national_id = Column(String)
    passport_number = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="students")
    clearance_request = relationship("ClearanceRequest", back_populates="student", uselist=False)
    registry_inventory = relationship("RegistryInventory", back_populates="student")
    collections = relationship("CertificateCollection", back_populates="student")
    appointments = relationship("CollectionAppointment", back_populates="student")
    notifications = relationship("Notification", back_populates="student")

# ============= CLEARANCE MODELS =============

class ClearanceRequest(Base):
    __tablename__ = "clearance_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, unique=True)
    student_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    request_date = Column(DateTime(timezone=True), server_default=func.now())
    overall_status = Column(String, default="pending")
    collection_eligible = Column(Boolean, default=False)
    collection_eligible_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    student = relationship("Student", back_populates="clearance_request")
    student_user = relationship("User", back_populates="clearance_requests")
    finance_clearance = relationship("FinanceClearance", back_populates="clearance_request", uselist=False)
    examination_clearance = relationship("ExaminationClearance", back_populates="clearance_request", uselist=False)
    academic_clearance = relationship("AcademicClearance", back_populates="clearance_request", uselist=False)
    dean_approval = relationship("DeanApproval", back_populates="clearance_request", uselist=False)

class FinanceClearance(Base):
    __tablename__ = "finance_clearances"

    id = Column(Integer, primary_key=True, index=True)
    clearance_request_id = Column(Integer, ForeignKey("clearance_requests.id"), nullable=False, unique=True)
    status = Column(Enum(ClearanceStatus), default=ClearanceStatus.PENDING)
    remarks = Column(Text)
    amount_due = Column(Float, default=0.0)
    amount_paid = Column(Float, default=0.0)
    outstanding_balance = Column(Float, default=0.0)
    cleared_by = Column(Integer, ForeignKey("users.id"))
    cleared_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    clearance_request = relationship("ClearanceRequest", back_populates="finance_clearance")
    finance_officer = relationship("User", back_populates="finance_clearances")

class ExaminationClearance(Base):
    __tablename__ = "examination_clearances"

    id = Column(Integer, primary_key=True, index=True)
    clearance_request_id = Column(Integer, ForeignKey("clearance_requests.id"), nullable=False, unique=True)
    status = Column(Enum(ClearanceStatus), default=ClearanceStatus.PENDING)
    remarks = Column(Text)
    results_released = Column(Boolean, default=False)
    program_completed = Column(Boolean, default=False)
    graduation_approved = Column(Boolean, default=False)
    no_missing_grades = Column(Boolean, default=False)
    credits_completed = Column(Boolean, default=False)
    cleared_by = Column(Integer, ForeignKey("users.id"))
    cleared_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    clearance_request = relationship("ClearanceRequest", back_populates="examination_clearance")
    examination_officer = relationship("User", back_populates="examination_clearances")

# ============= ACADEMIC CLEARANCE MODELS =============

class AcademicClearance(Base):
    __tablename__ = "academic_clearances"

    id = Column(Integer, primary_key=True, index=True)
    clearance_request_id = Column(Integer, ForeignKey("clearance_requests.id"), nullable=False, unique=True)
    status = Column(Enum(ClearanceStatus), default=ClearanceStatus.PENDING)
    remarks = Column(Text)
    results_verified = Column(Boolean, default=False)
    attendance_verified = Column(Boolean, default=False)
    library_clearance = Column(Boolean, default=False)
    cleared_by = Column(Integer, ForeignKey("users.id"))
    cleared_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    clearance_request = relationship("ClearanceRequest", back_populates="academic_clearance")
    academic_officer = relationship("User", back_populates="academic_clearances")

class DeanApproval(Base):
    __tablename__ = "dean_approvals"

    id = Column(Integer, primary_key=True, index=True)
    clearance_request_id = Column(Integer, ForeignKey("clearance_requests.id"), nullable=False, unique=True)
    status = Column(Enum(ClearanceStatus), default=ClearanceStatus.PENDING)
    remarks = Column(Text)
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    clearance_request = relationship("ClearanceRequest", back_populates="dean_approval")
    dean = relationship("User", back_populates="dean_approvals")

# ============= REGISTRY INVENTORY MODELS =============

class RegistryInventory(Base):
    __tablename__ = "registry_inventory"

    id = Column(Integer, primary_key=True, index=True)
    certificate_number = Column(String, unique=True, index=True, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    programme = Column(String, nullable=False)
    graduation_year = Column(String)
    storage_location = Column(String)
    storage_location_id = Column(Integer, ForeignKey("storage_locations.id"), nullable=True)
    status = Column(Enum(CertificateStatus), default=CertificateStatus.AWAITING_CLEARANCE)
    date_received = Column(DateTime(timezone=True), server_default=func.now())
    marked_available_by = Column(Integer, ForeignKey("users.id"))
    marked_available_at = Column(DateTime(timezone=True))
    hold_reason = Column(Text)
    hold_until = Column(DateTime(timezone=True))
    is_replacement = Column(Boolean, default=False)
    original_certificate_id = Column(Integer, nullable=True)
    replacement_reason = Column(Text)
    verified_count = Column(Integer, default=0)
    last_verified_at = Column(DateTime(timezone=True))
    qr_code = Column(Text)
    pdf_path = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    student = relationship("Student", back_populates="registry_inventory")
    registry_officer = relationship("User", back_populates="registry_actions")
    storage_location_ref = relationship("StorageLocation", back_populates="certificates")
    collection = relationship("CertificateCollection", back_populates="certificate", uselist=False)

# ============= STORAGE LOCATION MODELS =============

class StorageLocation(Base):
    __tablename__ = "storage_locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text)
    building = Column(String)
    floor = Column(String)
    room = Column(String)
    cabinet = Column(String)
    shelf = Column(String)
    rack = Column(String)
    capacity = Column(Integer, default=100)
    current_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    certificates = relationship("RegistryInventory", back_populates="storage_location_ref")
    created_by_user = relationship("User", foreign_keys=[created_by])

class StorageLocationHistory(Base):
    __tablename__ = "storage_location_history"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(Integer, ForeignKey("registry_inventory.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("storage_locations.id"), nullable=False)
    action = Column(String, nullable=False)
    previous_location_id = Column(Integer, ForeignKey("storage_locations.id"), nullable=True)
    performed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    certificate = relationship("RegistryInventory")
    location = relationship("StorageLocation", foreign_keys=[location_id])
    previous_location = relationship("StorageLocation", foreign_keys=[previous_location_id])
    performer = relationship("User")

# ============= COLLECTION MODELS =============

class CollectionAppointment(Base):
    __tablename__ = "collection_appointments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    certificate_id = Column(Integer, ForeignKey("registry_inventory.id"), nullable=False)
    appointment_date = Column(DateTime(timezone=True), nullable=False)
    appointment_time = Column(String, nullable=False)
    location = Column(String)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.SCHEDULED)
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    student = relationship("Student", back_populates="appointments")
    created_by_user = relationship("User", back_populates="appointments_created")

class CertificateCollection(Base):
    __tablename__ = "certificate_collections"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(Integer, ForeignKey("registry_inventory.id"), nullable=False, unique=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    collection_date = Column(DateTime(timezone=True), nullable=False)
    collection_time = Column(String, nullable=False)
    collection_method = Column(Enum(CollectionMethod), nullable=False)
    identification_document = Column(String, nullable=False)
    identification_number = Column(String, nullable=False)
    recipient_name = Column(String, nullable=False)
    recipient_signature = Column(Text)
    registry_officer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    acknowledgement_received = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    certificate = relationship("RegistryInventory", back_populates="collection")
    student = relationship("Student", back_populates="collections")
    registry_officer = relationship("User", back_populates="collections")

# ============= NOTIFICATIONS MODELS =============

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notification_type = Column(Enum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True))
    link = Column(String)
    extra_data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    student = relationship("Student", back_populates="notifications")
    sender = relationship("User", back_populates="notifications_sent")

# ============= AUDIT MODELS =============

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    module = Column(String, nullable=False)
    details = Column(Text)
    previous_status = Column(String)
    new_status = Column(String)
    ip_address = Column(String)
    user_agent = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="audit_logs")

# ==========================================
# PHASE 4: GRANULAR TASK PERMISSIONS
# ==========================================

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False) # e.g., 'registry_upload'
    name = Column(String, nullable=False)                          # e.g., 'Registry Bulk Upload'
    department = Column(String, nullable=True)                     # e.g., 'Registry'

class UserTask(Base):
    __tablename__ = "user_tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    is_enabled = Column(Boolean, default=True)
    granted_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    granted_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    task = relationship("Task")
    granter = relationship("User", foreign_keys=[granted_by])
