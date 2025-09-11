#!/usr/bin/env python3
import sqlite3

# Connect to the database
conn = sqlite3.connect('storywriter.db')
conn.row_factory = sqlite3.Row  # This enables column access by name
cursor = conn.cursor()

print("=== Checking Google OAuth linking status ===\n")

# Get all users with their Google linking status
cursor.execute("""
    SELECT id, username, email, auth_provider, google_id, profile_picture 
    FROM users 
    WHERE is_deleted = 0 
    ORDER BY created_at DESC
""")

users = cursor.fetchall()

for user in users:
    print(f"User: {user['username']} ({user['email']})")
    print(f"  ID: {user['id']}")
    print(f"  Auth Provider: {user['auth_provider']}")
    print(f"  Google ID: {user['google_id'] or 'Not linked'}")
    print(f"  Profile Picture: {user['profile_picture'] or 'None'}")
    print()

conn.close()