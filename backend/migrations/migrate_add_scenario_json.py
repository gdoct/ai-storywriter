#!/usr/bin/env python3
"""
Migration script to add scenario_json column to stories table
Run this script to update existing databases with the new schema
"""

import os
import sqlite3
import sys

# Add the backend directory to the path so we can import from data.db
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/..')

from data.db import get_db_connection


def migrate_add_scenario_json():
    """Add scenario_json column to stories table"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(stories)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'scenario_json' not in columns:
            print("Adding scenario_json column to stories table...")
            cursor.execute("ALTER TABLE stories ADD COLUMN scenario_json TEXT")
            conn.commit()
            print("✓ Migration completed successfully")
        else:
            print("✓ scenario_json column already exists, skipping migration")
            
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_add_scenario_json()
