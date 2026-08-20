"""
IP-based Access Control Middleware
Checks incoming requests against IP whitelist/blacklist rules.
"""
import ipaddress
from datetime import datetime
from typing import List, Optional
from fastapi import Request, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from starlette.middleware.base import BaseHTTPMiddleware

from .database import SessionLocal
from ..models.models import IPRule, IPAccessLog


class IPAccessMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip IP checks for certain paths (health checks, etc.)
        if request.url.path in ["/health", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        # Get client IP
        client_ip = self.get_client_ip(request)
        
        # Check IP rules
        db = SessionLocal()
        try:
            # Check for emergency lockdown first
            lockdown = db.query(IPRule).filter(
                and_(
                    IPRule.rule_type == "emergency_lockdown",
                    IPRule.is_active == True
                )
            ).first()
            
            if lockdown:
                await self.log_ip_attempt(db, client_ip, "lockdown", request)
                await self.audit_lockdown(db, client_ip, request)
                raise HTTPException(
                    status_code=403,
                    detail="System is currently locked down for maintenance"
                )
            
            # Get active IP rules
            now = datetime.utcnow()
            rules = db.query(IPRule).filter(
                and_(
                    IPRule.is_active == True,
                    (IPRule.expires_at == None) | (IPRule.expires_at > now)
                )
            ).all()
            
            # Separate whitelist and blacklist rules
            whitelist_rules = [r for r in rules if r.rule_type == "whitelist"]
            blacklist_rules = [r for r in rules if r.rule_type == "blacklist"]
            
            # If whitelist exists, IP must match at least one
            if whitelist_rules:
                if not self.ip_matches_any_rule(client_ip, whitelist_rules):
                    await self.log_ip_attempt(db, client_ip, "blocked", request, "whitelist_denied")
                    await self.audit_ip_blocked(db, client_ip, request, "Not in whitelist")
                    raise HTTPException(
                        status_code=403,
                        detail="Access denied: Your IP is not authorized"
                    )
            
            # Check blacklist - if IP matches any, block it
            if blacklist_rules:
                matched_rule = self.ip_matches_any_rule(client_ip, blacklist_rules, return_rule=True)
                if matched_rule:
                    await self.log_ip_attempt(db, client_ip, "blocked", request, matched_rule.id)
                    await self.audit_ip_blocked(db, client_ip, request, f"IP blacklisted: {matched_rule.description or 'No description'}")
                    raise HTTPException(
                        status_code=403,
                        detail=f"Access denied: {matched_rule.description or 'Your IP is blocked'}"
                    )
            
            # Log successful access (optional, can be noisy)
            # await self.log_ip_attempt(db, client_ip, "allowed", request)
            
            db.commit()
        except HTTPException:
            raise
        except Exception as e:
            print(f"⚠️ IP middleware error: {e}")
            db.rollback()
        finally:
            db.close()
        
        return await call_next(request)
    
    def get_client_ip(self, request: Request) -> str:
        """Extract client IP from request, handling proxies"""
        # Check for forwarded headers (common with nginx/load balancers)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fall back to direct client IP
        return request.client.host if request.client else "unknown"
    
    def ip_matches_any_rule(self, client_ip: str, rules: List[IPRule], return_rule: bool = False):
        """Check if client IP matches any of the rules (supports CIDR)"""
        try:
            client_addr = ipaddress.ip_address(client_ip)
        except ValueError:
            return None if return_rule else False
        
        for rule in rules:
            try:
                # Try parsing as network (CIDR) first
                if "/" in rule.ip_address:
                    network = ipaddress.ip_network(rule.ip_address, strict=False)
                    if client_addr in network:
                        return rule if return_rule else True
                else:
                    # Exact IP match
                    if client_ip == rule.ip_address:
                        return rule if return_rule else True
            except ValueError:
                continue
        
        return None if return_rule else False
    
    async def log_ip_attempt(self, db: Session, ip: str, action: str, request: Request, rule_id: int = None):
        """Log IP access attempt to database"""
        try:
            log = IPAccessLog(
                ip_address=ip,
                action=action,
                path=str(request.url.path),
                user_agent=request.headers.get("user-agent"),
                rule_id=rule_id
            )
            db.add(log)
            db.commit()
        except Exception as e:
            print(f"Failed to log IP attempt: {e}")
            db.rollback()
    
    async def audit_ip_blocked(self, db: Session, ip: str, request: Request, reason: str):
        """Create audit log entry for blocked IP"""
        try:
            from app.utils.audit import log_audit
            
            await log_audit(
                db=db,
                user_id=None,
                action="IP_ACCESS_BLOCKED",
                module="security",
                details=f"Blocked IP {ip}: {reason}",
                ip_address=ip,
                user_agent=request.headers.get("user-agent"),
                severity="high",
                metadata={
                    "blocked_ip": ip,
                    "path": str(request.url.path),
                    "reason": reason,
                    "method": request.method
                }
            )
        except Exception as e:
            print(f"Failed to audit IP block: {e}")
    
    async def audit_lockdown(self, db: Session, ip: str, request: Request):
        """Create audit log entry for lockdown attempt"""
        try:
            from app.utils.audit import log_audit
            
            await log_audit(
                db=db,
                user_id=None,
                action="SYSTEM_LOCKDOWN_ATTEMPT",
                module="security",
                details=f"IP {ip} attempted access during system lockdown",
                ip_address=ip,
                user_agent=request.headers.get("user-agent"),
                severity="critical",
                metadata={
                    "blocked_ip": ip,
                    "path": str(request.url.path),
                    "lockdown_active": True
                }
            )
        except Exception as e:
            print(f"Failed to audit lockdown: {e}")
