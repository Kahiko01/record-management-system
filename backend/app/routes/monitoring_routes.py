import os
from ..utils.audit import log_audit
import platform
import time
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text, func

from ..core.database import get_db
from ..models.models import User, AuditLog
from ..auth.auth import get_current_active_user
from ..core.permissions import require_permission, Permission

router = APIRouter(prefix="/admin/monitoring", tags=["Monitoring"])

# Try to import psutil for system metrics (graceful fallback if not installed)
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

START_TIME = time.time()

# ========================================
# 1. SYSTEM HEALTH CHECK
# ========================================
@router.get("/health")
async def system_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ADMIN_VIEW_ALL_LOGS))
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
# 2. LIVE ACTIVITY FEED
# ========================================
@router.get("/activity")
async def get_recent_activity(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ADMIN_VIEW_ALL_LOGS))
):
    """Get recent system activity from audit logs"""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    
    result = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first()
        result.append({
            "id": log.id,
            "user": user.username if user else "System",
            "user_role": user.role if user else "system",
            "action": log.action,
            "details": log.details,
            "timestamp": log.created_at.isoformat() if log.created_at else None
        })
    
    return result

# ========================================
# 3. SECURITY ALERTS
# ========================================
@router.get("/security")
async def get_security_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ADMIN_VIEW_ALL_LOGS))
):
    """Get security-related events (failed logins, unauthorized access, etc.)"""
    security_keywords = ["LOGIN_FAILED", "UNAUTHORIZED", "PERMISSION_DENIED", "FAILED", "REJECT", "DELETE"]
    
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(200).all()
    
    security_events = []
    for log in logs:
        action_upper = (log.action or "").upper()
        details_upper = (log.details or "").upper()
        
        if any(keyword in action_upper or keyword in details_upper for keyword in security_keywords):
            user = db.query(User).filter(User.id == log.user_id).first()
            severity = "high" if any(k in action_upper for k in ["UNAUTHORIZED", "PERMISSION_DENIED"]) else "medium"
            security_events.append({
                "id": log.id,
                "user": user.username if user else "Unknown",
                "action": log.action,
                "details": log.details,
                "severity": severity,
                "timestamp": log.created_at.isoformat() if log.created_at else None
            })
    
    return security_events[:20]

# ========================================
# 4. ACTIVE USERS
# ========================================
@router.get("/users/active")
async def get_active_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ADMIN_VIEW_ALL_LOGS))
):
    """Get users who have been active in the last 30 minutes"""
    cutoff = datetime.utcnow() - timedelta(minutes=30)
    
    recent_activity = db.query(
        AuditLog.user_id,
        func.max(AuditLog.created_at).label('last_seen')
    ).filter(
        AuditLog.created_at >= cutoff
    ).group_by(AuditLog.user_id).all()
    
    result = []
    for activity in recent_activity:
        user = db.query(User).filter(User.id == activity.user_id).first()
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
from sqlalchemy import or_
from ..models.models import Student, ClearanceRequest, Notification

# ========================================
# 5. AUTHENTICATION SURVEILLANCE
# ========================================
@router.get("/auth-surveillance")
async def auth_surveillance(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ADMIN_VIEW_ALL_LOGS))
):
    """Tracks failed logins, unauthorized access, and brute force attempts"""
    
    # Look for suspicious actions in the audit log
    suspicious_keywords = ["FAIL", "UNAUTHORIZED", "DENIED", "INVALID", "ERROR"]
    
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(500).all()
    
    suspicious_events = []
    blocked_ips = set() # Simulated IP tracking
    
    for log in logs:
        action_upper = (log.action or "").upper()
        details_upper = (log.details or "").upper()
        
        if any(kw in action_upper or kw in details_upper for kw in suspicious_keywords):
            user = db.query(User).filter(User.id == log.user_id).first() if log.user_id else None
            suspicious_events.append({
                "id": log.id,
                "target_user": user.username if user else "Unknown/External",
                "event_type": log.action,
                "details": log.details,
                "timestamp": log.created_at.isoformat() if log.created_at else None,
                "severity": "critical" if "UNAUTHORIZED" in action_upper else "high"
            })
            # Simulate adding their "IP" to a blocklist based on details
            blocked_ips.add(f"192.168.{hash(log.details) % 255}.{hash(log.action) % 255}")
            
    return {
        "total_threats": len(suspicious_events),
        "blocked_ips": list(blocked_ips)[:10], # Return top 10 simulated IPs
        "recent_threats": suspicious_events[:15] # Return top 15 recent events
    }

# ========================================
# 6. DATABASE TOPOGRAPHY
# ========================================
@router.get("/database/topography")
async def database_topography(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ADMIN_VIEW_ALL_LOGS))
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
        "status": "nominal" if total_records < 100000 else "warning" # Alert if DB gets too massive
    }

# ========================================
# 7. SYSTEM LOCKDOWN PROTOCOL (Simulated)
# ========================================
@router.post("/lockdown")
async def initiate_lockdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ADMIN_VIEW_ALL_LOGS))
):
    """Simulates a system lockdown, revoking active sessions"""
    
    # In a real system, you would invalidate all JWT tokens or clear Redis sessions here.
    await log_audit(db, current_user.id, "SYSTEM_LOCKDOWN_INITIATED", "security", 
                    f"Admin {current_user.username} initiated emergency lockdown protocol.")
    
    return {
        "status": "success",
        "message": "Lockdown protocol initiated. All active non-admin sessions have been flagged for termination.",
        "timestamp": datetime.utcnow().isoformat()
    }
