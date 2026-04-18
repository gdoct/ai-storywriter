#!/usr/bin/env python3
"""
Migration 009: Create long_stories and long_story_chapters tables

Long Story is a new agent that generates complete, chapter-based stories:
  1. Synopsis (overview of the whole story)
  2. Story arc (chapter titles + one-liners as JSON)
  3. Per-chapter: storyline (setup/main_event/conclusion) then streamed prose

Tables:
  long_stories          - main story record
  long_story_chapters   - one row per chapter, tracks generation status
"""

import sqlite3
from pathlib import Path


def get_db_path():
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
    db_path = get_db_path()
    print(f"Using database: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # ── long_stories ─────────────────────────────────────────────────────────
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='long_stories'")
        if cursor.fetchone():
            print("✓ long_stories table already exists")
        else:
            print("Creating long_stories table...")
            cursor.execute("""
                CREATE TABLE long_stories (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id     TEXT    NOT NULL,
                    scenario_id TEXT    NOT NULL,
                    title       TEXT    NOT NULL,
                    status      TEXT    NOT NULL DEFAULT 'draft',
                    synopsis    TEXT,
                    story_arc   TEXT,
                    created_at  TEXT    NOT NULL,
                    updated_at  TEXT    NOT NULL
                )
            """)
            print("✓ Created long_stories table")

        # ── long_story_chapters ───────────────────────────────────────────────────
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='long_story_chapters'")
        if cursor.fetchone():
            print("✓ long_story_chapters table already exists")
        else:
            print("Creating long_story_chapters table...")
            cursor.execute("""
                CREATE TABLE long_story_chapters (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    long_story_id   INTEGER NOT NULL REFERENCES long_stories(id) ON DELETE CASCADE,
                    chapter_number  INTEGER NOT NULL,
                    title           TEXT    NOT NULL,
                    one_liner       TEXT,
                    storyline       TEXT,
                    content         TEXT,
                    status          TEXT    NOT NULL DEFAULT 'pending',
                    created_at      TEXT    NOT NULL,
                    updated_at      TEXT    NOT NULL
                )
            """)
            print("✓ Created long_story_chapters table")

        conn.commit()
        print("\n Migration 009 completed successfully!")

    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    print("Running migration 009: Create long story tables")
    run_migration()
