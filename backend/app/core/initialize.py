"""
Enterprise System Initializer
Automatically creates tables, roles, tasks, and admins on first run.
"""
from app.core.database import engine, Base, SessionLocal
from app.models.models import User, UserRole, Role, Task, UserTask
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==========================================
# MASTER DATA DEFINITIONS
# ==========================================
DEFAULT_ROLES = [
    {"name": "super_admin", "display_name": "Super Admin", "department": "System"},
    {"name": "finance", "display_name": "Finance Officer", "department": "Finance"},
    {"name": "examination_office", "display_name": "Examination Officer", "department": "Academics"},
    {"name": "dean", "display_name": "Dean", "department": "Academics"},
    {"name": "registry_officer", "display_name": "Registry Officer", "department": "Registry"},
    {"name": "internal_auditor", "display_name": "Internal Auditor", "department": "Audit"},
    {"name": "student", "display_name": "Student", "department": "Student"},
]

DEFAULT_TASKS = [
    {"code": "registry_data_entry", "name": "Registry Data Entry", "department": "Registry"},
    {"code": "registry_verification", "name": "Registry Verification", "department": "Registry"},
    {"code": "registry_upload", "name": "Registry Bulk Upload", "department": "Registry"},
    {"code": "registry_approve", "name": "Registry Approve Collection", "department": "Registry"},
    {"code": "registry_view_reports", "name": "Registry View Reports", "department": "Registry"},
    {"code": "registry_view_dashboard", "name": "Registry View Dashboard", "department": "Registry"},
    {"code": "finance_data_entry", "name": "Finance Data Entry", "department": "Finance"},
    {"code": "finance_verification", "name": "Finance Verification", "department": "Finance"},
    {"code": "finance_upload", "name": "Finance Bulk Upload", "department": "Finance"},
    {"code": "finance_approve", "name": "Finance Approve Clearance", "department": "Finance"},
    {"code": "finance_view_reports", "name": "Finance View Reports", "department": "Finance"},
    {"code": "finance_view_dashboard", "name": "Finance View Dashboard", "department": "Finance"},
    {"code": "exam_data_entry", "name": "Exam Data Entry", "department": "Examination"},
    {"code": "exam_verification", "name": "Exam Verification", "department": "Examination"},
    {"code": "exam_upload", "name": "Exam Bulk Upload", "department": "Examination"},
    {"code": "exam_approve", "name": "Exam Approve Clearance", "department": "Examination"},
    {"code": "exam_view_reports", "name": "Exam View Reports", "department": "Examination"},
    {"code": "exam_view_dashboard", "name": "Exam View Dashboard", "department": "Examination"},
    {"code": "dean_review", "name": "Dean Review Requests", "department": "Dean"},
    {"code": "dean_approve", "name": "Dean Approve Clearance", "department": "Dean"},
    {"code": "dean_reject", "name": "Dean Reject Clearance", "department": "Dean"},
    {"code": "dean_view_reports", "name": "Dean View Reports", "department": "Dean"},
    {"code": "dean_view_dashboard", "name": "Dean View Dashboard", "department": "Dean"},
    {"code": "auditor_view_logs", "name": "Auditor View Logs", "department": "Audit"},
    {"code": "auditor_export_reports", "name": "Auditor Export Reports", "department": "Audit"},
    {"code": "auditor_view_dashboard", "name": "Auditor View Dashboard", "department": "Audit"},
    {"code": "user_view", "name": "User View", "department": "Administration"},
    {"code": "user_create", "name": "User Create", "department": "Administration"},
    {"code": "user_assign_role", "name": "User Assign Role", "department": "Administration"},
    {"code": "admin_view_all_logs", "name": "Admin View All Logs", "department": "Administration"},
    {"code": "admin_configure_system", "name": "Admin Configure System", "department": "Administration"},
]

