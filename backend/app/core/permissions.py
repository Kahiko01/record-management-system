"""
Role-Based Access Control (RBAC) - Permission Definitions
Enhanced for University Digital Certificate Ecosystem
"""
import logging
from enum import Enum
from typing import List, Optional
from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session

from ..models.models import User, UserRole, Student, UserTask, Task
from ..auth.auth import get_current_active_user
from ..core.database import get_db

logger = logging.getLogger(__name__)

# ============= 1. PERMISSION DEFINITIONS (THE KEYS) =============

class Permission(str, Enum):
    # ===== STUDENT PERMISSIONS =====
    STUDENT_VIEW_CERTIFICATE_STATUS = "student:view_certificate_status"
    STUDENT_VIEW_COLLECTION_STATUS = "student:view_collection_status"
    STUDENT_VIEW_CLEARANCE_PROGRESS = "student:view_clearance_progress"
    STUDENT_UPDATE_CONTACT = "student:update_contact"
    STUDENT_VIEW_APPOINTMENT = "student:view_appointment"
    STUDENT_CANCEL_APPOINTMENT = "student:cancel_appointment"
    STUDENT_RESCHEDULE_APPOINTMENT = "student:reschedule_appointment"
    STUDENT_APPLY_CLEARANCE = "student:apply_clearance"
    STUDENT_VIEW_OWN_NOTIFICATIONS = "student:view_own_notifications"

    # ===== FINANCE PERMISSIONS =====
    FINANCE_VIEW_DASHBOARD = "finance:view_dashboard"
    FINANCE_SEARCH_STUDENTS = "finance:search_students"
    FINANCE_VIEW_PENDING = "finance:view_pending"
    FINANCE_VIEW_HISTORY = "finance:view_history"
    FINANCE_VIEW_REPORTS = "finance:view_reports"
    FINANCE_APPROVE = "finance:approve"
    FINANCE_REJECT = "finance:reject"
    FINANCE_RETURN_FOR_REVIEW = "finance:return_for_review"
    FINANCE_ADD_COMMENTS = "finance:add_comments"
    FINANCE_EXPORT_REPORTS = "finance:export_reports"
    FINANCE_CREATE_NOTIFICATION = "finance:create_notification"

    # ===== EXAMINATION PERMISSIONS =====
    EXAM_VIEW_DASHBOARD = "exam:view_dashboard"
    EXAM_VIEW_PENDING = "exam:view_pending"
    EXAM_VERIFY_ACADEMIC = "exam:verify_academic"
    EXAM_APPROVE = "exam:approve"
    EXAM_REJECT = "exam:reject"
    EXAM_RETURN_FOR_REVIEW = "exam:return_for_review"
    EXAM_ADD_REMARKS = "exam:add_remarks"
    EXAM_VIEW_REPORTS = "exam:view_reports"
    EXAM_EXPORT_REPORTS = "exam:export_reports"
    EXAM_CREATE_NOTIFICATION = "exam:create_notification"

    # ===== DEAN PERMISSIONS (NEW!) =====
    DEAN_VIEW_DASHBOARD = "dean:view_dashboard"
    DEAN_VIEW_PENDING = "dean:view_pending"
    DEAN_APPROVE = "dean:approve"
    DEAN_REJECT = "dean:reject"
    DEAN_ADD_REMARKS = "dean:add_remarks"
    DEAN_VIEW_REPORTS = "dean:view_reports"

    # ===== REGISTRY PERMISSIONS =====
    REGISTRY_VIEW_DASHBOARD = "registry:view_dashboard"
    REGISTRY_SEARCH_CLEARED = "registry:search_cleared"
    REGISTRY_SEARCH_INVENTORY = "registry:search_inventory"
    REGISTRY_VIEW_INVENTORY = "registry:view_inventory"
    REGISTRY_ADD_INVENTORY = "registry:add_inventory"
    REGISTRY_UPDATE_INVENTORY = "registry:update_inventory"
    REGISTRY_ARCHIVE_INVENTORY = "registry:archive_inventory"
    REGISTRY_REMOVE_INVENTORY = "registry:remove_inventory"
    REGISTRY_ASSIGN_STORAGE = "registry:assign_storage"
    REGISTRY_UPDATE_STORAGE = "registry:update_storage"
    REGISTRY_MARK_AVAILABLE = "registry:mark_available"
    REGISTRY_MARK_ON_HOLD = "registry:mark_on_hold"
    REGISTRY_SCHEDULE_COLLECTION = "registry:schedule_collection"
    REGISTRY_VERIFY_IDENTITY = "registry:verify_identity"
    REGISTRY_VERIFY_COLLECTION = "registry:verify_collection"
    REGISTRY_RECORD_COLLECTION = "registry:record_collection"
    REGISTRY_CANCEL_COLLECTION = "registry:cancel_collection"
    REGISTRY_MANAGE_REPLACEMENT = "registry:manage_replacement"
    REGISTRY_VIEW_REPORTS = "registry:view_reports"
    REGISTRY_EXPORT_REPORTS = "registry:export_reports"
    REGISTRY_CREATE_NOTIFICATION = "registry:create_notification"

    # ===== STORAGE PERMISSIONS =====
    STORAGE_CREATE_LOCATION = "storage:create_location"
    STORAGE_UPDATE_LOCATION = "storage:update_location"
    STORAGE_DELETE_LOCATION = "storage:delete_location"
    STORAGE_VIEW = "storage:view"
    STORAGE_ASSIGN_CERTIFICATE = "storage:assign_certificate"
    STORAGE_TRANSFER_CERTIFICATE = "storage:transfer_certificate"
    STORAGE_AUDIT = "storage:audit"

    # ===== AUDITOR PERMISSIONS (Read-Only) =====
    AUDITOR_VIEW_LOGS = "auditor:view_logs"
    AUDITOR_VIEW_LOGIN_HISTORY = "auditor:view_login_history"
    AUDITOR_VIEW_ACTIVITY = "auditor:view_activity"
    AUDITOR_VIEW_CLEARANCE_HISTORY = "auditor:view_clearance_history"
    AUDITOR_VIEW_COLLECTION_HISTORY = "auditor:view_collection_history"
    AUDITOR_VIEW_REPORTS = "auditor:view_reports"
    AUDITOR_EXPORT_REPORTS = "auditor:export_reports"
    AUDITOR_SEARCH_LOGS = "auditor:search_logs"

    # ===== NOTIFICATION PERMISSIONS =====
    NOTIFICATION_CREATE = "notification:create"
    NOTIFICATION_UPDATE = "notification:update"
    NOTIFICATION_DELETE = "notification:delete"
    NOTIFICATION_SEND = "notification:send"
    NOTIFICATION_VIEW_ALL = "notification:view_all"
    NOTIFICATION_BROADCAST = "notification:broadcast"
    NOTIFICATION_MANAGE_SETTINGS = "notification:manage_settings"

    # ===== SEARCH PERMISSIONS =====
    SEARCH_STUDENTS = "search:students"
    SEARCH_REGISTRY_INVENTORY = "search:registry_inventory"
    SEARCH_AUDIT_LOGS = "search:audit_logs"
    SEARCH_COLLECTIONS = "search:collections"
    SEARCH_CLEARANCE_REQUESTS = "search:clearance_requests"
    SEARCH_USERS = "search:users"

    # ===== USER MANAGEMENT PERMISSIONS =====
    USER_CREATE = "user:create"
    USER_VIEW = "user:view"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"
    USER_ACTIVATE = "user:activate"
    USER_DEACTIVATE = "user:deactivate"
    USER_RESET_PASSWORD = "user:reset_password"
    USER_ASSIGN_ROLE = "user:assign_role"
    USER_REMOVE_ROLE = "user:remove_role"
    USER_LOCK = "user:lock"
    USER_UNLOCK = "user:unlock"

    # ===== DASHBOARD PERMISSIONS =====
    DASHBOARD_VIEW_STUDENT = "dashboard:view_student"
    DASHBOARD_VIEW_FINANCE = "dashboard:view_finance"
    DASHBOARD_VIEW_EXAMINATION = "dashboard:view_examination"
    DASHBOARD_VIEW_DEAN = "dashboard:view_dean"
    DASHBOARD_VIEW_REGISTRY = "dashboard:view_registry"
    DASHBOARD_VIEW_AUDITOR = "dashboard:view_auditor"
    DASHBOARD_VIEW_ADMIN = "dashboard:view_admin"

    # ===== LEGACY ADMIN PERMISSIONS =====
    ADMIN_MANAGE_USERS = "admin:manage_users"
    ADMIN_MANAGE_ROLES = "admin:manage_roles"
    ADMIN_MANAGE_DEPARTMENTS = "admin:manage_departments"
    ADMIN_VIEW_ALL_DASHBOARDS = "admin:view_all_dashboards"
    ADMIN_VIEW_ALL_REPORTS = "admin:view_all_reports"
    ADMIN_VIEW_ALL_LOGS = "admin:view_all_logs"
    ADMIN_CONFIGURE_SYSTEM = "admin:configure_system"
    ADMIN_MANAGE_INVENTORY = "admin:manage_inventory"
    ADMIN_ACTIVATE_ACCOUNTS = "admin:activate_accounts"
    ADMIN_RESET_PASSWORDS = "admin:reset_passwords"
    ADMIN_VIEW_AUDIT = "admin:view_audit"

