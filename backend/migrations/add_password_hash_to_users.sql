-- Migration: Add password_hash field to users table
-- Date: 2025-06-18
-- Description: Add password_hash field to store user passwords securely

ALTER TABLE users ADD COLUMN password_hash TEXT;
