import sqlite3

DB_PATH = "school_management.db"

# Connect to the database
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Check if a 'roles' table exists and insert the new roles
# (Adjust the table/column names if your database uses different ones)
try:
    new_roles = [
        ("library_officer", "Library Officer"),
        ("accommodation_officer", "Accommodation Officer"),
        ("discipline_officer", "Discipline Officer")
    ]
    
    for role_name, role_desc in new_roles:
        # Try to insert. If it already exists, it will skip due to UNIQUE constraint
        cursor.execute("""
            INSERT OR IGNORE INTO roles (name, description) 
            VALUES (?, ?)
        """, (role_name, role_desc))
        
    conn.commit()
    print("✅ Granular roles added successfully!")
    
except Exception as e:
    print(f"⚠️ Note: {e}")
    print("If your roles are purely Enums in Python, you can ignore this database error.")

conn.close()