# ============= 2. ROLE TO PERMISSIONS MAPPING (THE KEYCHAINS) =============

ROLE_PERMISSIONS = {
    UserRole.STUDENT: [
        Permission.STUDENT_VIEW_CERTIFICATE_STATUS, Permission.STUDENT_VIEW_COLLECTION_STATUS,
        Permission.STUDENT_VIEW_CLEARANCE_PROGRESS, Permission.STUDENT_UPDATE_CONTACT,
        Permission.STUDENT_VIEW_APPOINTMENT, Permission.STUDENT_CANCEL_APPOINTMENT,
        Permission.STUDENT_RESCHEDULE_APPOINTMENT, Permission.STUDENT_APPLY_CLEARANCE,
        Permission.STUDENT_VIEW_OWN_NOTIFICATIONS, Permission.DASHBOARD_VIEW_STUDENT,
    ],

    UserRole.FINANCE: [
        Permission.FINANCE_VIEW_DASHBOARD, Permission.FINANCE_SEARCH_STUDENTS,
        Permission.FINANCE_VIEW_PENDING, Permission.FINANCE_VIEW_HISTORY,
        Permission.FINANCE_VIEW_REPORTS, Permission.FINANCE_APPROVE,
        Permission.FINANCE_REJECT, Permission.FINANCE_RETURN_FOR_REVIEW,
        Permission.FINANCE_ADD_COMMENTS, Permission.FINANCE_EXPORT_REPORTS,
        Permission.FINANCE_CREATE_NOTIFICATION, Permission.SEARCH_STUDENTS,
        Permission.DASHBOARD_VIEW_FINANCE,
    ],

    UserRole.EXAMINATION_OFFICE: [
        Permission.EXAM_VIEW_DASHBOARD, Permission.EXAM_VIEW_PENDING,
        Permission.EXAM_VERIFY_ACADEMIC, Permission.EXAM_APPROVE,
        Permission.EXAM_REJECT, Permission.EXAM_RETURN_FOR_REVIEW,
        Permission.EXAM_ADD_REMARKS, Permission.EXAM_VIEW_REPORTS,
        Permission.EXAM_EXPORT_REPORTS, Permission.EXAM_CREATE_NOTIFICATION,
        Permission.SEARCH_STUDENTS, Permission.DASHBOARD_VIEW_EXAMINATION,
    ],

    # NEW: DEAN ROLE
    UserRole.DEAN: [
        Permission.DEAN_VIEW_DASHBOARD, Permission.DEAN_VIEW_PENDING,
        Permission.DEAN_APPROVE, Permission.DEAN_REJECT,
        Permission.DEAN_ADD_REMARKS, Permission.DEAN_VIEW_REPORTS,
        Permission.SEARCH_STUDENTS, Permission.DASHBOARD_VIEW_DEAN,
    ],

    UserRole.REGISTRY_OFFICER: [
        Permission.REGISTRY_VIEW_DASHBOARD, Permission.REGISTRY_SEARCH_CLEARED,
        Permission.REGISTRY_SEARCH_INVENTORY, Permission.REGISTRY_VIEW_INVENTORY,
        Permission.REGISTRY_ADD_INVENTORY, Permission.REGISTRY_UPDATE_INVENTORY,
        Permission.REGISTRY_ARCHIVE_INVENTORY, Permission.REGISTRY_REMOVE_INVENTORY,
        Permission.REGISTRY_ASSIGN_STORAGE, Permission.REGISTRY_UPDATE_STORAGE,
        Permission.REGISTRY_MARK_AVAILABLE, Permission.REGISTRY_MARK_ON_HOLD,
        Permission.REGISTRY_SCHEDULE_COLLECTION, Permission.REGISTRY_VERIFY_IDENTITY,
        Permission.REGISTRY_VERIFY_COLLECTION, Permission.REGISTRY_RECORD_COLLECTION,
        Permission.REGISTRY_CANCEL_COLLECTION, Permission.REGISTRY_MANAGE_REPLACEMENT,
        Permission.REGISTRY_VIEW_REPORTS, Permission.REGISTRY_EXPORT_REPORTS,
        Permission.REGISTRY_CREATE_NOTIFICATION, Permission.STORAGE_CREATE_LOCATION,
        Permission.STORAGE_UPDATE_LOCATION, Permission.STORAGE_VIEW,
        Permission.STORAGE_ASSIGN_CERTIFICATE, Permission.STORAGE_TRANSFER_CERTIFICATE,
        Permission.SEARCH_STUDENTS, Permission.SEARCH_REGISTRY_INVENTORY,
        Permission.SEARCH_COLLECTIONS, Permission.DASHBOARD_VIEW_REGISTRY,
    ],

    UserRole.INTERNAL_AUDITOR: [
        Permission.AUDITOR_VIEW_LOGS, Permission.AUDITOR_VIEW_LOGIN_HISTORY,
        Permission.AUDITOR_VIEW_ACTIVITY, Permission.AUDITOR_VIEW_CLEARANCE_HISTORY,
        Permission.AUDITOR_VIEW_COLLECTION_HISTORY, Permission.AUDITOR_VIEW_REPORTS,
        Permission.AUDITOR_EXPORT_REPORTS, Permission.AUDITOR_SEARCH_LOGS,
        Permission.SEARCH_AUDIT_LOGS, Permission.SEARCH_COLLECTIONS,
        Permission.SEARCH_CLEARANCE_REQUESTS, Permission.DASHBOARD_VIEW_AUDITOR,
    ],
}

