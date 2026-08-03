"""
Role-Based Access Control (RBAC) - Permission Definitions
"""
from enum import Enum
from typing import List, Optional
from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from ..models.models import User, UserRole
from ..auth.auth import get_current_active_user

# ============= PERMISSION DEFINITIONS =============

class Permission(str, Enum):
    # Student Permissions
    STUDENT_VIEW_PROFILE = "student:view_profile"
    STUDENT_APPLY_CLEARANCE = "student:apply_clearance"
    STUDENT_VIEW_CLEARANCE = "student:view_clearance"
    STUDENT_VIEW_NOTIFICATIONS = "student:view_notifications"
    STUDENT_BOOK_APPOINTMENT = "student:book_appointment"
    STUDENT_VIEW_CERTIFICATE = "student:view_certificate"

    # Finance Permissions
    FINANCE_VIEW_PENDING = "finance:view_pending"
    FINANCE_SEARCH_STUDENTS = "finance:search_students"
    FINANCE_VIEW_CLEARANCE = "finance:view_clearance"
    FINANCE_APPROVE = "finance:approve"
    FINANCE_REJECT = "finance:reject"
    FINANCE_ADD_COMMENTS = "finance:add_comments"
    FINANCE_VIEW_REPORTS = "finance:view_reports"

    # Examination Permissions
    EXAM_VIEW_PENDING = "exam:view_pending"
    EXAM_VERIFY_ACADEMIC = "exam:verify_academic"
    EXAM_APPROVE = "exam:approve"
    EXAM_REJECT = "exam:reject"
    EXAM_ADD_REMARKS = "exam:add_remarks"
    EXAM_VIEW_REPORTS = "exam:view_reports"

    # Registry Permissions - ALL of them
    REGISTRY_VIEW_CLEARED = "registry:view_cleared"
    REGISTRY_SEARCH_INVENTORY = "registry:search_inventory"
    REGISTRY_VIEW_INVENTORY = "registry:view_inventory"  # <-- ADDED MISSING
    REGISTRY_MARK_AVAILABLE = "registry:mark_available"
    REGISTRY_SCHEDULE_APPOINTMENT = "registry:schedule_appointment"
    REGISTRY_VERIFY_IDENTITY = "registry:verify_identity"
    REGISTRY_RECORD_COLLECTION = "registry:record_collection"
    REGISTRY_VIEW_REPORTS = "registry:view_reports"
    REGISTRY_MANAGE_REPLACEMENT = "registry:manage_replacement"
    REGISTRY_ADD_INVENTORY = "registry:add_inventory"
    REGISTRY_UPDATE_INVENTORY = "registry:update_inventory"
    REGISTRY_DELETE_INVENTORY = "registry:delete_inventory"

    # Storage Permissions
    STORAGE_CREATE = "storage:create"
    STORAGE_UPDATE = "storage:update"
    STORAGE_DELETE = "storage:delete"
    STORAGE_VIEW = "storage:view"
    STORAGE_ASSIGN = "storage:assign"

    # Auditor Permissions
    AUDITOR_VIEW_LOGS = "auditor:view_logs"
    AUDITOR_VIEW_ACTIVITY = "auditor:view_activity"
    AUDITOR_VIEW_LOGIN_HISTORY = "auditor:view_login_history"
    AUDITOR_VIEW_CLEARANCE_HISTORY = "auditor:view_clearance_history"
    AUDITOR_VIEW_COLLECTION_HISTORY = "auditor:view_collection_history"
    AUDITOR_GENERATE_REPORTS = "auditor:generate_reports"
    AUDITOR_EXPORT_REPORTS = "auditor:export_reports"

    # Admin Permissions - ALL of them
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

# ============= ROLE TO PERMISSIONS MAPPING =============

