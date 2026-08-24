import uuid
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from collections import defaultdict
import time
from ..core.database import get_db
from ..models.models import User, UserSession, Task, UserTask
from ..schemas.schemas import UserCreate, UserResponse, Token
from ..auth.auth import (
    authenticate_user, create_access_token, get_password_hash,
    get_current_active_user, role_required, verify_password,
    SECRET_KEY, ALGORITHM, oauth2_scheme
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

#@router.post("/register", response_model=UserResponse)
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
        active_role_id=user_data.active_role_id
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

    # 1. Authenticate user
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        _login_attempts[client_ip].append(time.time())
        await log_audit(
            db, None, "LOGIN_FAILED", "auth",
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
        raise HTTPException(status_code=403, detail="User account is locked or inactive")

    # 🚫 BLOCK STUDENT LOGINS
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

    # 2. Enforce Concurrent Session Limit (Max 3 active sessions)
    MAX_SESSIONS = 3
    active_sessions = db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.is_active == True
    ).order_by(UserSession.created_at.asc()).all()
    
    if len(active_sessions) >= MAX_SESSIONS:
        # Revoke the oldest session to make room for the new one
        oldest_session = active_sessions[0]
        oldest_session.is_active = False
        oldest_session.revoked_at = datetime.utcnow()
        db.commit()
        await log_audit(
            db, user.id, "SESSION_REVOKED", "auth",
            details=f"Oldest session revoked for user {user.username} due to concurrent session limit",
            metadata={
                "username": user.username,
                "session_id": oldest_session.jti,
                "reason": "MAX_SESSIONS_EXCEEDED",
                "max_sessions": MAX_SESSIONS
            },
            subject_username=user.username,
            ip_address=client_ip,
            user_agent=user_agent,
            severity="info",
            request_id=ctx.request_id
        )

    # 3. Create new session record
    expire_delta = timedelta(minutes=30)  # Match ACCESS_TOKEN_EXPIRE_MINUTES
    new_jti = str(uuid.uuid4())
    
    new_session = UserSession(
        user_id=user.id,
        jti=new_jti,
        device_info=user_agent,
        ip_address=client_ip,
        is_active=True,
        expires_at=datetime.utcnow() + expire_delta
    )
    db.add(new_session)
    db.commit()

    # 4. Get active role name
    active_role_name = None
    if user.active_role:
        active_role_name = user.active_role.name
    elif user.roles:
        active_role_name = user.roles[0].name
    
    if not active_role_name:
        active_role_name = "super_admin"

    # 5. Fetch user's granted tasks
    user_tasks = db.query(UserTask).filter(
        UserTask.user_id == user.id,
        UserTask.is_enabled == True
    ).all()
    granted_task_codes = []
    for ut in user_tasks:
        task = db.query(Task).filter(Task.id == ut.task_id).first()
        if task:
            granted_task_codes.append(task.code)

    # 6. Create the JWT Token with the new jti
    access_token = create_access_token(
        data={"sub": user.username, "role": active_role_name, "jti": new_jti},
        expires_delta=expire_delta
    )

    # 7. Clear failed attempts on successful login
    _login_attempts.pop(client_ip, None)

    # 8. Audit the successful login
    await log_audit(
        db, user.id, "LOGIN_SUCCESS", "auth",
        details=f"User logged in: {user.username}",
        metadata={
            "username": user.username,
            "role": active_role_name,
            "ip_address": client_ip,
            "user_agent": user_agent,
            "tasks_granted": len(granted_task_codes),
            "session_id": new_jti,
            "active_sessions": len(active_sessions) + 1
        },
        subject_username=user.username,
        ip_address=client_ip,
        user_agent=user_agent,
        severity="info",
        request_id=ctx.request_id
    )

    # 9. Return response
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": active_role_name,
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
    ctx: RequestContext = Depends(get_request_context),
    token: str = Depends(oauth2_scheme)  # Extract token to get jti
):
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")

    # 1. Revoke the current session (JWT Blacklisting)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        jti = payload.get("jti")
        if jti:
            session = db.query(UserSession).filter(UserSession.jti == jti).first()
            if session:
                session.is_active = False
                session.revoked_at = datetime.utcnow()
                db.commit()

                await log_audit(
                    db, current_user.id, "SESSION_REVOKED", "auth",
                    details=f"Session revoked for user {current_user.username} via logout",
                    metadata={
                        "username": current_user.username,
                        "session_id": jti,
                        "reason": "USER_LOGOUT"
                    },
                    subject_username=current_user.username,
                    ip_address=client_ip,
                    user_agent=user_agent,
                    severity="info",
                    request_id=ctx.request_id
                )
    except JWTError:
        # Token might be invalid/expired, but we still proceed with logout logging
        await log_audit(
            db, current_user.id, "LOGOUT_INVALID_TOKEN", "auth",
            details=f"Logout attempted with invalid token for user {current_user.username}",
            metadata={
                "username": current_user.username,
                "ip_address": client_ip,
                "user_agent": user_agent,
                "reason": "INVALID_TOKEN"
            },
            subject_username=current_user.username,
            ip_address=client_ip,
            user_agent=user_agent,
            severity="warning",
            request_id=ctx.request_id
        )
        pass

    # 2. Audit the logout
    await log_audit(
        db, current_user.id, "USER_LOGOUT", "auth",
        details=f"User logged out: {current_user.username}",
        metadata={
            "username": current_user.username,
            "ip_address": client_ip,
            "user_agent": user_agent,
            "session_duration_seconds": None  # Could be calculated if login time stored
        },
        subject_username=current_user.username,
        ip_address=client_ip,
        user_agent=user_agent,
        severity="info",
        request_id=ctx.request_id
    )
    return {"message": "Logged out successfully"}
