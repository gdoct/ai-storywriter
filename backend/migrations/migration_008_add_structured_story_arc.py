#!/usr/bin/env python3
"""
Migration 008: Add structured_arc column to rolling_stories table

Stores the parsed/generated story arc as a JSON array of structured steps.
Each step has: {"step": 0, "name": "Setup", "description": "...", "locked": false}

The arc is:
- Generated/parsed once when a rolling story is created
- Steps start at 0 (not 1)
- Locked steps cannot be regenerated (already played through)
- Future steps can be regenerated if choices diverge significantly

Also changes current_arc_step default from 1 to 0.
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
    """Run the migration to add structured_arc column"""
    db_path = get_db_path()
    print(f"Using database: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if structured_arc column exists
        cursor.execute("PRAGMA table_info(rolling_stories)")
        columns = [row[1] for row in cursor.fetchall()]

        if "structured_arc" in columns:
            print("✓ structured_arc column already exists")
        else:
            print("Adding structured_arc column to rolling_stories...")
            cursor.execute("""
                ALTER TABLE rolling_stories
                ADD COLUMN structured_arc TEXT DEFAULT NULL
            """)
            print("✓ Added structured_arc column")

        # Update current_arc_step default for new stories (can't change default in SQLite ALTER)
        # But we can update existing stories with arc_step=1 to arc_step=0 if they have no paragraphs
        print("Updating arc step for empty stories to start at 0...")
        cursor.execute("""
            UPDATE rolling_stories
            SET current_arc_step = 0
            WHERE current_arc_step = 1
            AND id NOT IN (
                SELECT DISTINCT rolling_story_id FROM story_paragraphs
            )
        """)
        updated = cursor.rowcount
        print(f"✓ Updated {updated} empty stories to start at arc step 0")

        conn.commit()
        print("\n🎉 Migration completed successfully!")

    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    print("Running migration 008: Add structured story arc")
    run_migration()
