import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.models import User, Role
from app.auth.auth import get_password_hash

db = SessionLocal()

try:
    # 1. Find the super_admin role ID
    # Try 'name' first, fallback to 'role' or 'code' if your schema uses different column names
    super_admin_role = db.query(Role).filter(Role.name == "super_admin").first()
    if not super_admin_role:
        super_admin_role = db.query(Role).filter(Role.role == "super_admin").first()
    
    role_id = super_admin_role.id if super_admin_role else None
    print(f"🔍 Found super_admin role ID: {role_id}")

    # 2. Check if admin exists
    admin = db.query(User).filter(User.username == "admin").first()

    if admin:
        print("🔄 Updating existing 'admin' user...")
        admin.hashed_password = get_password_hash("admin123")
        admin.is_active = True
        admin.full_name = admin.full_name or "System Administrator"
        if role_id:
            admin.active_role_id = role_id
    else:
        print("➕ Creating new 'admin' user...")
        new_admin = User(
            username="admin",
            email="admin@knp.ac.ke",
            full_name="System Administrator",
            hashed_password=get_password_hash("admin123"),
            is_active=True,
            active_role_id=role_id
        )
        db.add(new_admin)

    db.commit()
    print("\n✅ SUCCESS! Admin user is properly configured.")
    print("👤 Username: admin")
    print("🔑 Password: admin123")

except Exception as e:
    print(f"\n❌ ERROR: {e}")
    print("Let's check the Role table schema:")
    import sqlite3
    conn = sqlite3.connect('school_management.db')
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(roles);")
    print(cursor.fetchall())
    conn.close()

finally:
    db.close()
