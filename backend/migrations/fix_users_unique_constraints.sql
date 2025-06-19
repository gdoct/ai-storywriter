-- Migration: Remove unique constraint from username and add unique constraint to email
-- Date: 2025-06-18
-- Description: Remove UNIQUE constraint from username field and add UNIQUE constraint to email field

-- Step 1: Create new table with corrected constraints
CREATE TABLE users_new (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    is_deleted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    terms_agreed_at TEXT,
    privacy_agreed_at TEXT,
    terms_version TEXT DEFAULT '1.0',
    privacy_version TEXT DEFAULT '1.0',
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'byok', 'premium')),
    api_key_encrypted TEXT,
    api_provider TEXT DEFAULT 'openai' CHECK (api_provider IN ('openai', 'anthropic', 'google'))
);

-- Step 2: Copy data from old table to new table
INSERT INTO users_new SELECT * FROM users;

-- Step 3: Drop old table
DROP TABLE users;

-- Step 4: Rename new table to original name
ALTER TABLE users_new RENAME TO users;
