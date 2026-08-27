from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routes import student_records_routes
from .routes import id_routes
from .routes import student_records_routes
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import os
from .routes import ip_routes
import uuid
import time
import logging
from dotenv import load_dotenv

# Prometheus imports
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_fastapi_instrumentator.metrics import Info
from prometheus_client import Counter

# Use relative imports (with .) for modules within the app
from .core.database import engine, get_db, Base
from .core.websocket_manager import manager
from .models import models
from .routes import (
    auth_routes,
    student_routes,
    clearance_routes,
    certificate_routes,
    monitoring_routes,
    storage_routes,
    student_import_routes,
    user_routes,
    audit_routes,
    report_routes
)
from .auth.auth import get_current_active_user
from .models.models import User, UserRole
from .auth.auth import get_password_hash
from .core.initialize import initialize_system
from .utils.audit import log_audit
from .core.logging_config import setup_logging, audit_logger
#from .core.ip_middleware import IPAccessMiddleware  # <-- ADDED IMPORT

load_dotenv()

# Setup logging
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(


    title="School Record Management System",
    description="Complete university record management with clearance workflow",
    version="1.0.0"
)

# ==================== IP ACCESS CONTROL MIDDLEWARE ====================
# MUST be added BEFORE CORS to ensure IP checks happen first
# Middleware runs in reverse order, so adding it first means it runs last
# We'll add it last to ensure it runs first on requests
if os.getenv("CORS_ORIGINS"):
    cors_origins.extend([o.strip() for o in os.getenv("CORS_ORIGINS").split(",")])


# ==================== IP ACCESS CONTROL MIDDLEWARE ====================
# ADDED LAST - This ensures it runs FIRST on incoming requests
# (FastAPI middleware runs in reverse order of addition)
MAX_PAYLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

@app.middleware("http")
async def limit_payload_size(request: Request, call_next):
    length = request.headers.get("content-length")
    if length is not None:
        try:
            if int(length) > MAX_PAYLOAD_BYTES:
                return JSONResponse(
                    status_code=413,
                    content={"detail": "Payload too large. Maximum size is 10MB."}
                )
        except ValueError:
            pass
    return await call_next(request)

# ============================================
# REQUEST LOGGING MIDDLEWARE (FOR TRACING)
# ============================================
@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Generate request ID if not already set
    if not hasattr(request.state, "request_id"):
        request.state.request_id = str(uuid.uuid4())

    request_id = request.state.request_id
    start_time = time.time()

    # Log request start
    logger.info(f"[{request_id}] {request.method} {request.url.path} started")

    # Process request
    response = await call_next(request)

    # Calculate duration
    duration_ms = (time.time() - start_time) * 1000

    # Log request completion
    logger.info(
        f"[{request_id}] {request.method} {request.url.path} "
        f"completed with status {response.status_code} in {duration_ms:.2f}ms"
    )

    # Add request ID to response headers (useful for debugging)
    response.headers["X-Request-ID"] = request_id

    return response

# ============================================
# PROMETHEUS METRICS SETUP
# ============================================

# Custom business metric: clearance approvals
CLEARANCE_APPROVALS = Counter(
    "clearances_approved_total",
    "Total number of clearances approved",
    ["department"]
)

# Custom business metric: login failures
LOGIN_FAILURES = Counter(
    "login_failures_total",
    "Total number of failed login attempts",
    ["reason"]
)

# Custom business metric: certificates issued
CERTIFICATES_ISSUED = Counter(
    "certificates_issued_total",
    "Total number of certificates issued",
    ["programme"]
)

# Initialize Prometheus instrumentator (adds /metrics endpoint)
instrumentator = Instrumentator(
    should_group_status_codes=True,
    should_ignore_untemplated=True,
    should_respect_env_var=False,
    excluded_handlers=["/metrics", "/health"],
    env_var_name="ENABLE_METRICS",
)
# Register metrics with audit utility
from app.utils.audit import register_metrics
register_metrics({
    "login_failures_total": LOGIN_FAILURES,
    "clearances_approved_total": CLEARANCE_APPROVALS,
    "certificates_issued_total": CERTIFICATES_ISSUED,
})

# Instrument the app (tracks request count, latency, in-flight requests)
instrumentator.instrument(app).expose(
    app,
    endpoint="/metrics",
    include_in_schema=True,
    should_gzip=True
)

