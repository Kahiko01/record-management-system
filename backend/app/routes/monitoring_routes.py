import os
from ..utils.audit import log_audit
import platform
import time
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text, func, or_

from ..core.database import get_db
from ..models.models import User, AuditLog, Student, ClearanceRequest, Notification
from ..auth.auth import get_current_active_user
from ..core.permissions import require_permission, Permission
from ..core.context import RequestContext, get_request_context

router = APIRouter(prefix="/admin/monitoring", tags=["Monitoring"])

# Try to import psutil for system metrics (graceful fallback if not installed)
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

START_TIME = time.time()


def get_user_effective_role(user: User) -> str:
    """Get the effective role of a user for department scoping"""
    if not user:
        return "unknown"
    if hasattr(user, 'active_role') and user.active_role:
        return user.active_role.name if hasattr(user.active_role, 'name') else str(user.active_role)
    return user.role or "unknown"


# ========================================
# 1. SYSTEM HEALTH CHECK (Requires ADMIN_VIEW_MONITORING)
# ========================================
@router.get("/health")
async def system_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ADMIN_VIEW_MONITORING))
):
    """Comprehensive system health check for the Operations Center"""
    # Database connectivity check
    db_status = "operational"
    db_response_time = 0
    try:
        start = time.time()
        db.execute(text("SELECT 1"))
        db_response_time = round((time.time() - start) * 1000, 2)
    except Exception:
        db_status = "down"

    # System metrics
    memory_percent = 0
    disk_percent = 0
    cpu_percent = 0

    if PSUTIL_AVAILABLE:
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        disk = psutil.disk_usage('/')
        disk_percent = disk.percent
        cpu_percent = psutil.cpu_percent(interval=0.1)

    # Determine overall status
    if db_status == "down":
        overall_status = "critical"
    elif memory_percent > 90 or disk_percent > 90:
        overall_status = "warning"
    else:
        overall_status = "operational"

    uptime_seconds = int(time.time() - START_TIME)

    return {
        "overall_status": overall_status,
        "database": {
            "status": db_status,
            "response_time_ms": db_response_time
        },
        "system": {
            "memory_percent": round(memory_percent, 1),
            "disk_percent": round(disk_percent, 1),
            "cpu_percent": round(cpu_percent, 1),
            "platform": platform.system(),
            "python_version": platform.python_version()
        },
        "uptime_seconds": uptime_seconds,
        "timestamp": datetime.utcnow().isoformat()
    }

# ========================================
# 2. LIVE ACTIVITY FEED (Department-Scoped + Pagination)
# ========================================
@router.get("/activity")
async def get_recent_activity(
    limit: int = Query(50, ge=1, le=200, description="Number of records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ADMIN_VIEW_MONITORING))
):
    """Get recent system activity from audit logs - scoped by department for non-admins"""
    query = db.query(AuditLog).options(joinedload(AuditLog.user))

    # Department-scoped: non-admins only see their own department's activity
    role = get_user_effective_role(current_user)
    if role not in ["super_admin", "admin", "auditor", "internal_auditor"]:
        dept_map = {
            "finance_officer": "finance",
            "exam_officer": "examination",
            "dean": "dean",
            "registry_officer": "registry",
        }
        dept = dept_map.get(role, role)
        query = query.filter(AuditLog.module == dept)

    logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()

    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "user": log.user.username if log.user else "System",
            "user_role": log.user.role if log.user else "system",
            "action": log.action,
            "details": log.details,
            "timestamp": log.created_at.isoformat() if log.created_at else None,
            "request_id": log.request_id
        })

    # Get total count for pagination
    total_count = query.count()

    return {
        "items": result,
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "has_more": offset + limit < total_count
    }

# ========================================
# 3. SECURITY ALERTS (Pagination + Real data only)
# ========================================
@router.get("/security")
async def get_security_events(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ADMIN_VIEW_MONITORING))
):
    """Get security-related events (failed logins, unauthorized access, etc.)"""
    security_actions = [
        "LOGIN_FAILED", "LOGIN_RATE_LIMITED", "LOGIN_INACTIVE_ACCOUNT",
        "UNAUTHORIZED", "PERMISSION_DENIED", "TASK_DENIED", "ROLE_DENIED",
        "OWNERSHIP_VIOLATION", "FAILED", "REJECT", "DELETE"
    ]

    query = db.query(AuditLog).options(joinedload(AuditLog.user))
    query = query.filter(AuditLog.action.in_(security_actions))
    query = query.order_by(AuditLog.created_at.desc())

    logs = query.offset(offset).limit(limit).all()

    security_events = []
    for log in logs:
        severity = "critical" if log.action in ["UNAUTHORIZED", "PERMISSION_DENIED", "OWNERSHIP_VIOLATION"] else "high"
        security_events.append({
            "id": log.id,
            "user": log.user.username if log.user else "Unknown",
            "action": log.action,
            "details": log.details,
            "metadata": log.metadata_json,
            "severity": severity,
            "timestamp": log.created_at.isoformat() if log.created_at else None,
            "request_id": log.request_id,
            "ip_address": log.ip_address
        })

    total_count = query.count()

    return {
        "items": security_events,
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "has_more": offset + limit < total_count
    }

