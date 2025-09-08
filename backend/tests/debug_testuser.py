#!/usr/bin/env python3
"""Debug script for testuser dashboard issues"""

import json
from infrastructure.database.db import get_db_connection
from infrastructure.database.repositories import UserRepository

def test_testuser():
    """Test the testuser dashboard query"""
    
    # Get the testuser
    conn = get_db_connection()
    user_row = conn.execute("SELECT * FROM users WHERE username = ?", ("Hildegarde Jones",)).fetchone()
    if not user_row:
        print("❌ Testuser 'Hildegarde Jones' not found in database")
        return
    
    user_id = user_row['id']
    print(f"📧 Testing with testuser: {user_row['username']} (ID: {user_id})")
    
    try:
        # Check scenarios
        print("\n🔍 Checking scenarios...")
        scenarios = conn.execute(
            "SELECT id, title, created_at FROM scenarios WHERE user_id = ? AND is_deleted = 0",
            (user_id,)
        ).fetchall()
        print(f"   Found {len(scenarios)} scenarios")
        for scenario in scenarios:
            print(f"     - {scenario['title']} (ID: {scenario['id']})")
        
        # Check stories
        print("\n📖 Checking stories...")
        stories = conn.execute(
            '''SELECT st.id, st.scenario_id, s.title as scenario_title, st.created_at
               FROM stories st
               JOIN scenarios s ON st.scenario_id = s.id
               WHERE s.user_id = ? AND s.is_deleted = 0''',
            (user_id,)
        ).fetchall()
        print(f"   Found {len(stories)} stories")
        for story in stories:
            print(f"     - Story {story['id']} for scenario '{story['scenario_title']}'")
        
        # Test the exact dashboard query
        print("\n🔍 Testing dashboard query...")
        stories_data = conn.execute(
            '''SELECT st.id, st.scenario_id, st.text, st.created_at,
                      LENGTH(st.text) as word_count,
                      SUBSTR(st.text, 1, 100) as preview,
                      COUNT(*) OVER() as total_count,
                      CASE WHEN ms.id IS NOT NULL THEN 1 ELSE 0 END as is_published,
                      st.scenario_json as scenario_json
               FROM stories st
               JOIN scenarios s ON st.scenario_id = s.id
               LEFT JOIN market_stories ms ON st.id = ms.original_story_id
               WHERE s.user_id = ? AND s.is_deleted = 0
               ORDER BY st.created_at DESC
               LIMIT ? OFFSET ?''',
            (user_id, 4, 0)
        ).fetchall()
        
        print(f"✅ Dashboard query result: {len(stories_data)} stories")
        
    except Exception as e:
        print(f"❌ Query failed with error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        conn.close()

if __name__ == "__main__":
    test_testuser()