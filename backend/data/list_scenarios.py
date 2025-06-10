import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), 'storywriter.db')

def list_scenarios():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute("SELECT id, title FROM scenarios WHERE is_deleted = 0")
    scenarios = c.fetchall()
    
    if not scenarios:
        print("No scenarios found in database")
    else:
        print(f"Found {len(scenarios)} scenarios:")
        for scenario in scenarios:
            print(f" - ID: {scenario['id']}")
            print(f"   Title: {scenario['title']}")
            print()
    
    conn.close()

if __name__ == "__main__":
    list_scenarios()
