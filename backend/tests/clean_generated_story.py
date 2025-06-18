#!/usr/bin/env python3
"""
Script to clean up any generatedStory fields from scenario jsondata
"""
import json
import sqlite3
from pathlib import Path

from data.db_config import get_db_path


def clean_generated_story_from_scenarios():
    """Remove generatedStory field from all scenarios in the database"""
    
    # Get the database path
    db_path = get_db_path()
    
    if not Path(db_path).exists():
        print(f"Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    try:
        # Get all scenarios
        scenarios = conn.execute("SELECT id, jsondata FROM scenarios").fetchall()
        
        updated_count = 0
        for scenario in scenarios:
            try:
                jsondata = json.loads(scenario['jsondata'])
                
                # Check if generatedStory exists and remove it
                if 'generatedStory' in jsondata:
                    print(f"Removing generatedStory from scenario {scenario['id']}")
                    del jsondata['generatedStory']
                    
                    # Update the scenario
                    conn.execute(
                        "UPDATE scenarios SET jsondata = ? WHERE id = ?",
                        (json.dumps(jsondata), scenario['id'])
                    )
                    updated_count += 1
                    
            except json.JSONDecodeError:
                print(f"Warning: Could not parse JSON for scenario {scenario['id']}")
                continue
        
        conn.commit()
        print(f"Updated {updated_count} scenarios")
        
    finally:
        conn.close()

if __name__ == "__main__":
    clean_generated_story_from_scenarios()
