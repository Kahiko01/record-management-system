from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, Enum, JSON, Table, Index, CheckConstraint
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
# ROLE TASKS USER ASSOCIATION TABLE
# ==========================================
role_tasks_users = Table(
    "role_tasks_users",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_task_id", Integer, ForeignKey("role_tasks.id", ondelete="CASCADE"), primary_key=True)
)

# ==========================================
# ROLES TABLE
# ==========================================
class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)  # e.g., "finance", "dean"
    display_name = Column(String, nullable=False)  # e.g., "Finance Officer"
    department = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship to users
    users = relationship("User", secondary=user_roles, back_populates="roles")

    # Task permissions
    tasks = relationship("RoleTask", back_populates="role")


# ============= ENUMS =============

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

class ClearanceStatus(str, enum.Enum):
    PENDING = "pending"
    IN_REVIEW = "in_review"       # <-- ADDED
    NEEDS_INFO = "needs_info"     # <-- ADDED
    CLEARED = "cleared"
    NOT_CLEARED = "not_cleared"
    WAITING = "waiting"
    DEFERRED = "deferred"

class CertificateStatus(str, enum.Enum):
    AWAITING_CLEARANCE = "awaiting_clearance"
    IN_STORAGE = "in_storage"
    READY_FOR_COLLECTION = "ready_for_collection"
    ON_HOLD = "on_hold"
    COLLECTED = "collected"
    LOST = "lost"
    DAMAGED = "damaged"
    REPLACED = "replaced"
    PENDING_PRINTING = "pending_printing"
    VERIFIED = "verified"

class CollectionMethod(str, enum.Enum):
    PHYSICAL = "physical"
    AUTHORIZED_REPRESENTATIVE = "authorized_representative"
    COURIER = "courier"
    POSTAL = "postal"

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    MISSED = "missed"
    RESCHEDULED = "rescheduled"

class NotificationType(str, enum.Enum):
    CLEARANCE_REQUEST = "clearance_request"
    FINANCE_APPROVED = "finance_approved"
    FINANCE_REJECTED = "finance_rejected"
    EXAMINATION_APPROVED = "examination_approved"
    EXAMINATION_REJECTED = "examination_rejected"
    ACADEMIC_APPROVED = "academic_approved"
    ACADEMIC_REJECTED = "academic_rejected"
    DEAN_APPROVED = "dean_approved"
    DEAN_REJECTED = "dean_rejected"
    CERTIFICATE_AVAILABLE = "certificate_available"
    CERTIFICATE_READY = "certificate_ready"
    APPOINTMENT_CONFIRMED = "appointment_confirmed"
    APPOINTMENT_REMINDER = "appointment_reminder"
    CERTIFICATE_COLLECTED = "certificate_collected"
    CERTIFICATE_ON_HOLD = "certificate_on_hold"
    SYSTEM_NOTIFICATION = "system_notification"

class LogSeverity(str, enum.Enum):
    INFO = "info"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    DEBUG = "debug"

class IPRuleType(str, enum.Enum):
    WHITELIST = "whitelist"
    BLACKLIST = "blacklist"
    EMERGENCY_LOCKDOWN = "emergency_lockdown"
    RATE_LIMIT = "rate_limit"


