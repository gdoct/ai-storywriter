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

def grant_admin_to_first_user():
    conn = get_db_connection()
    c = conn.cursor()

    # Check if there are any users in the table
    c.execute('SELECT COUNT(*) FROM users')
    user_count = c.fetchone()[0]

    if user_count == 0:
        # Grant admin rights to the first user
        c.execute('''
            INSERT INTO users (id, username, email, is_deleted, created_at, tier)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (str(uuid.uuid4()), 'admin', 'admin@example.com', 0, datetime.now().isoformat(), 'admin'))

    conn.commit()
    conn.close()

# Call this function after initializing the database
init_db()
