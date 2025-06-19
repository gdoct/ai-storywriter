#!/usr/bin/env python3
"""
Standalone script to reset a user's password.

Usage: python reset_password.py <email> <new_password>
Example: python reset_password.py user@test.org password123
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the Python path so we can import modules
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from data.repositories import UserRepository
from services.security_utils import hash_password


def reset_password(email: str, new_password: str) -> bool:
    """
    Reset a user's password.
    
    Args:
        email: The user's email address
        new_password: The new password to set
        
    Returns:
        True if password was reset successfully, False otherwise
    """
    try:
        # Check if user exists
        user = UserRepository.get_user_by_email(email)
        if not user:
            print(f"Error: User with email '{email}' not found.")
            return False
        
        # Hash the new password
        password_hash = hash_password(new_password)
        
        # Update the password
        UserRepository.update_user_password(user['id'], password_hash)
        
        print(f"Password successfully reset for user '{email}' (username: {user['username']})")
        return True
        
    except Exception as e:
        print(f"Error resetting password: {str(e)}")
        return False


def main():
    """Main function to handle command line arguments."""
    if len(sys.argv) != 3:
        print("Usage: python reset_password.py <email> <new_password>")
        print("Example: python reset_password.py user@test.org password123")
        sys.exit(1)
    
    email = sys.argv[1]
    new_password = sys.argv[2]
    
    # Validate inputs
    if not email or '@' not in email:
        print("Error: Please provide a valid email address.")
        sys.exit(1)
    
    if len(new_password) < 8:
        print("Error: Password must be at least 8 characters long.")
        sys.exit(1)
    
    # Reset the password
    success = reset_password(email, new_password)
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
