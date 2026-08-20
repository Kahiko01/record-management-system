from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from collections import defaultdict
import time
from ..core.database import get_db
from ..models.models import User, UserRole
from ..schemas.schemas import UserCreate, UserResponse, Token
from ..auth.auth import (
    authenticate_user, create_access_token, get_password_hash,
    get_current_active_user, role_required, verify_password
)
from ..utils.audit import log_audit
from ..core.context import RequestContext, get_request_context

router = APIRouter(prefix="/auth", tags=["Authentication"])

from ..core.permissions import require_permission, Permission

# 🛡️ WEEK 5: Login rate limiting (max 5 attempts per 60 seconds per IP)
_login_attempts = defaultdict(list)

def _rate_limited(ip: str) -> bool:
    now = time.time()
    recent = [t for t in _login_attempts[ip] if now - t < 60]
    _login_attempts[ip] = recent
    return len(recent) >= 5

@router.post("/register", response_model=UserResponse)
async def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ADMIN_MANAGE_USERS))
):
    # Check if user exists
    db_user = db.query(User).filter(User.username == user_data.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    db_email = db.query(User).filter(User.email == user_data.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        active_role_id=user_data.active_role_id  # ✅ FIXED: Use active_role_id instead of role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    await log_audit(
        db, current_user.id, "USER_REGISTERED", "auth",
        details=f"Registered user: {user_data.username}",
        metadata={
            "username": user_data.username,
            "email": user_data.email,
            "role": user_data.active_role_id,
            "registered_by": current_user.username
        },
        subject_username=user_data.username,
        severity="info"
    )

    return db_user

@router.post("/login")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")

    # 🛡️ Rate limiting check
    if _rate_limited(client_ip):
        await log_audit(
            db, None, "LOGIN_RATE_LIMITED", "auth",
            details=f"Rate limit triggered for username '{form_data.username}' from IP {client_ip}",
            metadata={
                "username": form_data.username,
                "ip_address": client_ip,
                "attempts_in_window": len(_login_attempts[client_ip]),
                "window_duration": "60s"
            },
            subject_username=form_data.username,
            ip_address=client_ip,
            user_agent=user_agent,
            severity="critical",
            request_id=ctx.request_id
        )
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts. Please wait a minute before trying again."
        )

    # 1. Find the user by username
    user = db.query(User).filter(User.username == form_data.username).first()

    # 2. Verify the password
    if not user or not verify_password(form_data.password, user.hashed_password):
        _login_attempts[client_ip].append(time.time())
        await log_audit(
            db, user.id if user else None, "LOGIN_FAILED", "auth",
            details=f"Failed login attempt for username '{form_data.username}' from IP {client_ip}",
            metadata={
                "username": form_data.username,
                "ip_address": client_ip,
                "user_agent": user_agent,
                "attempt_number": len(_login_attempts[client_ip]),
                "rate_limit_window": "60s"
            },
            subject_username=form_data.username,
            ip_address=client_ip,
            user_agent=user_agent,
            severity="high",
            request_id=ctx.request_id
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Check if user is active
    if not user.is_active:
        await log_audit(
            db, user.id, "LOGIN_INACTIVE_ACCOUNT", "auth",
            details=f"Inactive account login attempt: {user.username}",
            metadata={
                "username": user.username,
                "ip_address": client_ip,
                "user_agent": user_agent,
                "account_status": "inactive"
            },
            subject_username=user.username,
            ip_address=client_ip,
            user_agent=user_agent,
            severity="high",
            request_id=ctx.request_id
        )
        raise HTTPException(status_code=400, detail="Inactive user account")

    # 🚫 BLOCK STUDENT LOGINS (students don't have accounts, but just in case)
    # Check if user has student role
    has_student_role = False
    if user.roles:
        for role in user.roles:
            if role.name == "student":
                has_student_role = True
                break
    elif user.active_role and user.active_role.name == "student":
        has_student_role = True

    if has_student_role:
        await log_audit(
            db, user.id, "LOGIN_BLOCKED", "auth",
            details=f"Student login attempt blocked: {user.username}",
            metadata={
                "username": user.username,
                "role": "student",
                "ip_address": client_ip,
                "user_agent": user_agent,
                "block_reason": "Student accounts do not have system access"
            },
            subject_username=user.username,
            ip_address=client_ip,
            user_agent=user_agent,
            severity="info",
            request_id=ctx.request_id
        )
        raise HTTPException(
            status_code=403,
            detail="Students do not have system access. Please contact the registry office."
        )

    # 4. Create the JWT Token - FIXED
    # Get the active role name (or first role if no active role)
    active_role_name = None
    if user.active_role:
        active_role_name = user.active_role.name
    elif user.roles:
        active_role_name = user.roles[0].name
    
    # Fallback to super_admin if no role found
    if not active_role_name:
        active_role_name = "super_admin"

    # Create token with username and role
    access_token = create_access_token(
        data={"sub": user.username, "role": active_role_name}  # ✅ FIXED
    )

    # 5. Safely get the role name for the frontend
    role_name = active_role_name

    # 6. Fetch user's granted tasks
    from ..models.models import UserTask, Task
    user_tasks = db.query(UserTask).filter(
        UserTask.user_id == user.id,
        UserTask.is_enabled == True
    ).all()
    granted_task_codes = []
    for ut in user_tasks:
        task = db.query(Task).filter(Task.id == ut.task_id).first()
        if task:
            granted_task_codes.append(task.code)

    # 7. Clear failed attempts on successful login
    _login_attempts.pop(client_ip, None)

    # 8. Audit the successful login
    await log_audit(
        db, user.id, "LOGIN_SUCCESS", "auth",
        details=f"User logged in: {user.username}",
        metadata={
            "username": user.username,
            "role": role_name,
            "ip_address": client_ip,
            "user_agent": user_agent,
            "tasks_granted": len(granted_task_codes)
        },
        subject_username=user.username,
        ip_address=client_ip,
        user_agent=user_agent,
        severity="info",
        request_id=ctx.request_id
    )

    # 9. Return a CLEAN dictionary
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": role_name,
            "is_active": user.is_active,
            "granted_tasks": granted_task_codes
        }
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    return current_user

@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    client_ip = request.client.host if request.client else "unknown"
    await log_audit(
        db, current_user.id, "USER_LOGOUT", "auth",
        details=f"User logged out: {current_user.username}",
        metadata={
            "username": current_user.username,
            "ip_address": client_ip,
            "user_agent": request.headers.get("user-agent", ""),
            "session_duration_seconds": None  # Could be calculated if login time stored
        },
        subject_username=current_user.username,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent", ""),
        severity="info",
        request_id=ctx.request_id
    )
    return {"message": "Logged out successfully"}
