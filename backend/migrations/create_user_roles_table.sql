-- SQL script to create the user_roles table

CREATE TABLE user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    granted_by TEXT NOT NULL,
    granted_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP
);