# ============= 3. PERMISSION CHECK FUNCTIONS (ZERO TRUST) =============

def get_user_effective_role(user: User):
    """Helper to get the role string, checking new active_role first, then legacy role"""
    if hasattr(user, 'active_role') and user.active_role:
        return user.active_role.name
    if hasattr(user, 'role') and user.role:
        return str(user.role).lower()
    return None

def has_permission(user: User, permission: Permission, db: Session = None) -> bool:
    """
    TRUE ZERO TRUST: Only checks user_tasks table.
    Roles are just labels - they grant NOTHING automatically.
    Every permission must be explicitly granted via task checkboxes.
    """
    if not user: return False
    if not getattr(user, 'is_active', True): return False
    
    # Super Admin bypass (the only exception)
    role_name = get_user_effective_role(user)
    if role_name in ["super_admin", "admin"]:
        return True
    
    # If no database session provided, we can't check tasks
    if not db:
        return False
    
    # Convert Permission enum to task code (e.g., "finance:approve" -> "finance_approve")
    # This allows us to check if the user has the specific task enabled
    task_code = permission.value.replace(":", "_")
    
    # Check if user has this specific task enabled in user_tasks table
    task = db.query(Task).filter(Task.code == task_code).first()
    if not task:
        # Task doesn't exist in database = permission denied
        return False
    
    user_task = db.query(UserTask).filter(
        UserTask.user_id == user.id,
        UserTask.task_id == task.id,
        UserTask.is_enabled == True
    ).first()
    
    return user_task is not None

