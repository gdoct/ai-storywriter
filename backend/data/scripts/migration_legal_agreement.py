#!/usr/bin/env python3
"""
Database migration to add legal agreement tracking to users table
"""

import os
import sqlite3
from datetime import datetime
from db_config import DB_PATH

def migrate_legal_agreement_tracking():
    """Add legal agreement tracking columns to users table"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        # Check if columns already exist
        c.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in c.fetchall()]
        
        # Add new columns if they don't exist
        if 'terms_agreed_at' not in columns:
            c.execute('ALTER TABLE users ADD COLUMN terms_agreed_at TEXT')
            print("Added terms_agreed_at column")
        
        if 'privacy_agreed_at' not in columns:
            c.execute('ALTER TABLE users ADD COLUMN privacy_agreed_at TEXT')
            print("Added privacy_agreed_at column")
        
        if 'terms_version' not in columns:
            c.execute("ALTER TABLE users ADD COLUMN terms_version TEXT DEFAULT '1.0'")
            print("Added terms_version column")
        
        if 'privacy_version' not in columns:
            c.execute("ALTER TABLE users ADD COLUMN privacy_version TEXT DEFAULT '1.0'")
            print("Added privacy_version column")
        
        conn.commit()
        print("Legal agreement tracking migration completed successfully")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_legal_agreement_tracking()