# ============= USER MODELS =============

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    active_role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    department = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_email_verified = Column(Boolean, default=False)
    is_locked = Column(Boolean, default=False)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    last_login = Column(DateTime(timezone=True))
    last_login_ip = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Multi-role relationship
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    active_role = relationship("Role", foreign_keys=[active_role_id])

    # Direct task permissions
    tasks = relationship("UserTask", back_populates="user", foreign_keys="[UserTask.user_id]")

    # Role-based tasks (via role) - EXPLICIT JOINS to prevent NoForeignKeysError
    role_tasks = relationship(
        "RoleTask",
        secondary=role_tasks_users,
        primaryjoin="User.id == role_tasks_users.c.user_id",
        secondaryjoin="RoleTask.id == role_tasks_users.c.role_task_id",
        viewonly=True
    )

    # Relationships - ALL with string foreign_keys using Class.Column notation
    students = relationship("Student", back_populates="user", foreign_keys="[Student.created_by]")

    clearance_requests = relationship("ClearanceRequest",
                                     back_populates="student_user",
                                     foreign_keys="[ClearanceRequest.student_user_id]")

    finance_clearances = relationship("FinanceClearance",
                                     back_populates="finance_officer",
                                     foreign_keys="[FinanceClearance.cleared_by]")

    examination_clearances = relationship("ExaminationClearance",
                                        back_populates="examination_officer",
                                        foreign_keys="[ExaminationClearance.cleared_by]")

    academic_clearances = relationship("AcademicClearance",
                                     back_populates="academic_officer",
                                     foreign_keys="[AcademicClearance.cleared_by]")

    dean_approvals = relationship("DeanApproval",
                                back_populates="dean",
                                foreign_keys="[DeanApproval.approved_by]")

    registry_actions = relationship("RegistryInventory",
                                  back_populates="registry_officer",
                                  foreign_keys="[RegistryInventory.marked_available_by]")

    collections = relationship("CertificateCollection",
                             back_populates="registry_officer",
                             foreign_keys="[CertificateCollection.registry_officer_id]")

    audit_logs = relationship("AuditLog",
                            back_populates="user",
                            foreign_keys="[AuditLog.user_id]")

    notifications_sent = relationship("Notification",
                                    back_populates="sender",
                                    foreign_keys="[Notification.sender_id]")

    appointments_created = relationship("CollectionAppointment",
                                      back_populates="created_by_user",
                                      foreign_keys="[CollectionAppointment.created_by]")

    # IP Rule relationships
    ip_rules_created = relationship("IPRule",
                                  back_populates="created_by_user",
                                  foreign_keys="[IPRule.created_by]")

    # IP Access Log relationships
    ip_access_logs = relationship("IPAccessLog",
                                back_populates="user",
                                foreign_keys="[IPAccessLog.user_id]")

    # Additional relationships with string foreign_keys
    appointments_cancelled = relationship("CollectionAppointment",
                                        back_populates="canceller",
                                        foreign_keys="[CollectionAppointment.cancelled_by]")

    clearance_requests_initiated = relationship("ClearanceRequest",
                                              back_populates="initiator",
                                              foreign_keys="[ClearanceRequest.initiated_by]")

    system_settings_updated = relationship("SystemSetting",
                                         back_populates="updated_by_user",
                                         foreign_keys="[SystemSetting.updated_by]")

    email_templates_created = relationship("EmailTemplate",
                                         back_populates="created_by_user",
                                         foreign_keys="[EmailTemplate.created_by]")

    # Session management relationships
    sessions = relationship("UserSession", back_populates="user", foreign_keys="[UserSession.user_id]")

    __table_args__ = (
        Index('ix_users_email_active', 'email', 'is_active'),
        Index('ix_users_department', 'department'),
    )


# ============= STUDENT MODELS =============

class Student(Base):
    __tablename__ = "students"

    total_fee = Column(Float, default=0.0)
    paid_fee = Column(Float, default=0.0)


    id = Column(Integer, primary_key=True, index=True)
    admission_number = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    programme = Column(String, nullable=True)
    department = Column(String, nullable=True)
    school = Column(String, nullable=True)
    registration_year = Column(Integer, nullable=True)
    status = Column(String, default="ACTIVE")
    gender = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)
    national_id = Column(String, unique=True, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    guardian_name = Column(String, nullable=True)
    guardian_phone = Column(String, nullable=True)
    photo_path = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="students", foreign_keys="[Student.created_by]")
    clearance_request = relationship("ClearanceRequest", back_populates="student", uselist=False, foreign_keys="[ClearanceRequest.student_id]")
    registry_inventory = relationship("RegistryInventory", back_populates="student", foreign_keys="[RegistryInventory.student_id]")
    collections = relationship("CertificateCollection", back_populates="student", foreign_keys="[CertificateCollection.student_id]")
    appointments = relationship("CollectionAppointment", back_populates="student", foreign_keys="[CollectionAppointment.student_id]")
    notifications = relationship("Notification", back_populates="student", foreign_keys="[Notification.student_id]")

    __table_args__ = (
        Index('idx_students_admission', 'admission_number'),
        Index('idx_students_name', 'full_name'),
        Index('idx_students_programme', 'programme'),
        Index('idx_students_status', 'status'),
    )

