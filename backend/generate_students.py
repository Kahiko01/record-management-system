"""
Student Data Generator for School Management System
Generates 300 students with various programs, levels, genders, and clearance statuses
"""

import random
import string
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.models import Base, User, Student, ClearanceRequest, FinanceClearance, ExaminationClearance
from app.auth.auth import get_password_hash
from app.models.models import UserRole, ClearanceStatus

# ============= DATA =============

# Programs with their levels
PROGRAMS = {
    "Diploma in Information Technology": [3, 4, 5],
    "Diploma in Business Administration": [3, 4, 5],
    "Diploma in Accounting": [3, 4, 5],
    "Diploma in Human Resource Management": [3, 4, 5],
    "Diploma in Marketing": [3, 4, 5],
    "Diploma in Computer Science": [3, 4, 5],
    "Diploma in Electrical Engineering": [3, 4, 5],
    "Diploma in Mechanical Engineering": [3, 4, 5],
    "Diploma in Civil Engineering": [3, 4, 5],
    "Diploma in Nursing": [3, 4, 5],
    "Bachelor of Science in IT": [5, 6],
    "Bachelor of Business Administration": [5, 6],
    "Bachelor of Computer Science": [5, 6],
    "Bachelor of Engineering": [5, 6],
    "Bachelor of Nursing": [5, 6],
}

# First names
FIRST_NAMES_MALE = [
    "James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles",
    "Christopher", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua",
    "Kenneth", "Kevin", "Brian", "George", "Timothy", "Ronald", "Edward", "Jason", "Jeffrey", "Ryan",
    "Jacob", "Gary", "Nicholas", "Eric", "Jonathan", "Stephen", "Larry", "Justin", "Scott", "Brandon",
    "Benjamin", "Samuel", "Raymond", "Gregory", "Frank", "Alexander", "Patrick", "Jack", "Dennis", "Jerry"
]

FIRST_NAMES_FEMALE = [
    "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen",
    "Lisa", "Nancy", "Betty", "Margaret", "Sandra", "Ashley", "Kimberly", "Donna", "Emily", "Michelle",
    "Carol", "Amanda", "Dorothy", "Melissa", "Deborah", "Stephanie", "Rebecca", "Sharon", "Laura", "Cynthia",
    "Kathleen", "Amy", "Angela", "Shirley", "Anna", "Brenda", "Pamela", "Emma", "Nicole", "Helen",
    "Samantha", "Katherine", "Christine", "Debra", "Rachel", "Carolyn", "Janet", "Catherine", "Maria", "Heather"
]

# Last names
LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee",
    "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
    "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green",
    "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts", "Turner"
]

# Kenyan counties
COUNTIES = [
    "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Malindi", "Kitale", "Garissa", "Nyeri",
    "Meru", "Embu", "Machakos", "Kitui", "Kilifi", "Kwale", "Taita-Taveta", "Lamu", "Tana River", "Isiolo"
]

# Phone prefixes
PHONE_PREFIXES = ["0712", "0722", "0733", "0744", "0755", "0766", "0777", "0788", "0799", "0700"]

# Track used student IDs to avoid duplicates
used_student_ids = set()
used_usernames = set()

# ============= HELPER FUNCTIONS =============

def random_name(gender):
    if gender == "male":
        first = random.choice(FIRST_NAMES_MALE)
    else:
        first = random.choice(FIRST_NAMES_FEMALE)
    last = random.choice(LAST_NAMES)
    return first, last

def random_date(start_year=2020, end_year=2024):
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 12, 31)
    return start + timedelta(days=random.randint(0, (end - start).days))

def random_phone():
    prefix = random.choice(PHONE_PREFIXES)
    suffix = ''.join(random.choices(string.digits, k=7))
    return f"{prefix}{suffix}"

def random_email(first_name, last_name):
    domains = ["gmail.com", "yahoo.com", "outlook.com", "student.university.ac.ke"]
    return f"{first_name.lower()}.{last_name.lower()}{random.randint(1, 999)}@{random.choice(domains)}"

def random_student_id():
    """Generate unique student ID"""
    year = random.randint(2020, 2024)
    num = ''.join(random.choices(string.digits, k=4))
    student_id = f"STU-{year}-{num}"

    # Ensure uniqueness
    while student_id in used_student_ids:
        year = random.randint(2020, 2024)
        num = ''.join(random.choices(string.digits, k=4))
        student_id = f"STU-{year}-{num}"

    used_student_ids.add(student_id)
    return student_id

def random_program_and_level():
    program = random.choice(list(PROGRAMS.keys()))
    level = random.choice(PROGRAMS[program])
    return program, level

def random_clearance_status():
    rand = random.random()
    if rand < 0.40:
        return "cleared", "cleared", "cleared", True
    elif rand < 0.70:
        return "pending", random.choice(["pending", "cleared", "not_cleared"]), random.choice(["pending", "cleared", "not_cleared"]), False
    elif rand < 0.90:
        return "in_progress", random.choice(["pending", "cleared"]), random.choice(["pending", "cleared"]), False
    else:
        return "rejected", random.choice(["not_cleared", "pending"]), random.choice(["not_cleared", "pending"]), False

def random_balance():
    if random.random() < 0.3:
        return 0.0
    return round(random.uniform(1000, 500000), 2)

def generate_unique_username(first_name, last_name):
    """Generate unique username"""
    base = f"{first_name.lower()}.{last_name.lower()}"
    username = base
    counter = 1
    while username in used_usernames:
        username = f"{base}{counter}"
        counter += 1
    used_usernames.add(username)
    return username