def has_any_permission(user: User, permissions: List[Permission], db: Session = None) -> bool:
    return any(has_permission(user, p, db) for p in permissions)

def has_all_permissions(user: User, permissions: List[Permission], db: Session = None) -> bool:
    return all(has_permission(user, p, db) for p in permissions)

def get_user_permissions(user: User, db: Session = None) -> List[str]:
    if not user: return []

    role_name = get_user_effective_role(user)
    if role_name in ["super_admin", "admin"]:
        return [p.value for p in Permission]

    perms = set()
    
    # Check tasks from database
    if db:
        user_tasks = db.query(UserTask).filter(
            UserTask.user_id == user.id,
            UserTask.is_enabled == True
        ).all()
        
        for ut in user_tasks:
            task = db.query(Task).filter(Task.id == ut.task_id).first()
            if task:
                # Convert task code back to permission format
                perms.add(task.code.replace("_", ":"))

    return list(perms)

# ============= 4. FASTAPI DEPENDENCIES (THE SECURITY GUARDS) =============

def require_permission(permission: Permission):
    def permission_checker(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ):
        if not has_permission(current_user, permission, db):
            logger.warning(f"Task Authorization Failed: User {current_user.username} lacks permission '{permission.value}'")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"Access Denied. You do not have the '{permission.value}' permission."
            )
        return current_user
    return permission_checker