# ============= CLEARANCE MODELS =============
# ============= CLEARANCE MODELS =============

class ClearanceRequest(Base):
    __tablename__ = "clearance_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, unique=True)
    student_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    request_date = Column(DateTime(timezone=True), server_default=func.now())
    overall_status = Column(String, default="pending")
    collection_eligible = Column(Boolean, default=False)
    collection_eligible_date = Column(DateTime(timezone=True))
    expiry_date = Column(DateTime(timezone=True), nullable=True)
    initiated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships - with string foreign_keys using Class.Column notation
    student = relationship("Student", back_populates="clearance_request", foreign_keys="[ClearanceRequest.student_id]")
    student_user = relationship("User", back_populates="clearance_requests", foreign_keys="[ClearanceRequest.student_user_id]")
    initiator = relationship("User", foreign_keys="[ClearanceRequest.initiated_by]")
    finance_clearance = relationship("FinanceClearance", back_populates="clearance_request", uselist=False, foreign_keys="[FinanceClearance.clearance_request_id]")
    examination_clearance = relationship("ExaminationClearance", back_populates="clearance_request", uselist=False, foreign_keys="[ExaminationClearance.clearance_request_id]")
    academic_clearance = relationship("AcademicClearance", back_populates="clearance_request", uselist=False, foreign_keys="[AcademicClearance.clearance_request_id]")
    dean_approval = relationship("DeanApproval", back_populates="clearance_request", uselist=False, foreign_keys="[DeanApproval.clearance_request_id]")

    # Granular sub-tasks
    tasks = relationship("ClearanceTask", back_populates="clearance_request", cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_clearance_requests_status_date', 'overall_status', 'request_date'),
        Index('ix_clearance_requests_student_user_id', 'student_user_id'),
    )


class FinanceClearance(Base):
    __tablename__ = "finance_clearances"

    id = Column(Integer, primary_key=True, index=True)
    clearance_request_id = Column(Integer, ForeignKey("clearance_requests.id", ondelete="CASCADE"), nullable=False, unique=True)
    status = Column(Enum(ClearanceStatus), default=ClearanceStatus.PENDING)
    remarks = Column(Text)
    amount_due = Column(Float, default=0.0)
    amount_paid = Column(Float, default=0.0)
    outstanding_balance = Column(Float, default=0.0)
    cleared_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    cleared_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    clearance_request = relationship("ClearanceRequest", back_populates="finance_clearance", foreign_keys="[FinanceClearance.clearance_request_id]")
    finance_officer = relationship("User", back_populates="finance_clearances", foreign_keys="[FinanceClearance.cleared_by]")

    __table_args__ = (
        CheckConstraint('amount_due >= 0', name='check_amount_due'),
        CheckConstraint('amount_paid >= 0', name='check_amount_paid'),
        CheckConstraint('outstanding_balance >= 0', name='check_outstanding_balance'),
    )


