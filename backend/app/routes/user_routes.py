from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy import or_
from ..core.database import get_db
from ..models.models import User, UserRole, Role, user_roles, Task, UserTask
from ..auth.auth import get_current_active_user
from ..core.permissions import require_permission, Permission
from ..utils.audit import log_audit
from passlib.context import CryptContext

router = APIRouter(prefix="/users", tags=["Users"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ============= SCHEMAS =============

class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: str
    department: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None

class PasswordReset(BaseModel):
    new_password: str

class RoleAssignment(BaseModel):
    role_id: int
    is_department_uploader: bool = False

class UserRolesUpdate(BaseModel):
    roles: List[RoleAssignment]
    active_role_id: Optional[int] = None

class UserTaskUpdate(BaseModel):
    task_id: int
    is_enabled: bool

# ============= ENDPOINTS =============

@router.get("/")
async def get_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USER_VIEW))
):
    query = db.query(User)

    # If search term exists, filter by username OR email OR full_name
    if search:
        query = query.filter(
            or_(
                User.username.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%")
            )
        )
    
    if role:
        query = query.filter(User.role == role)
    if status == "active":
        query = query.filter(User.is_active == True)
    elif status == "inactive":
        query = query.filter(User.is_active == False)

    users = query.order_by(User.created_at.desc()).all()

    result = []
    for user in users:
        result.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
            "department": user.department,
            "is_active": user.is_active,
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "created_at": user.created_at.isoformat() if user.created_at else None
        })
    return result

@router.post("/")
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USER_CREATE))
):
    # Check if username exists
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already exists")

    # Check if email exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")

    # Validate role
    try:
        user_role = UserRole(user_data.role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {user_data.role}")

    # Hash password
    hashed_password = pwd_context.hash(user_data.password)

    # Create user
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        role=user_role,
        department=user_data.department,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    await log_audit(db, current_user.id, "USER_CREATED", "user_management",
                    f"Created user: {user_data.username} with role: {user_data.role}")

    return {
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "role": new_user.role.value if hasattr(new_user.role, 'value') else str(new_user.role),
        "department": new_user.department,
        "is_active": new_user.is_active,
        "message": "User created successfully"
    }

@router.put("/{user_id}")
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USER_UPDATE))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check username uniqueness if being updated
    if user_data.username and user_data.username != user.username:
        existing = db.query(User).filter(User.username == user_data.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists")
        user.username = user_data.username

    # Check email uniqueness if being updated
    if user_data.email and user_data.email != user.email:
        existing = db.query(User).filter(User.email == user_data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")
        user.email = user_data.email

    if user_data.full_name:
        user.full_name = user_data.full_name

    if user_data.role:
        try:
            user.role = UserRole(user_data.role)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid role: {user_data.role}")

    if user_data.department is not None:
        user.department = user_data.department

    db.commit()
    db.refresh(user)

    await log_audit(db, current_user.id, "USER_UPDATED", "user_management",
                    f"Updated user: {user.username}")

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "department": user.department,
        "is_active": user.is_active,
        "message": "User updated successfully"
    }

@router.put("/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USER_DEACTIVATE))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent deactivating yourself
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)

    action = "USER_ACTIVATED" if user.is_active else "USER_DEACTIVATED"
    await log_audit(db, current_user.id, action, "user_management",
                    f"{'Activated' if user.is_active else 'Deactivated'} user: {user.username}")

    return {
        "id": user.id,
        "username": user.username,
        "is_active": user.is_active,
        "message": f"User {'activated' if user.is_active else 'deactivated'} successfully"
    }

@router.put("/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    password_data: PasswordReset,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USER_RESET_PASSWORD))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    hashed_password = pwd_context.hash(password_data.new_password)
    user.hashed_password = hashed_password
    db.commit()

    await log_audit(db, current_user.id, "PASSWORD_RESET", "user_management",
                    f"Reset password for user: {user.username}")

    return {"message": f"Password reset successfully for {user.username}"}

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USER_DELETE))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent deleting yourself
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    username = user.username
    db.delete(user)
    db.commit()

    await log_audit(db, current_user.id, "USER_DELETED", "user_management",
                    f"Deleted user: {username}")

    return {"message": f"User {username} deleted successfully"}

@router.get("/roles")
async def get_available_roles(
    current_user: User = Depends(require_permission(Permission.USER_VIEW))
):
    return [
        {"value": role.value, "label": role.value.replace("_", " ").title()}
        for role in UserRole
    ]

# ==========================================
# PHASE 3: MULTI-ROLE MANAGEMENT ENDPOINTS
# ==========================================

@router.get("/roles/list")
async def get_all_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USER_VIEW))
):
    """Returns all available system roles for the admin UI"""
    roles = db.query(Role).all()
    return roles

@router.put("/{user_id}/roles")
async def update_user_roles(
    user_id: int,
    roles_data: UserRolesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USER_ASSIGN_ROLE))
):
    """Assigns multiple roles to a user and sets their active role"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 1. Clear existing roles from the junction table
    db.execute(user_roles.delete().where(user_roles.c.user_id == user_id))

    # 2. Insert the new roles
    for r in roles_data.roles:
        # Get the role name to determine the uploader_department
        role_obj = db.query(Role).filter(Role.id == r.role_id).first()
        dept = role_obj.department.lower() if role_obj and role_obj.department else None

        db.execute(user_roles.insert().values(
            user_id=user_id,
            role_id=r.role_id,
            is_department_uploader=r.is_department_uploader,
            uploader_department=dept if r.is_department_uploader else None
        ))

    # 3. Set the user's active role
    if roles_data.active_role_id:
        user.active_role_id = roles_data.active_role_id

    db.commit()
    
    await log_audit(db, current_user.id, "USER_ROLES_UPDATED", "user_management",
                    f"Updated roles for user: {user.username}")
    
    return {"message": "Roles updated successfully", "user_id": user_id}

# ==========================================
# GRANULAR TASK MANAGEMENT ENDPOINTS
# ==========================================

@router.get("/tasks/list")
async def get_all_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USER_VIEW))
):
    """Returns all granular tasks for the admin UI"""
    tasks = db.query(Task).all()
    return tasks

@router.get("/{user_id}/tasks")
async def get_user_tasks(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USER_VIEW))
):
    """Returns the specific tasks enabled for a user"""
    user_tasks = db.query(UserTask).filter(UserTask.user_id == user_id).all()
    return user_tasks

@router.put("/{user_id}/tasks")
async def update_user_tasks(
    user_id: int,
    tasks_data: List[UserTaskUpdate],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USER_ASSIGN_ROLE))
):
    """Updates the granular task checkboxes for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Clear existing tasks
    db.query(UserTask).filter(UserTask.user_id == user_id).delete()

    # Add new tasks
    for t in tasks_data:
        db.add(UserTask(
            user_id=user_id,
            task_id=t.task_id,
            is_enabled=t.is_enabled,
            granted_by=current_user.id
        ))

    db.commit()
    
    await log_audit(db, current_user.id, "USER_TASKS_UPDATED", "user_management",
                    f"Updated tasks for user: {user.username}")
    
    return {"message": "Tasks updated successfully"}
