import os
import sqlite3
import sys
from db_config import DB_PATH

def get_stories_for_scenario(scenario_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    print(f"Looking for stories with scenario_id = {scenario_id}")
    
    # Check if the scenario exists
    c.execute("SELECT * FROM scenarios WHERE id = ?", (scenario_id,))
    scenario = c.fetchone()
    
    if not scenario:
        print(f"No scenario found with ID {scenario_id}")
        conn.close()
        return
    
    print(f"Found scenario: {scenario['title']}")
    
    # Get stories for this scenario
    c.execute("SELECT * FROM stories WHERE scenario_id = ? ORDER BY created_at DESC", (scenario_id,))
    stories = c.fetchall()
    
    if not stories:
        print(f"No stories found for scenario {scenario_id}")
    else:
        print(f"Found {len(stories)} stories:")
        for story in stories:
            print(f" - ID: {story['id']}")
            print(f"   Created: {story['created_at']}")
            print(f"   Text preview: {story['text'][:50]}...")
            print()
    
    conn.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        scenario_id = sys.argv[1]
        get_stories_for_scenario(scenario_id)
    else:
        print("Please provide a scenario ID as argument")
