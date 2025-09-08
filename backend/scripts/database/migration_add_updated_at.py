#!/usr/bin/env python3
"""
Database migration to add updated_at column to scenarios table
"""

import os
import sqlite3
from datetime import datetime
from db_config import DB_PATH

def migrate_add_updated_at():
    """Add updated_at column to scenarios table"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        # Check if column already exists
        c.execute("PRAGMA table_info(scenarios)")
        columns = [row[1] for row in c.fetchall()]
        
        if 'updated_at' not in columns:
            # Add updated_at column
            c.execute('ALTER TABLE scenarios ADD COLUMN updated_at TEXT')
            print("Added updated_at column to scenarios table")
            
            # Set initial values: use created_at for existing records
            c.execute('UPDATE scenarios SET updated_at = created_at WHERE updated_at IS NULL')
            print("Initialized updated_at values for existing scenarios")
        else:
            print("updated_at column already exists")
        
        conn.commit()
        print("Migration completed successfully")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_add_updated_at()
