
from .routes import storage_routes

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

from .core.database import engine, get_db, Base
from .models import models
from .routes import auth_routes, student_routes, clearance_routes, certificate_routes, user_routes, student_import_routes
from .auth.auth import get_current_active_user
from .models.models import User, UserRole
from .auth.auth import get_password_hash

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

# Mount static files
os.makedirs("uploads", exist_ok=True)
os.makedirs("static", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers

app.include_router(storage_routes.router)

app.include_router(student_import_routes.router)
app.include_router(auth_routes.router)
app.include_router(student_routes.router)
app.include_router(clearance_routes.router)
app.include_router(certificate_routes.router)
app.include_router(user_routes.router)

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
