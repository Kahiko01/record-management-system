from fastapi import Request, Depends
from dataclasses import dataclass
import uuid


@dataclass
class RequestContext:
    """Captures request metadata for audit trails"""
    ip_address: str
    user_agent: str
    request_id: str
    method: str
    path: str
    
    def to_audit_kwargs(self) -> dict:
        """Convert to kwargs for log_audit()"""
        return {
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
        }


async def get_request_context(request: Request) -> RequestContext:
    """
    FastAPI dependency that extracts request context.
    
    Usage in routes:
        @router.post("/action")
        async def action(
            ctx: RequestContext = Depends(get_request_context),
            ...
        ):
            await log_audit(..., **ctx.to_audit_kwargs())
    """
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    request_id = str(uuid.uuid4())
    
    # Store request_id in state so middleware can use it
    request.state.request_id = request_id
    
    return RequestContext(
        ip_address=client_ip,
        user_agent=user_agent,
        request_id=request_id,
        method=request.method,
        path=request.url.path
    )
