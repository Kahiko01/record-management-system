from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from collections import defaultdict
import time
from ..core.database import get_db
from ..models.models import User
from ..schemas.schemas import UserCreate, UserResponse, Token
from ..auth.auth import (
    authenticate_user, create_access_token, get_password_hash,
    get_current_active_user, role_required, verify_password
)
from ..utils.audit import log_audit

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
        role=user_data.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    await log_audit(db, current_user.id, "USER_REGISTERED", f"Registered user: {user_data.username}")

    return db_user

@router.post("/login")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # 🛡️ Rate limiting check
    if _rate_limited(request.client.host):
        raise HTTPException(
            status_code=429, 
            detail="Too many login attempts. Please wait a minute before trying again."
        )

    # 1. Find the user by username
    user = db.query(User).filter(User.username == form_data.username).first()

    # 2. Verify the password
    if not user or not verify_password(form_data.password, user.hashed_password):
        # Record failed attempt
        _login_attempts[request.client.host].append(time.time())
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Check if user is active
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")

    # 4. Create the JWT Token
    access_token = create_access_token(data={"sub": user.username})

    # 5. Safely get the role name for the frontend
    role_name = "student"
    if user.active_role:
        role_name = user.active_role.name
    elif user.role:
        role_name = str(user.role)

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
    _login_attempts.pop(request.client.host, None)

    # 8. Return a CLEAN dictionary
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
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    await log_audit(db, current_user.id, "USER_LOGOUT", f"User logged out: {current_user.username}")
    return {"message": "Logged out successfully"}
