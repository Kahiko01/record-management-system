from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

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
    user_routes
)
from .auth.auth import get_current_active_user
from .models.models import User, UserRole
from .auth.auth import get_password_hash
from .core.initialize import initialize_system  # <-- IMPORT FROM .core.initialize

load_dotenv()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="School Record Management System",
    description="Complete university record management with clearance workflow",
    version="1.0.0"
)

# CORS setup - supports both localhost and LAN access
cors_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://10.163.2.108:3000",
]

# Also allow any origin from environment variable (comma-separated)
if os.getenv("CORS_ORIGINS"):
    cors_origins.extend([o.strip() for o in os.getenv("CORS_ORIGINS").split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== PAYLOAD SIZE PROTECTION ====================
# Blocks oversized uploads (zip bombs / huge JSON floods) at the door.
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

# Mount static files
os.makedirs("uploads", exist_ok=True)
os.makedirs("static", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(storage_routes.router)
app.include_router(student_import_routes.router)
app.include_router(auth_routes.router)
app.include_router(monitoring_routes.router)
app.include_router(student_routes.router)
app.include_router(clearance_routes.router)
app.include_router(certificate_routes.router)
app.include_router(user_routes.router)

# ============================================
# DIRECT ENDPOINT FOR REGISTRY MARK READY
# ============================================
@app.put("/clearance/registry/mark-ready/{certificate_id}")
async def mark_certificate_ready(
    certificate_id: int,
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

    # Update the status
    certificate.status = "ready_for_collection"
    db.commit()

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
# WEBSOCKET ENDPOINT FOR REAL-TIME UPDATES
# ============================================
@app.websocket("/ws/{role}")
async def websocket_endpoint(websocket: WebSocket, role: str):
    await manager.connect(websocket, role)
    try:
        while True:
            # Keep the connection alive by waiting for messages
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, role)

@app.post("/seed-admin")
async def seed_admin(db: Session = Depends(get_db)):
    """Create default admin user if none exists"""
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
        existing = db.query(User).filter(User.username == student_id).first()
        if not existing:
            user = User(
                username=student_id,
                email=f"seed{i}@school.edu",
                full_name=f"Seed Student {i}",
                hashed_password=get_password_hash("seed123"),
                role=UserRole.STUDENT,
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            student = Student(
                student_id=student_id,
                user_id=user.id,
                first_name=f"SeedFirst{i}",
                last_name=f"SeedLast{i}",
                email=user.email,
                program=random.choice(programs),
                year_of_study=random.randint(1, 4)
            )
            db.add(student)
            db.commit()
            db.refresh(student)

            # Create Clearance Request
            req = ClearanceRequest(
                student_id=student.id,
                student_user_id=user.id,
                overall_status="in_progress"
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

# ============================================
# STARTUP EVENT - Initialize system on first run
# ============================================
@app.on_event("startup")
async def startup_event():
    initialize_system()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
