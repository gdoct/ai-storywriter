#!/usr/bin/env python3
"""
Migration script to add marketplace tables for the Story Marketplace feature.
This script adds the necessary tables for publishing stories to the marketplace,
rating, and donations.
"""

import os
import sqlite3
from datetime import datetime

DB_PATH = os.environ.get('STORYWRITER_DB_PATH', os.path.join(os.path.dirname(__file__), 'storywriter.db'))

def run_migration():
    """Add marketplace tables to the database"""
    print("Starting marketplace migration...")
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Create market_stories table
    c.execute('''
        CREATE TABLE IF NOT EXISTS market_stories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_story_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            ai_summary TEXT,
            ai_genres TEXT, -- JSON array of genres
            total_downloads INTEGER DEFAULT 0,
            average_rating REAL DEFAULT 0.0,
            rating_count INTEGER DEFAULT 0,
            total_donated_credits INTEGER DEFAULT 0,
            published_at TEXT DEFAULT CURRENT_TIMESTAMP,
            created_at_original TEXT,
            updated_at_original TEXT,
            is_staff_pick INTEGER DEFAULT 0,
            FOREIGN KEY(original_story_id) REFERENCES stories(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    print("Created market_stories table")
    
    # Create market_story_ratings table
    c.execute('''
        CREATE TABLE IF NOT EXISTS market_story_ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            market_story_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            rated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(market_story_id) REFERENCES market_stories(id),
            FOREIGN KEY(user_id) REFERENCES users(id),
            UNIQUE(market_story_id, user_id)
        )
    ''')
    print("Created market_story_ratings table")
    
    # Create market_story_donations table
    c.execute('''
        CREATE TABLE IF NOT EXISTS market_story_donations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            market_story_id INTEGER NOT NULL,
            donor_user_id TEXT NOT NULL,
            recipient_user_id TEXT NOT NULL,
            credits_donated INTEGER NOT NULL,
            donated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(market_story_id) REFERENCES market_stories(id),
            FOREIGN KEY(donor_user_id) REFERENCES users(id),
            FOREIGN KEY(recipient_user_id) REFERENCES users(id)
        )
    ''')
    print("Created market_story_donations table")
    
    # Create indexes for performance
    c.execute('CREATE INDEX IF NOT EXISTS idx_market_stories_user_id ON market_stories(user_id)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_market_stories_published_at ON market_stories(published_at)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_market_stories_average_rating ON market_stories(average_rating)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_market_stories_total_downloads ON market_stories(total_downloads)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_market_story_ratings_market_story_id ON market_story_ratings(market_story_id)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_market_story_donations_market_story_id ON market_story_donations(market_story_id)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_market_story_donations_recipient ON market_story_donations(recipient_user_id)')
    print("Created database indexes")
    
    conn.commit()
    conn.close()
    print("Marketplace migration completed successfully!")

if __name__ == "__main__":
    run_migration()
