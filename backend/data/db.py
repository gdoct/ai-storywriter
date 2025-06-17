import os
import sqlite3
import uuid
from datetime import datetime

from .db_config import DB_PATH, get_db_path


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    # Users table - using TEXT for ID
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT,
            is_deleted INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            terms_agreed_at TEXT,
            privacy_agreed_at TEXT,
            terms_version TEXT DEFAULT '1.0',
            privacy_version TEXT DEFAULT '1.0',
            tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'byok', 'premium')),
            api_key_encrypted TEXT,
            api_provider TEXT DEFAULT 'openai' CHECK (api_provider IN ('openai', 'anthropic', 'google'))
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
            updated_at TEXT,
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
    
    # Marketplace tables
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
    
    # Credit system tables
    c.execute('''
        CREATE TABLE IF NOT EXISTS credit_transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            transaction_type TEXT NOT NULL, -- 'purchase', 'usage', 'refund', 'checkpoint'
            amount INTEGER NOT NULL,
            description TEXT,
            related_entity_id TEXT, -- Optional: ID of related entity, e.g., purchase_id, story_id
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            checkpoint_balance INTEGER, -- For 'checkpoint' type transactions
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS credit_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            feature TEXT NOT NULL,
            model TEXT,
            credits_used INTEGER NOT NULL,
            credits_remaining INTEGER NOT NULL,
            request_tokens INTEGER,
            response_tokens INTEGER,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS rate_limits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            feature TEXT NOT NULL,
            count INTEGER DEFAULT 0,
            window_start TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id),
            UNIQUE(user_id, feature, window_start)
        )
    ''')
    
    # Character photos table
    c.execute('''
        CREATE TABLE IF NOT EXISTS character_photos (
            id TEXT PRIMARY KEY,
            character_id TEXT NOT NULL,
            scenario_id TEXT,
            user_id TEXT NOT NULL,
            file_path TEXT NOT NULL,
            original_filename TEXT,
            file_size INTEGER,
            mime_type TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(scenario_id) REFERENCES scenarios(id)
        )
    ''')
    
    # Add indexes to match actual database
    c.execute('CREATE INDEX IF NOT EXISTS idx_market_stories_user_id ON market_stories(user_id)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_market_stories_published_at ON market_stories(published_at)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_market_stories_average_rating ON market_stories(average_rating)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_market_stories_total_downloads ON market_stories(total_downloads)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_market_story_ratings_market_story_id ON market_story_ratings(market_story_id)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_market_story_donations_market_story_id ON market_story_donations(market_story_id)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_market_story_donations_recipient ON market_story_donations(recipient_user_id)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_credit_usage_user_id ON credit_usage(user_id)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_rate_limits_user_feature ON rate_limits(user_id, feature)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_character_photos_character_id ON character_photos(character_id)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_character_photos_scenario_id ON character_photos(scenario_id)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_character_photos_user_id ON character_photos(user_id)')
    
    conn.commit()
    conn.close()
