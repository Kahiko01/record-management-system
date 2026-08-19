from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from ..models.models import AuditLog
from datetime import datetime
import logging
import hashlib
import json
from app.core.logging_config import audit_logger, security_logger

logger = logging.getLogger(__name__)

# Metrics registry - will be populated by main.py
_metrics_registry = {}

def register_metrics(metrics_dict: dict):
    """Called by main.py to register Prometheus counters"""
    global _metrics_registry
    _metrics_registry = metrics_dict

async def log_audit(
    db: Session,
    user_id: Optional[int],
    action: str,
    module: str = "system",
    details: str = None,
    metadata: Dict[str, Any] = None,
    previous_status: str = None,
    new_status: str = None,
    ip_address: str = None,
    user_agent: str = None,
    subject_username: str = None,
    severity: str = "info",
    request_id: str = None
):
    """
    Enhanced audit logging with:
    - Structured metadata for machine-readable queries
    - Tamper-evident hash chain
    - Error handling that logs failures instead of silently failing
    """
    try:
        # Get the hash of the previous audit entry (for chain integrity)
        prev_entry = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
        # Use "genesis" if there's no previous entry OR if the previous entry has no hash (legacy)
        prev_hash = prev_entry.entry_hash if (prev_entry and prev_entry.entry_hash) else "genesis"
        
        # Create the audit entry (without entry_hash yet)
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            module=module,
            details=details,
            metadata_json=metadata,
            previous_status=previous_status,
            new_status=new_status,
            ip_address=ip_address,
            user_agent=user_agent,
            subject_username=subject_username,
            severity=severity,
            request_id=request_id,
            prev_hash=prev_hash
        )
        
        # Compute the entry hash (hash of all fields + prev_hash)
        # This creates a tamper-evident chain
        hash_data = {
            "user_id": user_id,
            "action": action,
            "module": module,
            "details": details,
            "metadata": metadata,
            "previous_status": previous_status,
            "new_status": new_status,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "subject_username": subject_username,
            "severity": severity,
            "request_id": request_id,
            "prev_hash": prev_hash
        }
        
        # Create a deterministic JSON string (sorted keys)
        hash_string = json.dumps(hash_data, sort_keys=True, default=str)
        entry_hash = hashlib.sha256(hash_string.encode()).hexdigest()
        
        log_entry.entry_hash = entry_hash
        
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        
        # Emit to structured audit log
        audit_logger.info(
            f"{action} by user_id={user_id}",
            action=action,
            module=module,
            user_id=user_id,
            subject_username=subject_username,
            severity=severity,
            request_id=request_id,
            ip_address=ip_address,
            entry_hash=entry_hash[:16]  # Short hash for logs
        )
        
        # Security events get special treatment
        if severity in ["high", "critical"]:
            security_logger.warning(
                f"SECURITY EVENT: {action}",
                action=action,
                user_id=user_id,
                subject_username=subject_username,
                ip_address=ip_address,
                request_id=request_id
            )
        
        # Increment Prometheus counters based on action
        if action == "LOGIN_FAILED" and "login_failures_total" in _metrics_registry:
            _metrics_registry["login_failures_total"].labels(reason="invalid_credentials").inc()
        elif action == "LOGIN_RATE_LIMITED" and "login_failures_total" in _metrics_registry:
            _metrics_registry["login_failures_total"].labels(reason="rate_limited").inc()
        elif action == "LOGIN_SUCCESS" and "login_success_total" in _metrics_registry:
            _metrics_registry["login_success_total"].inc()
        elif action == "CERTIFICATE_MARKED_READY" and "certificates_issued_total" in _metrics_registry:
            # Get programme from metadata if available
            programme = metadata.get("programme", "unknown") if metadata else "unknown"
            _metrics_registry["certificates_issued_total"].labels(programme=programme).inc()
        elif action == "DEAN_CLEARANCE_UPDATED" and "clearances_approved_total" in _metrics_registry:
            department = "dean"
            _metrics_registry["clearances_approved_total"].labels(department=department).inc()
        elif action == "FINANCE_CLEARANCE_UPDATED" and "clearances_approved_total" in _metrics_registry:
            department = "finance"
            _metrics_registry["clearances_approved_total"].labels(department=department).inc()
        elif action == "EXAM_CLEARANCE_UPDATED" and "clearances_approved_total" in _metrics_registry:
            department = "examination"
            _metrics_registry["clearances_approved_total"].labels(department=department).inc()

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to log audit event: {action} - {str(e)}", exc_info=True)
        # Don't silently fail - raise so the caller knows audit failed
        raise
