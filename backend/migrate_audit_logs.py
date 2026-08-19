import sqlite3
import shutil
from datetime import datetime

DB = "school_management.db"

# 1. Backup before touching anything
backup = f"school_management_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
shutil.copy(DB, backup)
print(f"✅ Backup created: {backup}")

conn = sqlite3.connect(DB)
cur = conn.cursor()

# 2. Inspect current schema
cur.execute("PRAGMA table_info(audit_logs)")
cols = cur.fetchall()
col_names = [c[1] for c in cols]
user_id_notnull = next((c[3] for c in cols if c[1] == "user_id"), 0)

print(f"Current columns: {col_names}")
print(f"user_id NOT NULL flag: {user_id_notnull}")

if "subject_username" in col_names and user_id_notnull == 0:
    print("✅ Already migrated. Nothing to do.")
else:
    # 3. Rebuild table: nullable user_id + new columns + indexes (SQLite-safe)
    cur.executescript("""
    BEGIN;
    CREATE TABLE IF NOT EXISTS audit_logs_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action VARCHAR NOT NULL,
        module VARCHAR NOT NULL,
        details TEXT,
        metadata_json JSON,
        previous_status VARCHAR,
        new_status VARCHAR,
        ip_address VARCHAR,
        user_agent VARCHAR,
        subject_username VARCHAR,
        severity VARCHAR DEFAULT 'info',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );

    INSERT INTO audit_logs_new
        (id, user_id, action, module, details, metadata_json, previous_status, new_status, ip_address, user_agent, created_at)
    SELECT id, user_id, action, module, details, NULL, previous_status, new_status, ip_address, user_agent, created_at
    FROM audit_logs;

    DROP TABLE audit_logs;
    ALTER TABLE audit_logs_new RENAME TO audit_logs;

    CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at       ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS ix_audit_logs_action           ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS ix_audit_logs_module           ON audit_logs(module);
    CREATE INDEX IF NOT EXISTS ix_audit_logs_subject_username ON audit_logs(subject_username);
    COMMIT;
    """)
    conn.commit()
    print("✅ Migrated: user_id nullable + metadata_json + subject_username + severity + indexes.")

# 4. Verify
print("\nFinal schema:")
cur.execute("PRAGMA table_info(audit_logs)")
for c in cur.fetchall():
    print(f"  {c[1]:20} notnull={c[3]}")

conn.close()
print("\n🎉 Migration complete. Your old data is safe in the backup file.")