class ExaminationClearance(Base):
    __tablename__ = "examination_clearances"

    id = Column(Integer, primary_key=True, index=True)
    clearance_request_id = Column(Integer, ForeignKey("clearance_requests.id", ondelete="CASCADE"), nullable=False, unique=True)
    status = Column(Enum(ClearanceStatus), default=ClearanceStatus.PENDING)
    remarks = Column(Text)
    results_released = Column(Boolean, default=False)
    program_completed = Column(Boolean, default=False)
    graduation_approved = Column(Boolean, default=False)
    no_missing_grades = Column(Boolean, default=False)
    credits_completed = Column(Boolean, default=False)
    thesis_submitted = Column(Boolean, default=False)
    internship_completed = Column(Boolean, default=False)
    cleared_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    cleared_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    clearance_request = relationship("ClearanceRequest", back_populates="examination_clearance", foreign_keys="[ExaminationClearance.clearance_request_id]")
    examination_officer = relationship("User", back_populates="examination_clearances", foreign_keys="[ExaminationClearance.cleared_by]")


# ============= ACADEMIC CLEARANCE MODELS =============

class AcademicClearance(Base):
    __tablename__ = "academic_clearances"

    id = Column(Integer, primary_key=True, index=True)
    clearance_request_id = Column(Integer, ForeignKey("clearance_requests.id", ondelete="CASCADE"), nullable=False, unique=True)
    status = Column(Enum(ClearanceStatus), default=ClearanceStatus.PENDING)
    remarks = Column(Text)
    results_verified = Column(Boolean, default=False)
    attendance_verified = Column(Boolean, default=False)
    library_clearance = Column(Boolean, default=False)
    laboratory_clearance = Column(Boolean, default=False)
    equipment_returned = Column(Boolean, default=False)
    cleared_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    cleared_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    clearance_request = relationship("ClearanceRequest", back_populates="academic_clearance", foreign_keys="[AcademicClearance.clearance_request_id]")
    academic_officer = relationship("User", back_populates="academic_clearances", foreign_keys="[AcademicClearance.cleared_by]")


class DeanApproval(Base):
    __tablename__ = "dean_approvals"

    id = Column(Integer, primary_key=True, index=True)
    clearance_request_id = Column(Integer, ForeignKey("clearance_requests.id", ondelete="CASCADE"), nullable=False, unique=True)
    status = Column(Enum(ClearanceStatus), default=ClearanceStatus.PENDING)
    remarks = Column(Text)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    clearance_request = relationship("ClearanceRequest", back_populates="dean_approval", foreign_keys="[DeanApproval.clearance_request_id]")
    dean = relationship("User", back_populates="dean_approvals", foreign_keys="[DeanApproval.approved_by]")


# ============= REGISTRY INVENTORY MODELS =============

