from app.core.database import SessionLocal
from app.models.models import Task

db = SessionLocal()

tasks = [
    # Registry Tasks
    {"code": "registry_data_entry", "name": "Registry Data Entry", "department": "Registry"},
    {"code": "registry_verification", "name": "Registry Verification", "department": "Registry"},
    {"code": "registry_upload", "name": "Registry Bulk Upload", "department": "Registry"},
    {"code": "registry_approve", "name": "Registry Approve Collection", "department": "Registry"},
    {"code": "registry_view_reports", "name": "Registry View Reports", "department": "Registry"},
    
    # Finance Tasks
    {"code": "finance_data_entry", "name": "Finance Data Entry", "department": "Finance"},
    {"code": "finance_verification", "name": "Finance Verification", "department": "Finance"},
    {"code": "finance_upload", "name": "Finance Bulk Upload", "department": "Finance"},
    {"code": "finance_approve", "name": "Finance Approve Clearance", "department": "Finance"},
    {"code": "finance_view_reports", "name": "Finance View Reports", "department": "Finance"},
    
    # Exam Tasks
    {"code": "exam_data_entry", "name": "Exam Data Entry", "department": "Examination"},
    {"code": "exam_verification", "name": "Exam Verification", "department": "Examination"},
    {"code": "exam_upload", "name": "Exam Bulk Upload", "department": "Examination"},
    {"code": "exam_approve", "name": "Exam Approve Clearance", "department": "Examination"},
    {"code": "exam_view_reports", "name": "Exam View Reports", "department": "Examination"},
    
    # Dean Tasks
    {"code": "dean_review", "name": "Dean Review Requests", "department": "Dean"},
    {"code": "dean_approve", "name": "Dean Approve Clearance", "department": "Dean"},
    {"code": "dean_reject", "name": "Dean Reject Clearance", "department": "Dean"},
    {"code": "dean_view_reports", "name": "Dean View Reports", "department": "Dean"},
    
    # Auditor Tasks
    {"code": "auditor_view_logs", "name": "Auditor View Logs", "department": "Audit"},
    {"code": "auditor_export_reports", "name": "Auditor Export Reports", "department": "Audit"},
]

print("🌱 Seeding granular tasks...")
for t in tasks:
    existing = db.query(Task).filter(Task.code == t["code"]).first()
    if not existing:
        db.add(Task(**t))
        print(f"✅ Created: {t['name']}")
    else:
        print(f"ℹ️ Already exists: {t['name']}")

db.commit()
db.close()
print("🎉 Task seeding complete!")
