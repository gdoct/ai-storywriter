"""
Simple test script to verify our role system works correctly
"""
import os
import sys

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from data.repositories import UserRepository
from services.role_manager import RoleManager


def test_user_and_roles():
    print("=== StoryWriter Role System Test ===")
    
    # Test 1: Get a user
    print("\n1. Testing user retrieval...")
    user = UserRepository.get_user_by_username("Guido Docter")
    if user:
        print(f"✅ User found: {user['username']} (ID: {user['id']})")
        print(f"   Email: {user['email']}")
        print(f"   Tier: {user['tier']}")
        
        # Test 2: Get user roles
        print(f"\n2. Testing role retrieval...")
        roles = RoleManager.get_user_roles(user['id'])
        print(f"✅ User roles: {roles}")
        
        # Test 3: Get user permissions  
        print(f"\n3. Testing permission retrieval...")
        permissions = RoleManager.get_user_permissions(user['id'])
        print(f"✅ User permissions: {permissions}")
        
        # Test 4: Test role checking
        print(f"\n4. Testing role checks...")
        is_admin = RoleManager.has_role(user['id'], 'admin')
        is_moderator = RoleManager.has_role(user['id'], 'moderator')
        print(f"✅ Is admin: {is_admin}")
        print(f"✅ Is moderator: {is_moderator}")
        
        # Test 5: Test permission checking
        print(f"\n5. Testing permission checks...")
        can_manage_users = RoleManager.has_permission(user['id'], 'manage_users')
        can_moderate = RoleManager.has_permission(user['id'], 'moderate_content')
        print(f"✅ Can manage users: {can_manage_users}")
        print(f"✅ Can moderate content: {can_moderate}")
        
        return user
    else:
        print("❌ User not found")
        return None

if __name__ == '__main__':
    test_user_and_roles()