class RegistryInventory(Base):
    __tablename__ = "registry_inventory"

    id = Column(Integer, primary_key=True, index=True)
    certificate_number = Column(String, unique=True, index=True, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    programme = Column(String, nullable=False)
    graduation_year = Column(String)
    storage_location = Column(String)
    storage_location_id = Column(Integer, ForeignKey("storage_locations.id"), nullable=True)
    status = Column(Enum(CertificateStatus), default=CertificateStatus.AWAITING_CLEARANCE)
    certificate_type = Column(String, default="Diploma")  # Diploma, Craft, Transcript, Testimonial  # <-- ADDED
    date_received = Column(DateTime(timezone=True), server_default=func.now())
    marked_available_by = Column(Integer, ForeignKey("users.id"), nullable=True)
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
    document_hash = Column(String, nullable=True)
    batch_number = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships - with string foreign_keys using Class.Column notation
    student = relationship("Student", back_populates="registry_inventory", foreign_keys="[RegistryInventory.student_id]")
    registry_officer = relationship("User", back_populates="registry_actions", foreign_keys="[RegistryInventory.marked_available_by]")
    storage_location_ref = relationship("StorageLocation", back_populates="certificates", foreign_keys="[RegistryInventory.storage_location_id]")
    collection = relationship("CertificateCollection", back_populates="certificate", uselist=False, foreign_keys="[CertificateCollection.certificate_id]")

    __table_args__ = (
        Index('ix_registry_inventory_status_student', 'status', 'student_id'),
    )


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
    is_full = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    certificates = relationship("RegistryInventory", back_populates="storage_location_ref", foreign_keys="[RegistryInventory.storage_location_id]")
    created_by_user = relationship("User", foreign_keys="[StorageLocation.created_by]")

    __table_args__ = (
        Index('ix_storage_locations_building_room', 'building', 'room'),
        CheckConstraint('capacity >= 0', name='check_capacity'),
        CheckConstraint('current_count >= 0', name='check_current_count'),
    )


class StorageLocationHistory(Base):
    __tablename__ = "storage_location_history"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(Integer, ForeignKey("registry_inventory.id", ondelete="CASCADE"), nullable=False)
    location_id = Column(Integer, ForeignKey("storage_locations.id", ondelete="CASCADE"), nullable=False)
    action = Column(String, nullable=False)
    previous_location_id = Column(Integer, ForeignKey("storage_locations.id"), nullable=True)
    performed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships - with string foreign_keys using Class.Column notation
    certificate = relationship("RegistryInventory", foreign_keys="[StorageLocationHistory.certificate_id]")
    location = relationship("StorageLocation", foreign_keys="[StorageLocationHistory.location_id]")
    previous_location = relationship("StorageLocation", foreign_keys="[StorageLocationHistory.previous_location_id]")
    performer = relationship("User", foreign_keys="[StorageLocationHistory.performed_by]")


# ============= COLLECTION MODELS =============

class CollectionAppointment(Base):
    __tablename__ = "collection_appointments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    certificate_id = Column(Integer, ForeignKey("registry_inventory.id", ondelete="CASCADE"), nullable=False)
    appointment_date = Column(DateTime(timezone=True), nullable=False)
    appointment_time = Column(String, nullable=False)
    duration_minutes = Column(Integer, default=30)
    location = Column(String)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.SCHEDULED)
    notes = Column(Text)
    confirmation_sent = Column(Boolean, default=False)
    reminder_sent = Column(Boolean, default=False)
    cancelled_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships - with string foreign_keys using Class.Column notation
    student = relationship("Student", back_populates="appointments", foreign_keys="[CollectionAppointment.student_id]")
    created_by_user = relationship("User", back_populates="appointments_created", foreign_keys="[CollectionAppointment.created_by]")
    canceller = relationship("User", foreign_keys="[CollectionAppointment.cancelled_by]")

    __table_args__ = (
        Index('ix_appointments_date_status', 'appointment_date', 'status'),
        CheckConstraint('duration_minutes > 0', name='check_duration'),
    )