DEFAULT_ACCOUNTS = [
    {"username": "admin", "email": "admin@university.edu", "password": "admin123", "role": "super_admin", "full_name": "System Administrator"},
    {"username": "finance_officer", "email": "finance@university.edu", "password": "finance123", "role": "finance", "full_name": "Finance Officer"},
    {"username": "exam_officer", "email": "exams@university.edu", "password": "exam123", "role": "examination_office", "full_name": "Examination Officer"},
    {"username": "dean", "email": "dean@university.edu", "password": "dean123", "role": "dean", "full_name": "Dean of Students"},
    {"username": "registry_officer", "email": "registry@university.edu", "password": "registry123", "role": "registry_officer", "full_name": "Registry Officer"},
    {"username": "auditor", "email": "auditor@university.edu", "password": "audit123", "role": "internal_auditor", "full_name": "Internal Auditor"},
]

# ==========================================
# INITIALIZATION LOGIC
# ==========================================
def initialize_system():
    # 1. Ensure all database tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    print("\n🔧 Checking system initialization...")

    # A. Seed Roles
    if db.query(Role).count() == 0:
        print("🌱 Seeding default roles...")
        for r in DEFAULT_ROLES:
            db.add(Role(**r))
        db.commit()
        print(f"   ✅ Created {len(DEFAULT_ROLES)} roles")

    # B. Seed Tasks
    if db.query(Task).count() == 0:
        print("🌱 Seeding default tasks...")
        for t in DEFAULT_TASKS:
            db.add(Task(**t))
        db.commit()
        print(f"   ✅ Created {len(DEFAULT_TASKS)} tasks")

    # C. Seed Admin Accounts - FIXED
    admin_exists = db.query(User).filter(User.username == "admin").first()
    if not admin_exists:
        print("🌱 First run detected. Creating default accounts...")

        role_map = {
            "super_admin": "super_admin",
            "finance": "finance",
            "examination_office": "examination_office",
            "dean": "dean",
            "registry_officer": "registry_officer",
            "internal_auditor": "internal_auditor",
        }

        for account in DEFAULT_ACCOUNTS:
            # Get the role object from database
            role_name = role_map.get(account["role"], "super_admin")
            role_obj = db.query(Role).filter(Role.name == role_name).first()

            # Hash the password
            hashed_password = pwd_context.hash(account["password"])

            # Create user with active_role_id
            new_user = User(
                email=account["email"],
                username=account["username"],
                full_name=account["full_name"],
                hashed_password=hashed_password,
                active_role_id=role_obj.id if role_obj else None,  # ✅ CORRECT - use role ID
                department=account.get("department"),
                is_active=True,
                is_email_verified=True
            )
            
            # Add to the many-to-many roles relationship
            if role_obj:
                new_user.roles.append(role_obj)
            
            db.add(new_user)
            print(f"   ✅ Created: {account['username']} with role: {account['role']}")

        db.commit()
        print("🎉 System initialized successfully!\n")
    else:
        print("✅ System already initialized. Skipping.\n")

    # D. Auto-assign default tasks to seeded users
    if db.query(UserTask).count() == 0:
        print("🌱 Assigning default tasks to seeded users...")

        # Get all tasks from database
        all_tasks = {t.code: t.id for t in db.query(Task).all()}
        all_users = {u.username: u.id for u in db.query(User).all()}

        # Define default task assignments per user
        default_assignments = {
            "finance_officer": [
                "finance_data_entry", "finance_verification", "finance_upload",
                "finance_approve", "finance_view_reports", "finance_view_dashboard"
            ],
            "exam_officer": [
                "exam_data_entry", "exam_verification", "exam_upload",
                "exam_approve", "exam_view_reports", "exam_view_dashboard"
            ],
            "dean": [
                "dean_review", "dean_approve", "dean_reject",
                "dean_view_reports", "dean_view_dashboard"
            ],
            "registry_officer": [
                "registry_data_entry", "registry_verification", "registry_upload",
                "registry_approve", "registry_view_reports", "registry_view_dashboard"
            ],
            "auditor": [
                "auditor_view_logs", "auditor_export_reports", "auditor_view_dashboard"
            ],
        }

        for username, task_codes in default_assignments.items():
            user_id = all_users.get(username)
            if not user_id:
                continue
            for code in task_codes:
                task_id = all_tasks.get(code)
                if task_id:
                    db.add(UserTask(
                        user_id=user_id,
                        task_id=task_id,
                        is_enabled=True,
                        granted_by=all_users.get("admin")
                    ))
            print(f"   ✅ {username}: {len(task_codes)} tasks assigned")

        db.commit()
        print("   ✅ Default task assignments complete!")

    db.close()
