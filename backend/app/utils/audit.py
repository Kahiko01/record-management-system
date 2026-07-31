from sqlalchemy.orm import Session
from ..models.models import AuditLog
from datetime import datetime

async def log_audit(db: Session, user_id: int, action: str, module: str = "system", 
                    details: str = None, previous_status: str = None, 
                    new_status: str = None, ip_address: str = None, user_agent: str = None):
    try:
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            module=module,
            details=details,
            previous_status=previous_status,
            new_status=new_status,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        print(f"Failed to log audit: {e}")