# ============= MAIN GENERATION FUNCTION =============

def generate_students(count=300):
    db = SessionLocal()

    try:
        # Check if admin exists
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@school.edu",
                full_name="System Administrator",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print("✅ Admin user created")
        else:
            print("✅ Admin user exists")

        # Get existing student IDs to avoid duplicates
        existing_students = db.query(Student.student_id).all()
        for s in existing_students:
            used_student_ids.add(s[0])

        # Get existing usernames
        existing_users = db.query(User.username).all()
        for u in existing_users:
            used_usernames.add(u[0])

        print(f"\n📊 Generating {count} students...")
        print(f"   Existing students: {len(used_student_ids)}")

        generated = 0
        for i in range(count):
            try:
                # Random gender
                gender = random.choice(["male", "female"])
                first_name, last_name = random_name(gender)

                # Program and level
                program, level = random_program_and_level()

                # Dates
                enrollment_date = random_date(2020, 2023)
                graduation_date = enrollment_date + timedelta(days=random.randint(365*2, 365*4))

                # Statuses
                overall, finance_status, exam_status, eligible = random_clearance_status()

                # Create user account
                username = generate_unique_username(first_name, last_name)
                email = random_email(first_name, last_name)

                user = User(
                    email=email,
                    username=username,
                    full_name=f"{first_name} {last_name}",
                    hashed_password=get_password_hash("student123"),
                    role=UserRole.STUDENT,
                    is_active=True,
                    created_at=datetime.now(),
                    updated_at=datetime.now()  # Added to prevent Pydantic validation errors
                )
                db.add(user)
                db.flush()

                # Create student with unique ID
                student_id = random_student_id()
                student = Student(
                    student_id=student_id,
                    user_id=user.id,
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    phone=random_phone(),
                    address=f"{random.randint(1, 999)} {random.choice(['Main', 'Kimathi', 'Moi', 'Kenyatta', 'Uhuru'])} Street, {random.choice(COUNTIES)}",
                    program=program,
                    year_of_study=level,
                    enrollment_date=enrollment_date.strftime("%Y-%m-%d"),
                    graduation_date=graduation_date.strftime("%Y-%m-%d"),
                    date_of_birth=random_date(1995, 2005).strftime("%Y-%m-%d"),
                    national_id=f"{random.randint(10000000, 99999999)}",
                    created_at=datetime.now(),
                    updated_at=datetime.now()  # Added to prevent Pydantic validation errors
                )
                db.add(student)
                db.flush()

                # Create clearance request
                clearance = ClearanceRequest(
                    student_id=student.id,
                    student_user_id=user.id,
                    request_date=enrollment_date + timedelta(days=random.randint(30, 180)),
                    overall_status=overall,
                    collection_eligible=eligible,
                    collection_eligible_date=datetime.now() if eligible else None,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.add(clearance)
                db.flush()

                # Create finance clearance
                finance = FinanceClearance(
                    clearance_request_id=clearance.id,
                    status=finance_status,
                    remarks=f"Finance verification completed" if finance_status == "cleared" else
                           f"Outstanding balance: KES {random_balance():,.2f}" if finance_status == "not_cleared" else
                           "Pending finance review",
                    amount_due=random_balance(),
                    amount_paid=random_balance() * random.uniform(0.5, 1.0) if random.random() < 0.7 else 0,
                    outstanding_balance=random_balance(),
                    cleared_by=admin.id if finance_status == "cleared" else None,
                    cleared_at=datetime.now() if finance_status == "cleared" else None,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.add(finance)

                # Create examination clearance
                exam = ExaminationClearance(
                    clearance_request_id=clearance.id,
                    status=exam_status,
                    remarks="All academic requirements met" if exam_status == "cleared" else
                           "Missing some requirements" if exam_status == "not_cleared" else
                           "Pending academic verification",
                    results_released=exam_status == "cleared",
                    program_completed=exam_status == "cleared",
                    graduation_approved=exam_status == "cleared",
                    no_missing_grades=exam_status == "cleared",
                    credits_completed=exam_status == "cleared",
                    cleared_by=admin.id if exam_status == "cleared" else None,
                    cleared_at=datetime.now() if exam_status == "cleared" else None,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.add(exam)

                generated += 1

                # Commit every 10 students
                if generated % 10 == 0:
                    db.commit()
                    print(f"  Generated {generated} students...")

            except Exception as e:
                print(f"  ⚠️ Error on student {i}: {e}")
                db.rollback()
                continue

        db.commit()
        print(f"\n✅ Successfully generated {generated} new students!")

        # Show statistics
        stats = db.query(Student).count()
        print(f"\n📊 Total students in database: {stats}")

        # Count by level
        print("\n📊 Students by Level:")
        for level in range(3, 7):
            count_level = db.query(Student).filter(Student.year_of_study == level).count()
            print(f"  Level {level}: {count_level} students")

        # Count by clearance status
        print("\n📋 Clearance Status:")
        for status in ["cleared", "pending", "in_progress", "rejected"]:
            count_status = db.query(ClearanceRequest).filter(ClearanceRequest.overall_status == status).count()
            emoji = "✅" if status == "cleared" else "⏳" if status == "pending" else "🔄" if status == "in_progress" else "❌"
            print(f"  {emoji} {status.capitalize()}: {count_status}")

        # Sample students
        print("\n📝 Sample Students:")
        sample = db.query(Student).limit(5).all()
        for s in sample:
            print(f"  {s.student_id}: {s.first_name} {s.last_name} - {s.program} (Level {s.year_of_study})")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Generate 300 students (or as many as needed)
    generate_students(300)
