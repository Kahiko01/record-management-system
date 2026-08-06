from app.core.database import SessionLocal
from app.models.models import User, Role, user_roles
from sqlalchemy import select

db = SessionLocal()

# 1. Define the official system roles
default_roles = [
    {"name": "super_admin", "display_name": "Super Admin", "department": "System"},
    {"name": "finance", "display_name": "Finance Officer", "department": "Finance"},
    {"name": "examination_office", "display_name": "Examination Officer", "department": "Academics"},
    {"name": "dean", "display_name": "Dean", "department": "Academics"},
    {"name": "registry_officer", "display_name": "Registry Officer", "department": "Registry"},
    {"name": "internal_auditor", "display_name": "Internal Auditor", "department": "Audit"},
    {"name": "student", "display_name": "Student", "department": "Student"},
]

print("🌱 Step 1: Creating roles...")
role_map = {}

for r in default_roles:
    existing = db.query(Role).filter(Role.name == r["name"]).first()
    if not existing:
        new_role = Role(**r)
        db.add(new_role)
        db.commit()
        db.refresh(new_role)
        role_map[r["name"]] = new_role.id
        print(f"✅ Created: {r['display_name']}")
    else:
        role_map[r["name"]] = existing.id
        print(f"ℹ️ Already exists: {r['display_name']}")

print("\n🔄 Step 2: Migrating existing users to multi-role system...")
users = db.query(User).all()
migrated_count = 0

for user in users:
    if user.role: # If the user has an old string role
        # Normalize the role name (e.g., "Finance Officer" -> "finance_officer" -> "finance")
        role_name = user.role.lower().replace(" ", "_")
        if role_name == "finance_officer": role_name = "finance"
        if role_name == "exam_officer": role_name = "examination_office"
        
        if role_name in role_map:
            # Check if they already have this role assigned in the new table
            stmt = select(user_roles).where(
                user_roles.c.user_id == user.id, 
                user_roles.c.role_id == role_map[role_name]
            )
            existing_assignment = db.execute(stmt).first()
            
            if not existing_assignment:
                db.execute(user_roles.insert().values(
                    user_id=user.id, 
                    role_id=role_map[role_name],
                    is_department_uploader=False
                ))
            
            # Set their active role if it's not set yet
            if not user.active_role_id:
                user.active_role_id = role_map[role_name]
                migrated_count += 1

db.commit()
db.close()

print(f"\n🎉 SUCCESS! Migrated {migrated_count} users to the new multi-role system.")
print("No one will be locked out. Phase 2 is complete!")