class CertificateCollection(Base):
    __tablename__ = "certificate_collections"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(Integer, ForeignKey("registry_inventory.id", ondelete="CASCADE"), nullable=False, unique=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    collection_date = Column(DateTime(timezone=True), nullable=False)
    collection_time = Column(String, nullable=False)
    collection_method = Column(Enum(CollectionMethod), nullable=False)
    identification_document = Column(String, nullable=False)
    identification_number = Column(String, nullable=False)
    recipient_name = Column(String, nullable=False)
    recipient_signature = Column(Text)
    recipient_relationship = Column(String, nullable=True)
    authorization_letter = Column(Text, nullable=True)
    registry_officer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    acknowledgement_received = Column(Boolean, default=True)
    notes = Column(Text)
    tracking_number = Column(String, nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships - with string foreign_keys using Class.Column notation
    certificate = relationship("RegistryInventory", back_populates="collection", foreign_keys="[CertificateCollection.certificate_id]")
    student = relationship("Student", back_populates="collections", foreign_keys="[CertificateCollection.student_id]")
    registry_officer = relationship("User", back_populates="collections", foreign_keys="[CertificateCollection.registry_officer_id]")

    __table_args__ = (
        Index('ix_collections_date', 'collection_date'),
        Index('ix_collections_method', 'collection_method'),
    )


# ============= NOTIFICATIONS MODELS =============

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notification_type = Column(Enum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True))
    link = Column(String)
    extra_data = Column(JSON)
    priority = Column(String, default="normal")
    sent_via_email = Column(Boolean, default=False)
    sent_via_sms = Column(Boolean, default=False)
    email_sent_at = Column(DateTime(timezone=True), nullable=True)
    sms_sent_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships - with string foreign_keys using Class.Column notation
    student = relationship("Student", back_populates="notifications", foreign_keys="[Notification.student_id]")
    sender = relationship("User", back_populates="notifications_sent", foreign_keys="[Notification.sender_id]")

    __table_args__ = (
        Index('ix_notifications_student_read', 'student_id', 'is_read'),
        Index('ix_notifications_type_created', 'notification_type', 'created_at'),
    )


# ============= EMAIL TEMPLATE MODELS =============

class EmailTemplate(Base):
    """Email templates for notifications"""
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    subject = Column(String, nullable=False)
    body_html = Column(Text, nullable=False)
    body_text = Column(Text, nullable=False)
    notification_type = Column(Enum(NotificationType), nullable=True)
    variables = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    created_by_user = relationship("User", foreign_keys="[EmailTemplate.created_by]")


# ============= AUDIT MODELS =============

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False, index=True)
    module = Column(String, nullable=False, index=True)
    details = Column(Text)
    metadata_json = Column(JSON, nullable=True)
    previous_status = Column(String, nullable=True)
    new_status = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(Text, nullable=True)
    subject_username = Column(String, index=True, nullable=True)
    severity = Column(Enum(LogSeverity), default=LogSeverity.INFO)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    request_id = Column(String, nullable=True, index=True)
    session_id = Column(String, nullable=True, index=True)
    prev_hash = Column(String, nullable=True)
    entry_hash = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="audit_logs", foreign_keys="[AuditLog.user_id]")

    __table_args__ = (
        Index('ix_audit_logs_action_created', 'action', 'created_at'),
        Index('ix_audit_logs_user_module', 'user_id', 'module'),
        Index('ix_audit_logs_severity_created', 'severity', 'created_at'),
    )


# ==========================================
# PHASE 4: GRANULAR TASK PERMISSIONS
# ==========================================

class Task(Base):
    """Available tasks/permissions in the system"""
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    department = Column(String, nullable=True)
    category = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user_tasks = relationship("UserTask", back_populates="task", foreign_keys="[UserTask.task_id]")
    role_tasks = relationship("RoleTask", back_populates="task", foreign_keys="[RoleTask.task_id]")


class UserTask(Base):
    """Direct user-task assignments (overrides role permissions)"""
    __tablename__ = "user_tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    is_enabled = Column(Boolean, default=True)
    granted_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    granted_at = Column(DateTime(timezone=True), default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships - with string foreign_keys using Class.Column notation
    user = relationship("User", back_populates="tasks", foreign_keys="[UserTask.user_id]")
    task = relationship("Task", back_populates="user_tasks", foreign_keys="[UserTask.task_id]")
    granter = relationship("User", foreign_keys="[UserTask.granted_by]")

    __table_args__ = (
        Index('ix_user_tasks_user_task', 'user_id', 'task_id', unique=True),
    )


class RoleTask(Base):
    """Role-level task permissions"""
    __tablename__ = "role_tasks"

    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships - with string foreign_keys using Class.Column notation
    role = relationship("Role", back_populates="tasks", foreign_keys="[RoleTask.role_id]")
    task = relationship("Task", back_populates="role_tasks", foreign_keys="[RoleTask.task_id]")

    __table_args__ = (
        Index('ix_role_tasks_role_task', 'role_id', 'task_id', unique=True),
    )


# ==========================================
# IP ACCESS CONTROL MODELS
# ==========================================

class IPRule(Base):
    """IP-based access control rules"""
    __tablename__ = "ip_rules"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, nullable=False, index=True)
    rule_type = Column(Enum(IPRuleType), nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships - with string foreign_keys using Class.Column notation
    created_by_user = relationship("User", back_populates="ip_rules_created", foreign_keys="[IPRule.created_by]")
    logs = relationship("IPAccessLog", back_populates="rule", foreign_keys="[IPAccessLog.rule_id]")

    __table_args__ = (
        Index('ix_ip_rules_ip_active', 'ip_address', 'is_active'),
        Index('ix_ip_rules_type_active', 'rule_type', 'is_active'),
    )

    def __repr__(self):
        return f"<IPRule {self.ip_address} ({self.rule_type})>"


class IPAccessLog(Base):
    """Track blocked/allowed IP access attempts"""
    __tablename__ = "ip_access_logs"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False)
    path = Column(String, nullable=True)
    method = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    rule_id = Column(Integer, ForeignKey("ip_rules.id"), nullable=True)
    response_status = Column(Integer, nullable=True)
    request_headers = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships - with string foreign_keys using Class.Column notation
    user = relationship("User", back_populates="ip_access_logs", foreign_keys="[IPAccessLog.user_id]")
    rule = relationship("IPRule", back_populates="logs", foreign_keys="[IPAccessLog.rule_id]")

    __table_args__ = (
        Index('ix_ip_access_logs_ip_created', 'ip_address', 'created_at'),
        Index('ix_ip_access_logs_action_created', 'action', 'created_at'),
    )


