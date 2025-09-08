#!/usr/bin/env python3
"""
Initialize StoryWriter Role System
Creates the first admin user for bootstrapping the role system.
"""

import os
import sys

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from data.repositories import UserRepository
from services.role_manager import RoleManager


def initialize_admin_user():
    """Initialize the first admin user"""
    print("StoryWriter Role System Initialization")
    print("=" * 40)
    
    # Check if there are any existing admin users
    existing_admins = RoleManager.list_users_with_role('admin')
    if existing_admins:
        print(f"Found {len(existing_admins)} existing admin user(s):")
        for admin in existing_admins:
            print(f"  - {admin['username']} (ID: {admin['user_id']})")
        print("\nAdmin users already exist. No initialization needed.")
        return
    
    print("No admin users found. Let's create the first admin user.")
    print()
    
    # Get admin username from user
    while True:
        admin_username = input("Enter the username of the user to make admin: ").strip()
        if admin_username:
            break
        print("Username cannot be empty.")
    
    # Find the user
    user = UserRepository.get_user_by_username(admin_username)
    if not user:
        print(f"Error: User '{admin_username}' not found.")
        print("Please make sure the user has already registered an account.")
        return
    
    # Grant admin role
    success = RoleManager.grant_role(user['id'], 'admin', user['id'])
    
    if success:
        print(f"\n✅ Admin role successfully granted to user '{admin_username}'")
        print(f"User ID: {user['id']}")
        print(f"Email: {user['email'] if user['email'] else 'N/A'}")
        print(f"Tier: {user['tier'] if user['tier'] else 'free'}")
        
        # Verify the role was granted
        user_roles = RoleManager.get_user_roles(user['id'])
        print(f"Current roles: {user_roles}")
        
    else:
        print(f"\n❌ Failed to grant admin role to user '{admin_username}'")
        print("Please check the logs for more information.")

def list_all_roles():
    """List all users with administrative roles"""
    print("\nCurrent Administrative Roles:")
    print("-" * 30)
    
    # List admins
    admins = RoleManager.list_users_with_role('admin')
    print(f"\nAdmins ({len(admins)}):")
    if admins:
        for admin in admins:
            print(f"  - {admin['username']} (ID: {admin['user_id']})")
    else:
        print("  None")
    
    # List moderators
    moderators = RoleManager.list_users_with_role('moderator')
    print(f"\nModerators ({len(moderators)}):")
    if moderators:
        for mod in moderators:
            print(f"  - {mod['username']} (ID: {mod['user_id']})")
    else:
        print("  None")

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--list':
        list_all_roles()
    else:
        initialize_admin_user()
        list_all_roles()
