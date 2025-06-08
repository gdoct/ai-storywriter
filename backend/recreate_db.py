import os
import sqlite3
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'storywriter.db')

def recreate_db():
    # Remove existing DB if it exists
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"Removed existing database at {DB_PATH}")
    
    # Create new DB connection
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Users table - using TEXT for ID
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT,
            is_deleted INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Scenarios table - using TEXT for ID and user_id
    c.execute('''
        CREATE TABLE IF NOT EXISTS scenarios (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            title TEXT,
            jsondata TEXT,
            is_deleted INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    
    # Stories table - using TEXT for scenario_id
    c.execute('''
        CREATE TABLE IF NOT EXISTS stories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scenario_id TEXT,
            text TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(scenario_id) REFERENCES scenarios(id)
        )
    ''')
    
    # Settings table for LLM backend configuration
    c.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            backend_type TEXT NOT NULL,
            config_json TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    conn.commit()
    conn.close()
    print("Database created successfully with UUID-based schema")

if __name__ == "__main__":
    recreate_db()