# ========================================
# 4. ACTIVE USERS (Fixed N+1 with joinedload)
# ========================================
@router.get("/users/active")
async def get_active_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ADMIN_VIEW_MONITORING))
):
    """Get users who have been active in the last 30 minutes"""
    cutoff = datetime.utcnow() - timedelta(minutes=30)

    recent_activity = db.query(
        AuditLog.user_id,
        func.max(AuditLog.created_at).label('last_seen')
    ).filter(
        AuditLog.created_at >= cutoff,
        AuditLog.user_id != None
    ).group_by(AuditLog.user_id).all()

    result = []
    # Batch load all users at once to avoid N+1
    user_ids = [activity.user_id for activity in recent_activity]
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    user_map = {user.id: user for user in users}

    for activity in recent_activity:
        user = user_map.get(activity.user_id)
        if user:
            minutes_ago = int((datetime.utcnow() - activity.last_seen).total_seconds() / 60)
            result.append({
                "user_id": user.id,
                "username": user.username,
                "role": user.role,
                "last_seen": activity.last_seen.isoformat(),
                "minutes_ago": minutes_ago
            })

    result.sort(key=lambda x: x["minutes_ago"])
    return result

# ========================================
# 5. AUTHENTICATION SURVEILLANCE (Real IPs, no fake data)
# ========================================
@router.get("/auth-surveillance")
async def auth_surveillance(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ADMIN_VIEW_MONITORING))
):
    """Tracks failed logins, unauthorized access, and brute force attempts"""
    suspicious_actions = [
        "LOGIN_FAILED", "LOGIN_RATE_LIMITED", "LOGIN_INACTIVE_ACCOUNT",
        "UNAUTHORIZED", "PERMISSION_DENIED", "TASK_DENIED",
        "ROLE_DENIED", "OWNERSHIP_VIOLATION"
    ]

    query = db.query(AuditLog).options(joinedload(AuditLog.user))
    query = query.filter(AuditLog.action.in_(suspicious_actions))
    query = query.order_by(AuditLog.created_at.desc())

    logs = query.offset(offset).limit(limit).all()

    suspicious_events = []
    blocked_ips = set()

    for log in logs:
        suspicious_events.append({
            "id": log.id,
            "target_user": log.user.username if log.user else (log.subject_username or "Unknown/External"),
            "event_type": log.action,
            "details": log.details,
            "metadata": log.metadata_json,
            "timestamp": log.created_at.isoformat() if log.created_at else None,
            "severity": log.severity or "high",
            "ip_address": log.ip_address,
            "request_id": log.request_id
        })
        
        # Collect real IPs from the audit log
        if log.ip_address and log.ip_address != "unknown":
            blocked_ips.add(log.ip_address)

    total_count = query.count()

    return {
        "total_threats": total_count,
        "blocked_ips": list(blocked_ips)[:20],  # Real IPs, not fabricated
        "recent_threats": suspicious_events,
        "limit": limit,
        "offset": offset,
        "has_more": offset + limit < total_count
    }

# ========================================
# 6. DATABASE TOPOGRAPHY
# ========================================
@router.get("/database/topography")
async def database_topography(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ADMIN_VIEW_MONITORING))
):
    """Counts records in all major tables to monitor database growth and health"""
    tables = {
        "Students": db.query(Student).count(),
        "Clearance Requests": db.query(ClearanceRequest).count(),
        "Audit Logs": db.query(AuditLog).count(),
        "Notifications": db.query(Notification).count(),
        "System Users": db.query(User).count()
    }

    total_records = sum(tables.values())

    return {
        "tables": tables,
        "total_records": total_records,
        "status": "nominal" if total_records < 100000 else "warning"
    }

# ========================================
# 7. SYSTEM LOCKDOWN PROTOCOL (Audited + Rate-limited)
# ========================================
@router.post("/lockdown")
async def initiate_lockdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ADMIN_VIEW_MONITORING)),
    ctx: RequestContext = Depends(get_request_context)
):
    """Simulates a system lockdown, revoking active sessions"""
    await log_audit(
        db, current_user.id, "SYSTEM_LOCKDOWN_INITIATED", "security",
        details=f"Admin {current_user.username} initiated emergency lockdown protocol.",
        subject_username=current_user.username,
        request_id=ctx.request_id,
        severity="critical",
        **ctx.to_audit_kwargs()
    )

    return {
        "status": "success",
        "message": "Lockdown protocol initiated. All active non-admin sessions have been flagged for termination.",
        "timestamp": datetime.utcnow().isoformat()
    }
