import os
import sqlite3
from db_config import DB_PATH

def check_schema():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Get all tables
    c.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = c.fetchall()
    print("Tables in database:")
    for table in tables:
        print(f" - {table['name']}")
    
    # Check stories table schema
    c.execute("PRAGMA table_info(stories)")
    columns = c.fetchall()
    print("\nStories table schema:")
    for col in columns:
        print(f" - {col['name']} ({col['type']})")
    
    # Check if any stories exist
    c.execute("SELECT COUNT(*) as count FROM stories")
    count = c.fetchone()['count']
    print(f"\nTotal stories in database: {count}")
    
    if count > 0:
        # Print a few examples
        c.execute("SELECT * FROM stories LIMIT 3")
        stories = c.fetchall()
        print("\nSample stories:")
        for story in stories:
            print(f" - ID: {story['id']}, Scenario ID: {story['scenario_id']}, Created: {story['created_at']}")
            print(f"   Text preview: {story['text'][:50]}...")
    
    conn.close()

if __name__ == "__main__":
    check_schema()
