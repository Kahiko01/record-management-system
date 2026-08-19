"""
Verify the integrity of the audit log hash chain.
Skips legacy entries (before hash chain was implemented).
"""
import sqlite3
import hashlib
import json
from app.core.database import engine

def verify_audit_chain():
    url = str(engine.url).replace('sqlite:///', '')
    print(f"🔍 Verifying audit chain in: {url}\n")
    
    conn = sqlite3.connect(url)
    cursor = conn.cursor()
    
    # Fetch all audit logs in order
    cursor.execute("""
        SELECT id, user_id, action, module, details, metadata_json,
               previous_status, new_status, ip_address, user_agent,
               subject_username, severity, request_id, prev_hash, entry_hash
        FROM audit_logs
        ORDER BY id ASC
    """)
    
    rows = cursor.fetchall()
    
    if not rows:
        print("✅ No audit logs to verify.")
        conn.close()
        return
    
    print(f"Found {len(rows)} total audit entries.")
    
    # Skip legacy entries (find the first one with a valid entry_hash)
    first_valid_idx = None
    for i, row in enumerate(rows):
        if row[14] is not None:  # entry_hash is not None
            first_valid_idx = i
            break
    
    if first_valid_idx is None:
        print("⚠️  No entries with hash chains found. The hash chain feature may not be active yet.")
        conn.close()
        return
    
    legacy_count = first_valid_idx
    if legacy_count > 0:
        print(f"ℹ️  Skipping {legacy_count} legacy entries (created before hash chain).")
    
    # Start verification from the first valid entry
    valid_rows = rows[first_valid_idx:]
    print(f"🔗 Verifying {len(valid_rows)} entries with hash chains...\n")
    
    errors = 0
        # The first valid entry might have prev_hash="genesis" OR prev_hash=None (if it followed legacy entries)
    first_row = valid_rows[0]
    if first_row[13] is None:
        prev_hash_expected = None
        print("ℹ️  First chained entry has prev_hash=None (following legacy entries). Treating as genesis.\n")
    else:
        prev_hash_expected = "genesis"
    
    for row in valid_rows:
        (id, user_id, action, module, details, metadata_json,
         previous_status, new_status, ip_address, user_agent,
         subject_username, severity, request_id, prev_hash, entry_hash) = row
        
        # Verify prev_hash matches
        if prev_hash != prev_hash_expected:
            print(f"❌ Entry {id}: prev_hash mismatch!")
            print(f"   Expected: {prev_hash_expected[:16]}..." if prev_hash_expected else "   Expected: None")
            print(f"   Got:      {prev_hash[:16]}..." if prev_hash else "   Got:      None")
            errors += 1
        
        # Recompute entry_hash
        # Parse metadata_json safely
        try:
            metadata_obj = json.loads(metadata_json) if metadata_json else None
        except:
            metadata_obj = None
            
        hash_data = {
            "user_id": user_id,
            "action": action,
            "module": module,
            "details": details,
            "metadata": metadata_obj,
            "previous_status": previous_status,
            "new_status": new_status,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "subject_username": subject_username,
            "severity": severity,
            "request_id": request_id,
            "prev_hash": prev_hash
        }
        
        hash_string = json.dumps(hash_data, sort_keys=True, default=str)
        expected_hash = hashlib.sha256(hash_string.encode()).hexdigest()
        
        if entry_hash != expected_hash:
            print(f"❌ Entry {id}: entry_hash mismatch (TAMPERING DETECTED)!")
            print(f"   Action: {action} | User: {subject_username or user_id}")
            print(f"   Expected: {expected_hash[:16]}...")
            print(f"   Got:      {entry_hash[:16]}...")
            errors += 1
        
        # Update expected hash for next iteration
        prev_hash_expected = entry_hash
    
    print(f"\n{'='*60}")
    if errors == 0:
        print(f"✅ All {len(valid_rows)} hash-chained entries verified successfully!")
        print("   The audit log is intact and untampered.")
        if legacy_count > 0:
            print(f"   (Plus {legacy_count} legacy entries were safely skipped.)")
    else:
        print(f"❌ Found {errors} integrity violations!")
        print("   The audit log may have been tampered with.")
    
    conn.close()

if __name__ == "__main__":
    verify_audit_chain()
