#!/usr/bin/env python3
"""
Migration 007: Add story_summaries and story_user_choices tables

Supports the two-node Scenarist/Writer architecture:
- story_summaries: Maintains condensed narrative summary across paragraphs
- story_user_choices: Tracks all user choices for narrative coherence
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
    """Run the migration to add story_summaries and story_user_choices tables"""
    db_path = get_db_path()
    print(f"Using database: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if story_summaries table exists
        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='story_summaries'
        """)
        if cursor.fetchone():
            print("✓ story_summaries table already exists")
        else:
            print("Creating story_summaries table...")
            cursor.execute("""
                CREATE TABLE story_summaries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    rolling_story_id INTEGER NOT NULL UNIQUE,
                    summary_text TEXT NOT NULL DEFAULT '',
                    paragraph_count INTEGER NOT NULL DEFAULT 0,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (rolling_story_id) REFERENCES rolling_stories(id) ON DELETE CASCADE
                )
            """)
            print("✓ Created story_summaries table")

        # Check if story_user_choices table exists
        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='story_user_choices'
        """)
        if cursor.fetchone():
            print("✓ story_user_choices table already exists")
        else:
            print("Creating story_user_choices table...")
            cursor.execute("""
                CREATE TABLE story_user_choices (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    rolling_story_id INTEGER NOT NULL,
                    sequence INTEGER NOT NULL,
                    label TEXT NOT NULL,
                    description TEXT,
                    advances_arc INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (rolling_story_id) REFERENCES rolling_stories(id) ON DELETE CASCADE
                )
            """)
            # Create index for efficient lookups
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_story_user_choices_story
                ON story_user_choices(rolling_story_id)
            """)
            print("✓ Created story_user_choices table with index")

        conn.commit()
        print("\n🎉 Migration completed successfully!")

    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    print("Running migration 007: Add story summaries and user choices tables")
    run_migration()
