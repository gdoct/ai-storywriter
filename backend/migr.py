import sqlite3

def column_exists(conn, table_name, column_name):
    """Check if a column exists in a table"""
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [column[1] for column in cursor.fetchall()]
    return column_name in columns

def main():
    conn = sqlite3.connect('storywriter.db')
    cursor = conn.cursor()
    
    try:
        print("Adding Google OAuth support to users table...")
        
        # Add auth_provider column if it doesn't exist
        if not column_exists(conn, 'users', 'auth_provider'):
            print("Adding auth_provider column...")
            cursor.execute("ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local' CHECK (auth_provider IN ('local', 'google'))")
        else:
            print("auth_provider column already exists")
            
        # Add google_id column if it doesn't exist
        if not column_exists(conn, 'users', 'google_id'):
            print("Adding google_id column...")
            cursor.execute("ALTER TABLE users ADD COLUMN google_id TEXT")
        else:
            print("google_id column already exists")
            
        # Add profile_picture column if it doesn't exist
        if not column_exists(conn, 'users', 'profile_picture'):
            print("Adding profile_picture column...")
            cursor.execute("ALTER TABLE users ADD COLUMN profile_picture TEXT")
        else:
            print("profile_picture column already exists")
        
        # Update existing users to have 'local' as auth_provider
        print("Updating existing users to have 'local' auth_provider...")
        cursor.execute("UPDATE users SET auth_provider = 'local' WHERE auth_provider IS NULL OR auth_provider = ''")
        
        # Create indexes
        print("Creating indexes...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider)")
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id_unique ON users(google_id) WHERE google_id IS NOT NULL")
        
        conn.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    main()
