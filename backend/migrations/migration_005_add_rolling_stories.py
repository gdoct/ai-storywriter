#!/usr/bin/env python3
"""
Migration 005: Add Rolling Stories feature tables
- Creates rolling_stories table for story sessions
- Creates story_paragraphs table for generated paragraphs
- Creates story_bible table for character/setting/object facts (Tier 1)
- Creates story_events table for narrative events (Tier 2)
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
    """Run the migration to add rolling stories tables"""
    db_path = get_db_path()
    print(f"Using database: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if rolling_stories table already exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='rolling_stories'")
        if cursor.fetchone():
            print("✓ rolling_stories table already exists")
        else:
            print("Creating rolling_stories table...")
            cursor.execute("""
                CREATE TABLE rolling_stories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    scenario_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'in_progress', 'completed', 'abandoned')),
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (scenario_id) REFERENCES scenarios(id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)
            print("✓ Created rolling_stories table")

        # Check if story_paragraphs table already exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='story_paragraphs'")
        if cursor.fetchone():
            print("✓ story_paragraphs table already exists")
        else:
            print("Creating story_paragraphs table...")
            cursor.execute("""
                CREATE TABLE story_paragraphs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    rolling_story_id INTEGER NOT NULL,
                    sequence INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (rolling_story_id) REFERENCES rolling_stories(id) ON DELETE CASCADE
                )
            """)
            print("✓ Created story_paragraphs table")

        # Check if story_bible table already exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='story_bible'")
        if cursor.fetchone():
            print("✓ story_bible table already exists")
        else:
            print("Creating story_bible table...")
            cursor.execute("""
                CREATE TABLE story_bible (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    rolling_story_id INTEGER NOT NULL,
                    category TEXT NOT NULL CHECK (category IN ('character', 'setting', 'object')),
                    name TEXT NOT NULL,
                    details TEXT NOT NULL DEFAULT '{}',
                    introduced_at INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (rolling_story_id) REFERENCES rolling_stories(id) ON DELETE CASCADE
                )
            """)
            print("✓ Created story_bible table")

        # Check if story_events table already exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='story_events'")
        if cursor.fetchone():
            print("✓ story_events table already exists")
        else:
            print("Creating story_events table...")
            cursor.execute("""
                CREATE TABLE story_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    rolling_story_id INTEGER NOT NULL,
                    paragraph_sequence INTEGER NOT NULL,
                    event_type TEXT NOT NULL
                        CHECK (event_type IN ('key_event', 'decision', 'consequence', 'unresolved', 'user_choice')),
                    summary TEXT NOT NULL,
                    resolved INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (rolling_story_id) REFERENCES rolling_stories(id) ON DELETE CASCADE
                )
            """)
            print("✓ Created story_events table")

        # Create indexes for better query performance
        indexes = [
            ("idx_rolling_stories_user_id", "rolling_stories(user_id)"),
            ("idx_rolling_stories_scenario_id", "rolling_stories(scenario_id)"),
            ("idx_rolling_stories_status", "rolling_stories(status)"),
            ("idx_story_paragraphs_rolling_story_id", "story_paragraphs(rolling_story_id)"),
            ("idx_story_paragraphs_sequence", "story_paragraphs(rolling_story_id, sequence)"),
            ("idx_story_bible_rolling_story_id", "story_bible(rolling_story_id)"),
            ("idx_story_bible_category", "story_bible(rolling_story_id, category)"),
            ("idx_story_events_rolling_story_id", "story_events(rolling_story_id)"),
            ("idx_story_events_type", "story_events(rolling_story_id, event_type)"),
        ]

        for index_name, index_def in indexes:
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='index' AND name='{index_name}'")
            if cursor.fetchone():
                print(f"✓ Index {index_name} already exists")
            else:
                print(f"Creating index {index_name}...")
                cursor.execute(f"CREATE INDEX {index_name} ON {index_def}")
                print(f"✓ Created index {index_name}")

        conn.commit()
        print("\n🎉 Migration completed successfully!")

        # Show summary
        print("\nCreated tables:")
        for table in ['rolling_stories', 'story_paragraphs', 'story_bible', 'story_events']:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"  {table}: {count} rows")

    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    print("Running migration 005: Add Rolling Stories tables")
    run_migration()
