"""
Production Seed Script (Self-Contained)
Creates a clean database with only essential admin accounts.
"""
from app.core.database import SessionLocal, engine, Base
from app.models.models import User, UserRole
from passlib.context import CryptContext
from datetime import datetime

# Password hashing - self contained
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

# Create all tables fresh
Base.metadata.create_all(bind=engine)

db = SessionLocal()

print("\n🌱 Seeding production database...\n")

# Create essential admin accounts
admins = [
    {
        "username": "admin",
        "email": "admin@university.edu",
        "password": "admin123",
        "role": UserRole.SUPER_ADMIN,
        "full_name": "System Administrator"
    },
    {
        "username": "finance_officer",
        "email": "finance@university.edu", 
        "password": "finance123",
        "role": UserRole.FINANCE,
        "full_name": "Finance Officer"
    },
    {
        "username": "exam_officer",
        "email": "exams@university.edu",
        "password": "exam123",
        "role": UserRole.EXAMINATION_OFFICE,
        "full_name": "Examination Officer"
    },
    {
        "username": "dean",
        "email": "dean@university.edu",
        "password": "dean123",
        "role": UserRole.DEAN,
        "full_name": "Dean of Students"
    },
    {
        "username": "registry_officer",
        "email": "registry@university.edu",
        "password": "registry123",
        "role": UserRole.REGISTRY_OFFICER,
        "full_name": "Registry Officer"
    },
    {
        "username": "auditor",
        "email": "auditor@university.edu",
        "password": "audit123",
        "role": UserRole.INTERNAL_AUDITOR,
        "full_name": "Internal Auditor"
    }
]

created_count = 0
for admin_data in admins:
    existing = db.query(User).filter(User.username == admin_data["username"]).first()
    if not existing:
        new_user = User(
            username=admin_data["username"],
            email=admin_data["email"],
            hashed_password=get_password_hash(admin_data["password"]),
            role=admin_data["role"],
            full_name=admin_data["full_name"],
            is_active=True
        )
        db.add(new_user)
        created_count += 1
        print(f"✅ Created: {admin_data['username']} ({admin_data['role'].value})")
    else:
        print(f"ℹ️  Already exists: {admin_data['username']}")

db.commit()
db.close()

print(f"\n🎉 Production database seeded successfully!")
print(f"   Total users created: {created_count}")
print(f"   Total students: 0")
print(f"   Ready for real data import!\n")
