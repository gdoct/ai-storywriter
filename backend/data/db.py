import getpass
import hashlib
import os
import sqlite3
import uuid
from datetime import datetime

from .db_config import DB_PATH, get_db_path


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()

    # Check if the database is already initialized
    c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if c.fetchone():
        print("Database is already initialized.")
        conn.close()
        return

    # Load schema from dbschema.sql
    schema_path = os.path.join(os.path.dirname(__file__), '../dbschema.sql')
    with open(schema_path, 'r') as schema_file:
        schema_sql = schema_file.read()

    # Execute the schema SQL
    c.executescript(schema_sql)

    conn.commit()
    conn.close()
    
    # ask for the admin username and email
    print("Database initialized successfully.")  
    print("Username for admin:")
    admin_username = input().strip()
    print("Email for admin:")
    admin_email = input().strip()
    print("Password for admin (will mask):")
    admin_password = getpass.getpass().strip()

    # insert the admin user into the database using all fields in the schema

    user_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    terms_agreed_at = created_at
    privacy_agreed_at = created_at
    terms_version = '1.0'
    privacy_version = '1.0'
    tier = 'admin'
    api_key_encrypted = None
    api_provider = 'lmstudio'
    is_deleted = 0

    # Hash the password (simple SHA256 for demonstration; use a stronger hash in production)
    password_hash = hashlib.sha256(admin_password.encode('utf-8')).hexdigest()

    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO users (
            id, username, email, password_hash, is_deleted, created_at,
            terms_agreed_at, privacy_agreed_at, terms_version, privacy_version,
            tier, api_key_encrypted, api_provider
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        user_id, admin_username, admin_email, password_hash, is_deleted, created_at,
        terms_agreed_at, privacy_agreed_at, terms_version, privacy_version,
        tier, api_key_encrypted, api_provider
    ))

    conn.commit()
    conn.close()

# def grant_admin_to_first_user():
#     conn = get_db_connection()
#     c = conn.cursor()

#     # Check if there are any users in the table
#     c.execute('SELECT COUNT(*) FROM users')
#     user_count = c.fetchone()[0]

#     if user_count == 0:
#         # Grant admin rights to the first user
#         c.execute('''
#             INSERT INTO users (id, username, email, is_deleted, created_at, tier)
#             VALUES (?, ?, ?, ?, ?, ?)
#         ''', (str(uuid.uuid4()), 'admin', 'admin@example.com', 0, datetime.now().isoformat(), 'admin'))

#     conn.commit()
#     conn.close()

# # Call this function after initializing the database
# init_db()
