from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from ..core.database import get_db
from ..models.models import AuditLog, User
from ..auth.auth import get_current_active_user
from ..core.permissions import require_permission, Permission

router = APIRouter(prefix="/audit", tags=["Audit Logs"])


@router.get("/logs")
async def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    action: str = Query(None, description="Filter by action type"),
    module: str = Query(None, description="Filter by module"),
    severity: str = Query(None, description="Filter by severity"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.AUDITOR_VIEW_LOGS))
):
    """
    Query audit logs with filters.
    Requires AUDITOR_VIEW_LOGS permission.
    """
    query = db.query(AuditLog).options(joinedload(AuditLog.user))
    
    if action:
        query = query.filter(AuditLog.action == action)
    if module:
        query = query.filter(AuditLog.module == module)
    if severity:
        query = query.filter(AuditLog.severity == severity)
    
    query = query.order_by(AuditLog.created_at.desc())
    
    logs = query.offset(offset).limit(limit).all()
    
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "user": log.user.username if log.user else "System",
            "action": log.action,
            "module": log.module,
            "details": log.details,
            "metadata": log.metadata_json,
            "severity": log.severity,
            "timestamp": log.created_at.isoformat() if log.created_at else None,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "request_id": log.request_id,
            "prev_hash": log.prev_hash,
            "entry_hash": log.entry_hash
        })
    
    total_count = query.count()
    
    return {
        "items": result,
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "has_more": offset + limit < total_count
    }
