import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
db = SessionLocal()

# Check if admin exists
admin = db.query(User).filter(User.username == "admin").first()

if not admin:
    print("Admin user not found. Creating admin user...")
    new_admin = User(
        username="admin",
        email="admin@knp.ac.ke",
        hashed_password=pwd_context.hash("admin123"),
        role="super admin",
        is_active=True
    )
    db.add(new_admin)
    db.commit()
    print("✅ Admin user created! Username: admin | Password: admin123")
else:
    print("Admin user found. Resetting password...")
    admin.hashed_password = pwd_context.hash("admin123")
    admin.role = "super admin"
    db.commit()
    print("✅ Admin password reset successfully!")

db.close()
