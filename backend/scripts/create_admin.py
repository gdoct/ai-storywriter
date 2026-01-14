 #!/usr/bin/env python3
import os
import sys
import sqlite3
import uuid

# Add backend to path to import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from domain.services.security_utils import hash_password

def create_admin_user(db_path, username, email, password):
    """Create an admin user with moderator and admin roles."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Generate UUID for user
        user_id = str(uuid.uuid4())

        # Hash the password
        hashed_password = hash_password(password)

        # Insert the new user into the users table
        cursor.execute("""
            INSERT INTO users (id, username, email, password_hash, 
tier) 
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, username, email, hashed_password,
"premium"))

        # Insert roles for the new user
        cursor.execute("INSERT INTO user_roles (user_id, role)   VALUES (?, ?)", (user_id, "admin"))
        cursor.execute("INSERT INTO user_roles (user_id, role)   VALUES (?, ?)", (user_id, "moderator"))

        conn.commit()
        print(f"Admin user created successfully with ID:   {user_id}")

    except Exception as e:
        conn.rollback()
        print(f"Error creating admin user: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python create_admin.py <db_path> <username> <email> <password>")
        sys.exit(1)

    db_path = sys.argv[1]
    username = sys.argv[2]
    email = sys.argv[3]
    password = sys.argv[4]

    create_admin_user(db_path, username, email, password)