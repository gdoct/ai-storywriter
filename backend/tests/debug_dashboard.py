#!/usr/bin/env python3
"""Debug script for dashboard endpoint issues"""

import json
from infrastructure.database.db import get_db_connection
from infrastructure.database.repositories import UserRepository
from domain.services.role_manager import RoleManager

def test_dashboard_query():
    """Test the dashboard query that's failing"""
    
    # Get a test user
    conn = get_db_connection()
    user_row = conn.execute("SELECT * FROM users LIMIT 1").fetchone()
    if not user_row:
        print("❌ No users found in database")
        return
    
    user_id = user_row['id']
    print(f"📧 Testing with user: {user_row['username']} (ID: {user_id})")
    
    try:
        # Test the exact query from dashboard router
        print("\n🔍 Testing recent stories query...")
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
        
        print(f"✅ Query successful: found {len(stories_data)} stories")
        
        for i, row in enumerate(stories_data):
            print(f"  Story {i+1}: ID={row['id']}, Scenario={row['scenario_id']}")
            if row['scenario_json']:
                try:
                    scenario_data = json.loads(row['scenario_json'])
                    print(f"    Scenario title: {scenario_data.get('title', 'Untitled')}")
                except json.JSONDecodeError as e:
                    print(f"    ⚠️ JSON decode error: {e}")
        
        # Test auth middleware user object
        print(f"\n🔐 Testing auth user object...")
        user = UserRepository.get_user_by_username_with_roles(user_row['username'])
        if user:
            print(f"✅ User object retrieved: {user.keys()}")
            
            # Add permissions
            user_permissions = RoleManager.get_user_permissions(user['id'])
            user['permissions'] = user_permissions
            user['user_id'] = user['id']
            
            print(f"✅ Auth object ready: id={user.get('id')}, user_id={user.get('user_id')}")
            print(f"   Roles: {user.get('roles', [])}")
            print(f"   Permissions: {user.get('permissions', [])}")
        else:
            print("❌ Failed to get user with roles")
            
    except Exception as e:
        print(f"❌ Query failed with error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        conn.close()

if __name__ == "__main__":
    test_dashboard_query()