ROLE_PERMISSIONS = {
    UserRole.STUDENT: [
        Permission.STUDENT_VIEW_PROFILE,
        Permission.STUDENT_APPLY_CLEARANCE,
        Permission.STUDENT_VIEW_CLEARANCE,
        Permission.STUDENT_VIEW_NOTIFICATIONS,
        Permission.STUDENT_BOOK_APPOINTMENT,
        Permission.STUDENT_VIEW_CERTIFICATE,
    ],

    UserRole.FINANCE: [
        Permission.FINANCE_VIEW_PENDING,
        Permission.FINANCE_SEARCH_STUDENTS,
        Permission.FINANCE_VIEW_CLEARANCE,
        Permission.FINANCE_APPROVE,
        Permission.FINANCE_REJECT,
        Permission.FINANCE_ADD_COMMENTS,
        Permission.FINANCE_VIEW_REPORTS,
    ],

    UserRole.EXAMINATION_OFFICE: [
        Permission.EXAM_VIEW_PENDING,
        Permission.EXAM_VERIFY_ACADEMIC,
        Permission.EXAM_APPROVE,
        Permission.EXAM_REJECT,
        Permission.EXAM_ADD_REMARKS,
        Permission.EXAM_VIEW_REPORTS,
    ],

    UserRole.REGISTRY_OFFICER: [
        Permission.REGISTRY_VIEW_CLEARED,
        Permission.REGISTRY_SEARCH_INVENTORY,
        Permission.REGISTRY_VIEW_INVENTORY,
        Permission.REGISTRY_MARK_AVAILABLE,
        Permission.REGISTRY_SCHEDULE_APPOINTMENT,
        Permission.REGISTRY_VERIFY_IDENTITY,
        Permission.REGISTRY_RECORD_COLLECTION,
        Permission.REGISTRY_VIEW_REPORTS,
        Permission.REGISTRY_MANAGE_REPLACEMENT,
        Permission.REGISTRY_ADD_INVENTORY,
        Permission.REGISTRY_UPDATE_INVENTORY,
        Permission.REGISTRY_DELETE_INVENTORY,
        Permission.STORAGE_VIEW,
        Permission.STORAGE_ASSIGN,
    ],

    UserRole.INTERNAL_AUDITOR: [
        Permission.AUDITOR_VIEW_LOGS,
        Permission.AUDITOR_VIEW_ACTIVITY,
        Permission.AUDITOR_VIEW_LOGIN_HISTORY,
        Permission.AUDITOR_VIEW_CLEARANCE_HISTORY,
        Permission.AUDITOR_VIEW_COLLECTION_HISTORY,
        Permission.AUDITOR_GENERATE_REPORTS,
        Permission.AUDITOR_EXPORT_REPORTS,
    ],

    UserRole.SUPER_ADMIN: [
        # Admin gets ALL permissions
        *[p for p in Permission],
    ],
}

# ============= PERMISSION CHECK FUNCTIONS =============

def has_permission(user: User, permission: Permission) -> bool:
    """Check if a user has a specific permission"""
    if not user or not user.is_active:
        return False

    if user.role == UserRole.SUPER_ADMIN:
        return True

    user_permissions = ROLE_PERMISSIONS.get(user.role, [])
    return permission in user_permissions

def has_any_permission(user: User, permissions: List[Permission]) -> bool:
    """Check if a user has any of the specified permissions"""
    return any(has_permission(user, p) for p in permissions)

def has_all_permissions(user: User, permissions: List[Permission]) -> bool:
    """Check if a user has all of the specified permissions"""
    return all(has_permission(user, p) for p in permissions)

# ============= FASTAPI DEPENDENCIES =============

def require_permission(permission: Permission):
    """Dependency to require a specific permission"""
    def permission_checker(
        current_user: User = Depends(get_current_active_user)
    ):
        if not has_permission(current_user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied. Required permission: {permission.value}"
            )
        return current_user
    return permission_checker

def require_any_permission(permissions: List[Permission]):
    """Dependency to require any of the specified permissions"""
    def permission_checker(
        current_user: User = Depends(get_current_active_user)
    ):
        if not has_any_permission(current_user, permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied. Required one of: {[p.value for p in permissions]}"
            )
        return current_user
    return permission_checker

def require_role(roles: List[UserRole]):
    """Dependency to require a specific role"""
    def role_checker(
        current_user: User = Depends(get_current_active_user)
    ):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied. Required roles: {[r.value for r in roles]}"
            )
        return current_user
    return role_checker

def require_student_ownership(student_id: int):
    """Check if the student is accessing their own record"""
    def ownership_checker(
        db: Session = None,
        current_user: User = Depends(get_current_active_user)
    ):
        from ..models.models import Student

        if current_user.role == UserRole.SUPER_ADMIN:
            return current_user

        if current_user.role != UserRole.STUDENT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied. Only students can access student records."
            )

        # Check if this student belongs to this user
        student = db.query(Student).filter(
            Student.id == student_id,
            Student.user_id == current_user.id
        ).first()

        if not student:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied. You can only access your own records."
            )

        return current_user
    return ownership_checker