# Mount static files
os.makedirs("uploads", exist_ok=True)
os.makedirs("static", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(storage_routes.router)
app.include_router(student_import_routes.router)
app.include_router(id_routes.router)
app.include_router(auth_routes.router)
app.include_router(monitoring_routes.router)
app.include_router(student_routes.router)
app.include_router(student_records_routes.router)
app.include_router(clearance_routes.router)
app.include_router(certificate_routes.router)
app.include_router(user_routes.router)
app.include_router(audit_routes.router)
app.include_router(ip_routes.router)
app.include_router(student_records_routes.router)
app.include_router(report_routes.router)  # <-- ADDED

# ============================================
# DIRECT ENDPOINT FOR REGISTRY MARK READY
# ============================================
@app.put("/clearance/registry/mark-ready/{certificate_id}")
async def mark_certificate_ready(
    certificate_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark a certificate as ready for collection"""
    from .models.models import RegistryInventory

    certificate = db.query(RegistryInventory).filter(
        RegistryInventory.id == certificate_id
    ).first()

    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    previous_status = certificate.status
    certificate.status = "ready_for_collection"
    db.commit()

    await log_audit(
        db, current_user.id, "CERTIFICATE_MARKED_READY", "registry",
        details=f"Certificate {certificate_id} marked ready for collection",
        previous_status=previous_status,
        new_status="ready_for_collection",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        severity="info",
        request_id=getattr(request.state, "request_id", None)
    )

    return {"message": "Certificate marked as ready"}

# ============================================
# OTHER ENDPOINTS
# ============================================

@app.get("/")
async def root():
    return {
        "message": "School Record Management System API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# ============================================
# SECURE WEBSOCKET ENDPOINT
# ============================================
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    """Secure WebSocket endpoint with JWT authentication"""
    from app.core.websocket_manager import manager, verify_websocket_token
    from app.models.models import User
    from app.core.database import SessionLocal

    print(f"🔌 New WebSocket connection attempt")

    if not token:
        print("❌ No token provided")
        await websocket.close(code=1008, reason="Authentication required")
        return

    payload = verify_websocket_token(token)
    if not payload:
        print("❌ Invalid token")
        await websocket.close(code=1008, reason="Invalid token")
        return

    username = payload.get("sub")
    if not username:
        print("❌ No username in token")
        await websocket.close(code=1008, reason="Invalid token payload")
        return

    print(f"✅ Token valid for user: {username}")

    # Get user from database with proper session management
    db = None
    user = None
    try:
        db = SessionLocal()
        user = db.query(User).filter(User.username == username).first()

        if not user:
            print(f"❌ User not found: {username}")
            await websocket.close(code=1008, reason="User not found")
            return

        if not user.is_active:
            print(f"❌ User inactive: {username}")
            await websocket.close(code=1008, reason="User account is inactive")
            return

        print(f"✅ User found: {user.username} (ID: {user.id})")

        role = "student"
        if hasattr(user, 'active_role') and user.active_role:
            role = user.active_role.name
        elif user.role:
            role = str(user.role)

        print(f"✅ User role: {role}")

        # Store user info before closing DB session
        user_id = user.id
        user_username = user.username
        user_role = role

    except Exception as e:
        print(f"❌ Database error: {e}")
        await websocket.close(code=1011, reason="Database error")
        return
    finally:
        # Close database session IMMEDIATELY after getting user info
        if db:
            db.close()
            print("✅ Database session closed")

    # Now handle WebSocket connection (no DB session needed)
    try:
        await manager.connect(websocket, user_id, user_role, user_username)
        print(f"✅ User connected to WebSocket manager")

        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "data": {
                "user_id": user_id,
                "username": user_username,
                "role": user_role,
                "message": "Connected to real-time updates"
            }
        })
        print(f"✅ Welcome message sent")

        print(f"🔄 Waiting for messages from client...")
        while True:
            data = await websocket.receive_text()
            print(f"📨 Received message: {data}")

    except WebSocketDisconnect:
        print(f"👋 Client disconnected: {user_username}")
        manager.disconnect(user_id)
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        manager.disconnect(user_id)

@app.post("/seed-admin")
async def seed_admin_user(db: Session = Depends(get_db)):
    """Create default admin user if none exists (development only)"""
    import os
    if os.getenv("ENVIRONMENT", "development") != "development":
        raise HTTPException(status_code=403, detail="Seeding is disabled in production.")

    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin_user = User(
            username="admin",
            email="admin@school.edu",
            full_name="System Administrator",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.SUPER_ADMIN,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        return {"message": "Admin user created. Username: admin, Password: admin123"}
    return {"message": "Admin user already exists"}

import random
from .models.models import Student, ClearanceRequest, FinanceClearance, ExaminationClearance, RegistryInventory, ClearanceStatus, CertificateStatus

@app.post("/seed-dashboard-data")
async def seed_dashboard_data(db: Session = Depends(get_db)):
    """Seed the database with dummy data to populate dashboards"""

    # 1. Create 20 Dummy Students & Clearance Requests
    programs = ["Computer Science", "Business Admin", "Engineering", "Nursing", "Law"]
    for i in range(1, 21):
        student_id = f"SEED-2024-{i:03d}"
        
        # Check if student already exists by student_id
        existing_student = db.query(Student).filter(Student.student_id == student_id).first()
        if not existing_student:
            # NO USER ACCOUNT CREATED. We link to Admin (ID 1) as the managing staff, or None.
            student = Student(
                student_id=student_id,
                user_id=1,  # Linked to Admin as the managing staff member
                first_name=f"SeedFirst{i}",
                last_name=f"SeedLast{i}",
                email=f"seed{i}@school.edu",  # Just for contact data, not a login
                program=random.choice(programs),
                year_of_study=random.randint(1, 4)
            )
            db.add(student)
            db.commit()
            db.refresh(student)

            # Create Clearance Request (Staff initiates this on behalf of the student)
            req = ClearanceRequest(
                student_id=student.id,
                student_user_id=1,  # Initiated by Admin/Staff
                overall_status="pending",
                initiated_by=1
            )
            db.add(req)
            db.commit()
            db.refresh(req)

            # Create Finance & Exam records
            f_status = random.choice([ClearanceStatus.PENDING, ClearanceStatus.CLEARED, ClearanceStatus.NOT_CLEARED])
            e_status = random.choice([ClearanceStatus.PENDING, ClearanceStatus.CLEARED, ClearanceStatus.NOT_CLEARED])

            db.add(FinanceClearance(
                clearance_request_id=req.id,
                status=f_status,
                amount_due=5000,
                amount_paid=random.randint(0, 5000)
            ))
            db.add(ExaminationClearance(
                clearance_request_id=req.id,
                status=e_status
            ))
            db.commit()

    # 2. Create 10 Dummy Certificates
    students = db.query(Student).filter(Student.student_id.like("SEED-%")).limit(10).all()
    for idx, student in enumerate(students):
        cert_num = f"CERT-SEED-{idx+1:03d}"
        if not db.query(RegistryInventory).filter(RegistryInventory.certificate_number == cert_num).first():
            c_status = random.choice([
                CertificateStatus.AWAITING_CLEARANCE,
                CertificateStatus.READY_FOR_COLLECTION,
                CertificateStatus.COLLECTED
            ])
            cert = RegistryInventory(
                certificate_number=cert_num,
                student_id=student.id,
                programme=student.program,
                graduation_year="2024",
                status=c_status,
                storage_location="Seed Cabinet A"
            )
            db.add(cert)
    db.commit()

    return {"message": "Successfully seeded 20 students, clearances, and 10 certificates! Refresh your dashboard."}


@app.post("/seed-task-templates")
async def seed_task_templates(db: Session = Depends(get_db)):
    """Seed default clearance task templates (Run this once via Postman or curl)"""
    from app.models.models import ClearanceTaskTemplate

    templates_data = [
        {"name": "Library Clearance", "department": "library", "order_index": 1, "due_days": 2, "description": "Return all library books and settle fines"},
        {"name": "Finance Clearance", "department": "finance", "order_index": 2, "due_days": 3, "description": "Settle all tuition and institutional fees"},
        {"name": "Examination Clearance", "department": "examination", "order_index": 3, "due_days": 2, "description": "Verify all grades are released and no missing marks"},
        {"name": "Dean Clearance", "department": "dean", "order_index": 4, "due_days": 1, "description": "Final departmental approval and sign-off"},
    ]

    created_count = 0
    for data in templates_data:
        # Check if it already exists to avoid duplicates on multiple runs
        exists = db.query(ClearanceTaskTemplate).filter(ClearanceTaskTemplate.name == data["name"]).first()
        if not exists:
            new_template = ClearanceTaskTemplate(**data)
            db.add(new_template)
            created_count += 1

    db.commit()
    return {"message": f"Successfully seeded {created_count} task templates!"}

# ============================================
# STARTUP EVENT - Initialize system on first run
# ============================================
@app.on_event("startup")
async def startup_event():
    """Initialize logging and other startup tasks"""
    env = os.getenv("ENVIRONMENT", "development")
    setup_logging(env)
    audit_logger.info("Application started", environment=env)
    initialize_system()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# --- Clean CORS Configuration ---


# --- Clean, Bulletproof CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://0.0.0.0:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
