"""
Database migration to add user tier support
"""
import os
import sqlite3
from db_config import DB_PATH

def migrate_user_tiers():
    """Add tier support to the existing database"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        # Add tier-related columns to users table
        c.execute('''
            ALTER TABLE users ADD COLUMN tier TEXT DEFAULT 'free' 
            CHECK (tier IN ('free', 'byok', 'premium'))
        ''')
        print("Added tier column to users table")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Tier column already exists")
        else:
            raise e
    
    try:
        # Remove credits column from users table
        c.execute('''
            ALTER TABLE users DROP COLUMN credits
        ''') # This might not be supported in all SQLite versions directly, may need to recreate table
        print("Removed credits column from users table (if it existed and was supported)")
    except sqlite3.OperationalError as e:
        # Handle cases where column doesn't exist or DROP COLUMN is not supported
        print(f"Could not remove credits column: {e}")

    try:
        c.execute('''
            ALTER TABLE users ADD COLUMN api_key_encrypted TEXT
        ''')
        print("Added api_key_encrypted column to users table")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("API key encrypted column already exists")
        else:
            raise e
    
    try:
        c.execute('''
            ALTER TABLE users ADD COLUMN api_provider TEXT DEFAULT 'openai'
            CHECK (api_provider IN ('openai', 'anthropic', 'google'))
        ''')
        print("Added api_provider column to users table")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("API provider column already exists")
        else:
            raise e
    
    # Create credit_transactions table
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
    print("Created credit_transactions table")

    # Create credit usage tracking table
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
    print("Created credit_usage table")
    
    # Create rate limiting table
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
    print("Created rate_limits table")
    
    # Create indexes for performance
    c.execute('CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_credit_usage_user_id ON credit_usage(user_id)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_rate_limits_user_feature ON rate_limits(user_id, feature)')
    print("Created database indexes")
    
    conn.commit()
    conn.close()
    print("User tier migration completed successfully")

if __name__ == "__main__":
    migrate_user_tiers()