def require_any_permission(permissions: List[Permission]):
    def permission_checker(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ):
        if not has_any_permission(current_user, permissions, db):
            logger.warning(f"Authorization Failed: User {current_user.username} lacked required permissions.")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied. You do not have the required permissions.")
        return current_user
    return permission_checker

def require_role(roles: List[UserRole]):
    def role_checker(current_user: User = Depends(get_current_active_user)):
        if current_user.role not in roles:
             logger.warning(f"Authorization Failed: User {current_user.username} attempted to access role-restricted endpoint.")
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied. Invalid role.")
        return current_user
    return role_checker

def require_student_ownership():
    def ownership_checker(
        student_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user)
    ):
        if current_user.role == UserRole.SUPER_ADMIN: return current_user
        if current_user.role != UserRole.STUDENT:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied. Only students can access student records.")
        if db is None:
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database session error.")
        student = db.query(Student).filter(Student.id == student_id, Student.user_id == current_user.id).first()
        if not student:
            logger.warning(f"Ownership Violation: Student User {current_user.id} attempted to access Student Record {student_id}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied. You can only access your own records.")
        return current_user
    return ownership_checker

# ==========================================
# PHASE 4: GRANULAR TASK PERMISSIONS
# ==========================================

def has_task(user: User, task_code: str, db: Session) -> bool:
    """
    Checks if a user has a specific granular task enabled.
    Example: has_task(user, 'registry_upload', db)
    """
    if not user: return False

    # 1. Super Admin Override
    role_name = get_user_effective_role(user)
    if role_name in ["super_admin", "admin"]:
        return True

    # 2. Find the task by its code
    task = db.query(Task).filter(Task.code == task_code).first()
    if not task: return False

    # 3. Check if the user has this task enabled in user_tasks table
    user_task = db.query(UserTask).filter(
        UserTask.user_id == user.id,
        UserTask.task_id == task.id,
        UserTask.is_enabled == True
    ).first()

    return user_task is not None

def require_task(task_code: str):
    """
    FastAPI Dependency to protect endpoints with granular tasks.
    Usage: @router.post("/upload", dependencies=[Depends(require_task("registry_upload"))])
    """
    def task_checker(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ):
        if not has_task(current_user, task_code, db):
            logger.warning(f"Task Authorization Failed: User {current_user.username} lacked task '{task_code}'")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied. You do not have the '{task_code}' permission."
            )
        return current_user
    return task_checker
