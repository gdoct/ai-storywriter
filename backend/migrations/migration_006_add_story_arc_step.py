#!/usr/bin/env python3
"""
Migration 006: Add current_arc_step to rolling_stories table

Tracks the current step in the story arc progression for rolling stories.
"""

import sqlite3
from pathlib import Path


def get_db_path():
    """Get the database path"""
    db_path = Path(__file__).parent.parent / "storywriter.db"
    if db_path.exists():
        return str(db_path)

    fallback_paths = [
        Path.cwd() / "storywriter.db",
        Path.cwd() / "backend" / "storywriter.db"
    ]

    for path in fallback_paths:
        if path.exists():
            return str(path)

    return str(db_path)


def run_migration():
    """Run the migration to add current_arc_step column"""
    db_path = get_db_path()
    print(f"Using database: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(rolling_stories)")
        columns = [col[1] for col in cursor.fetchall()]

        if 'current_arc_step' in columns:
            print("✓ current_arc_step column already exists")
        else:
            print("Adding current_arc_step column to rolling_stories...")
            cursor.execute("""
                ALTER TABLE rolling_stories
                ADD COLUMN current_arc_step INTEGER NOT NULL DEFAULT 1
            """)
            print("✓ Added current_arc_step column")

        conn.commit()
        print("\n🎉 Migration completed successfully!")

    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    print("Running migration 006: Add story arc step tracking")
    run_migration()
