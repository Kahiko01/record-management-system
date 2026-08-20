"""
IP Access Control Management Endpoints
"""
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..core.database import get_db
from ..models.models import IPRule, IPAccessLog, User
from ..core.permissions import require_permission, Permission

router = APIRouter(prefix="/admin/ip-rules", tags=["IP Access Control"])


@router.get("/")
async def list_ip_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ADMIN_CONFIGURE_SYSTEM))
):
    """List all IP rules"""
    rules = db.query(IPRule).order_by(IPRule.created_at.desc()).all()
    return {
        "rules": [
            {
                "id": r.id,
                "ip_address": r.ip_address,
                "rule_type": r.rule_type,
                "description": r.description,
                "is_active": r.is_active,
                "expires_at": r.expires_at.isoformat() if r.expires_at else None,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "created_by": r.created_by_user.username if r.created_by_user else None
            }
            for r in rules
        ]
    }


@router.post("/")
async def create_ip_rule(
    ip_address: str = Query(..., description="IP or CIDR range (e.g., 192.168.1.0/24)"),
    rule_type: str = Query(..., description="whitelist, blacklist, or emergency_lockdown"),
    description: Optional[str] = Query(None),
    expires_in_hours: Optional[int] = Query(None, description="Hours until expiration"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ADMIN_CONFIGURE_SYSTEM))
):
    """Create a new IP rule"""
    import ipaddress
    
    # Validate IP/CIDR
    try:
        if "/" in ip_address:
            ipaddress.ip_network(ip_address, strict=False)
        else:
            ipaddress.ip_address(ip_address)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid IP address or CIDR range")
    
    # Validate rule type
    if rule_type not in ["whitelist", "blacklist", "emergency_lockdown"]:
        raise HTTPException(status_code=400, detail="Invalid rule type")
    
    # For emergency lockdown, deactivate existing ones
    if rule_type == "emergency_lockdown":
        db.query(IPRule).filter(
            IPRule.rule_type == "emergency_lockdown"
        ).update({IPRule.is_active: False})
    
    expires_at = None
    if expires_in_hours:
        expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)
    
    rule = IPRule(
        ip_address=ip_address,
        rule_type=rule_type,
        description=description,
        expires_at=expires_at,
        created_by=current_user.id
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    
    return {"message": "IP rule created", "id": rule.id}


@router.delete("/{rule_id}")
async def delete_ip_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ADMIN_CONFIGURE_SYSTEM))
):
    """Delete an IP rule"""
    rule = db.query(IPRule).filter(IPRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db.delete(rule)
    db.commit()
    return {"message": "IP rule deleted"}


@router.post("/{rule_id}/toggle")
async def toggle_ip_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ADMIN_CONFIGURE_SYSTEM))
):
    """Toggle an IP rule active/inactive"""
    rule = db.query(IPRule).filter(IPRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    rule.is_active = not rule.is_active
    db.commit()
    return {"message": f"Rule {'activated' if rule.is_active else 'deactivated'}"}


@router.get("/logs")
async def get_ip_access_logs(
    limit: int = Query(100, ge=1, le=500),
    action: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ADMIN_VIEW_MONITORING))
):
    """Get IP access logs"""
    query = db.query(IPAccessLog)
    if action:
        query = query.filter(IPAccessLog.action == action)
    
    logs = query.order_by(IPAccessLog.created_at.desc()).limit(limit).all()
    
    return {
        "logs": [
            {
                "id": log.id,
                "ip_address": log.ip_address,
                "action": log.action,
                "path": log.path,
                "user_agent": log.user_agent,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            for log in logs
        ]
    }