# ==========================================
# SYSTEM CONFIGURATION MODELS
# ==========================================

class SystemSetting(Base):
    """System-wide configuration settings"""
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)
    value_type = Column(String, default="string")
    category = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    is_encrypted = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_by_user = relationship("User", foreign_keys="[SystemSetting.updated_by]")

    __table_args__ = (
        Index('ix_system_settings_category', 'category'),
    )


class SystemAudit(Base):
    """Audit of system-level changes (config, settings, etc.)"""
    __tablename__ = "system_audits"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    ip_address = Column(String, nullable=True)
    severity = Column(Enum(LogSeverity), default=LogSeverity.INFO)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys="[SystemAudit.user_id]")

    __table_args__ = (
        Index('ix_system_audits_action_created', 'action', 'created_at'),
    )


# ==========================================
# USER SESSION MANAGEMENT MODEL
# ==========================================

class UserSession(Base):
    """Track active user sessions for JWT blacklisting and concurrent limits"""
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    jti = Column(String, unique=True, index=True, nullable=False)  # JWT ID
    device_info = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="sessions", foreign_keys="[UserSession.user_id]")


# ==========================================
# PHASE 1: GRANULAR CLEARANCE TASKS
# ==========================================

class ClearanceTaskTemplate(Base):
    """Reusable task definitions for clearance workflows (The Blueprint)"""
    __tablename__ = "clearance_task_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g., "Library Book Return"
    department = Column(String, nullable=False)  # e.g., "library", "finance"
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)  # For dependency ordering (0 = first)
    is_active = Column(Boolean, default=True)
    due_days = Column(Integer, default=3)  # SLA in days
    required_documents = Column(JSON, nullable=True)  # e.g., ["receipt.pdf"]
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    tasks = relationship("ClearanceTask", back_populates="template")


class ClearanceTask(Base):
    """Individual task instance for a specific student's clearance (The Instance)"""
    __tablename__ = "clearance_tasks"

    id = Column(Integer, primary_key=True, index=True)
    clearance_request_id = Column(Integer, ForeignKey("clearance_requests.id", ondelete="CASCADE"), nullable=False)
    template_id = Column(Integer, ForeignKey("clearance_task_templates.id"), nullable=False)

    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)  # Staff member

    status = Column(Enum(ClearanceStatus), default=ClearanceStatus.PENDING)
    priority = Column(String, default="normal")  # low, normal, high, urgent

    due_date = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    notes = Column(Text, nullable=True)
    document_refs = Column(JSON, nullable=True)  # URLs to uploaded docs

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    clearance_request = relationship("ClearanceRequest", back_populates="tasks")
    template = relationship("ClearanceTaskTemplate", back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assigned_to])
