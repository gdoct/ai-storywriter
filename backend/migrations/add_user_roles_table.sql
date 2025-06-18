-- Migration: Add user_roles table for role-based access control
-- Date: 2025-06-18
-- Description: Creates user_roles table to support administrative roles (moderator, admin)

-- Create the user_roles table
CREATE TABLE user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('moderator', 'admin')),
    granted_by TEXT NOT NULL,
    granted_at TEXT DEFAULT CURRENT_TIMESTAMP,
    revoked_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(granted_by) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_active ON user_roles(user_id, role) WHERE revoked_at IS NULL;

-- Add composite unique constraint to prevent duplicate active role assignments
CREATE UNIQUE INDEX idx_user_roles_unique_active ON user_roles(user_id, role) WHERE revoked_at IS NULL;
