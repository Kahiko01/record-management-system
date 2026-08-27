import sqlite3
import bcrypt

# Connect directly to the database
conn = sqlite3.connect('school_management.db')
cursor = conn.cursor()

# Check if admin exists
cursor.execute("SELECT username FROM users WHERE username='admin'")
user = cursor.fetchone()

if user:
    print("✅ Admin user already exists in database.")
else:
    # Hash the password 'admin123'
    password = "admin123"
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    
    # Insert the admin user (adjust column names if your schema is slightly different)
    try:
        cursor.execute("""
            INSERT INTO users (username, email, hashed_password, role, is_active)
            VALUES (?, ?, ?, ?, ?)
        """, ("admin", "admin@knp.ac.ke", hashed.decode('utf-8'), "super admin", 1))
        conn.commit()
        print("✅ Admin user created successfully!")
        print("Username: admin")
        print("Password: admin123")
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        print("Your users table might have different column names. Let's check the schema:")
        cursor.execute("PRAGMA table_info(users);")
        print(cursor.fetchall())

conn.close()
