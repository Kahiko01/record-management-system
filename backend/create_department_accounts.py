"""
Create department accounts for all clearance departments
"""
from app.core.database import SessionLocal
from app.models.models import User, UserRole
from app.auth.auth import get_password_hash

# Department accounts to create
DEPARTMENTS = [
    {"username": "finance_officer", "password": "finance123", "full_name": "Finance Officer", "role": UserRole.FINANCE},
    {"username": "exam_officer", "password": "exam123", "full_name": "Examinations Officer", "role": UserRole.EXAMINATION_OFFICE},
    {"username": "registry_officer", "password": "registry123", "full_name": "Registry Officer", "role": UserRole.REGISTRY_OFFICER},
    {"username": "academic_officer", "password": "academic123", "full_name": "Academic Office", "role": UserRole.ACADEMIC_OFFICE},
    {"username": "dean", "password": "dean123", "full_name": "Dean of Students", "role": UserRole.DEAN},
    {"username": "internal_auditor", "password": "auditor123", "full_name": "Internal Auditor", "role": UserRole.INTERNAL_AUDITOR},
]

def create_department_accounts():
    db = SessionLocal()
    
    try:
        # Check if admin exists, create if not
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@school.edu",
                full_name="System Administrator",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.SUPER_ADMIN,
                is_active=True
            )
            db.add(admin)
            db.commit()
            print("✅ Admin user created (admin/admin123)")
        
        # Create department accounts
        print("\n📋 Creating department accounts...")
        
        for dept in DEPARTMENTS:
            existing = db.query(User).filter(User.username == dept["username"]).first()
            if existing:
                print(f"  ⚠️ {dept['username']} already exists")
                continue
            
            user = User(
                username=dept["username"],
                email=f"{dept['username']}@school.edu",
                full_name=dept["full_name"],
                hashed_password=get_password_hash(dept["password"]),
                role=dept["role"],
                is_active=True,
                department=dept["full_name"]
            )
            db.add(user)
            db.commit()
            print(f"  ✅ {dept['username']} created (password: {dept['password']})")
        
        print("\n" + "="*50)
        print("📊 ALL ACCOUNTS:")
        print("="*50)
        print(f"  Super Admin: admin / admin123")
        for dept in DEPARTMENTS:
            print(f"  {dept['full_name']}: {dept['username']} / {dept['password']}")
        print("="*50)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_department_accounts()
