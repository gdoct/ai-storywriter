-- Migration: Add Google OAuth support to users table
-- Date: 2025-09-10
-- Description: Adds Google OAuth authentication columns to the users table

-- Add new columns to the users table for Google OAuth support
ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local' CHECK (auth_provider IN ('local', 'google'));
ALTER TABLE users ADD COLUMN google_id TEXT;  
ALTER TABLE users ADD COLUMN profile_picture TEXT;

-- Update existing users to have 'local' as auth_provider (should already be default, but ensuring consistency)
UPDATE users SET auth_provider = 'local' WHERE auth_provider IS NULL;

-- Create index for faster Google ID lookups (unique constraint will be handled at application level)
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);

-- Create unique index for google_id (this achieves the same effect as UNIQUE constraint)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id_unique ON users(google_id) WHERE google_id IS NOT NULL;