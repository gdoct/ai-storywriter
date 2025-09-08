import os
import sqlite3
import uuid
from datetime import datetime

from services.security_utils import hash_password

from .db_config import DB_PATH


def get_db_connection():
    
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        raise

def init_db():
    conn = get_db_connection()
    c = conn.cursor()

    # Check if the database is already initialized
    c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if c.fetchone():
        conn.close()
        return

    schema_path = os.path.join(os.path.dirname(__file__), '../dbschema.sql')
    print(f"Initializing database with schema from {schema_path}.")
    # Load schema from dbschema.sql
    with open(schema_path, 'r') as schema_file:
        schema_sql = schema_file.read()

    # Execute the schema SQL with error handling
    try:
        c.executescript(schema_sql)
    except sqlite3.Error as e:
        print(f"Error executing schema SQL: {e}")
        conn.close()
        return

    conn.commit()
    conn.close()
    
    # Get admin credentials from environment variables
    print("Database initialized successfully.")
    print("Creating admin user from environment variables...")
    
    admin_username = os.getenv('ADMIN_DEFAULT_USERNAME')
    admin_email = os.getenv('ADMIN_DEFAULT_EMAIL') 
    admin_password = os.getenv('ADMIN_DEFAULT_PASSWORD')
    
    if not admin_username:
        raise ValueError("ADMIN_DEFAULT_USERNAME environment variable is required for Docker deployment")
    if not admin_email:
        raise ValueError("ADMIN_DEFAULT_EMAIL environment variable is required for Docker deployment")
    if not admin_password:
        raise ValueError("ADMIN_DEFAULT_PASSWORD environment variable is required for Docker deployment")
        
    print(f"Creating admin user: {admin_username} ({admin_email})")

    # insert the admin user into the database using all fields in the schema

    user_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    terms_agreed_at = created_at
    privacy_agreed_at = created_at
    terms_version = '1.0'
    privacy_version = '1.0'
    tier = 'premium'
    api_key_encrypted = None
    api_provider = 'openai'
    is_deleted = 0

    # Hash the password using the secure hash_password utility
    password_hash = hash_password(admin_password)

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

    # Insert admin roles for the created admin user
    conn = get_db_connection()
    c = conn.cursor()
    now = datetime.now().isoformat()
    # Grant both 'admin' and 'moderator' roles to the admin user
    for role in ("admin", "moderator"):
        c.execute('''
            INSERT INTO user_roles (user_id, role, granted_by, granted_at)
            VALUES (?, ?, ?, ?)
        ''', (user_id, role, user_id, now))
    # Add a purchase of 1,000,000 credits for the admin user
    import uuid as _uuid
    c.execute('''
        INSERT INTO credit_transactions (
            id, user_id, transaction_type, amount, description, related_entity_id, created_at, checkpoint_balance
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        str(_uuid.uuid4()), user_id, 'purchase', 1000000, 'Initial admin credit grant', None, now, 1000000
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
