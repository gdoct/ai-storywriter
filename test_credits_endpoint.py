#!/usr/bin/env python3
"""
Simple test script to verify the credits endpoint functionality.
This script adds some test credit transactions and then tests the credits endpoint.
"""

import sqlite3
import sys
import uuid
from datetime import datetime, timezone

import requests

# Configuration
BASE_URL = "http://localhost:5000"
TEST_USERNAME = "testuser"
TEST_PASSWORD = "testpassword"

def get_db_connection():
    """Get database connection using the standard path"""
    import os

    # Use the standard path: [solution-root]/backend/storywriter.db
    script_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(script_dir, 'backend', 'storywriter.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def add_test_credit_transactions(user_id):
    """Add some test credit transactions for the user"""
    conn = get_db_connection()
    
    transactions = [
        ('purchase', 100, 'Initial credit purchase'),
        ('usage', -20, 'Used for story generation'),
        ('usage', -5, 'Used for AI summary'),
        ('purchase', 50, 'Bonus credits'),
        ('usage', -10, 'Used for character generation'),
    ]
    
    for transaction_type, amount, description in transactions:
        transaction_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        conn.execute('''INSERT INTO credit_transactions
                        (id, user_id, transaction_type, amount, description, created_at)
                        VALUES (?, ?, ?, ?, ?, ?)''',
                     (transaction_id, user_id, transaction_type, amount, description, now))
    
    conn.commit()
    conn.close()
    print(f"Added {len(transactions)} test credit transactions for user {user_id}")

def login_and_get_token():
    """Login and get JWT token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": TEST_USERNAME,
        "password": TEST_PASSWORD
    })
    
    if response.status_code == 200:
        token = response.json().get('access_token')
        print(f"Successfully logged in as {TEST_USERNAME}")
        return token
    else:
        print(f"Login failed: {response.status_code} - {response.text}")
        return None

def test_credits_endpoint(token):
    """Test the credits endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test first call (should not be cached)
    response = requests.get(f"{BASE_URL}/api/marketplace/user/credits", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"Credits endpoint response: {data}")
        print(f"User has {data['credits']} credits (cached: {data['cached']})")
        
        # Test second call (should be cached)
        response2 = requests.get(f"{BASE_URL}/api/marketplace/user/credits", headers=headers)
        if response2.status_code == 200:
            data2 = response2.json()
            print(f"Second call - Credits: {data2['credits']} (cached: {data2['cached']})")
        
        return True
    else:
        print(f"Credits endpoint failed: {response.status_code} - {response.text}")
        return False

def get_user_id_by_username(username):
    """Get user ID from username"""
    conn = get_db_connection()
    user = conn.execute('SELECT id FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()
    return user['id'] if user else None

def main():
    print("Testing credits endpoint...")
    
    # Get user ID
    user_id = get_user_id_by_username(TEST_USERNAME)
    if not user_id:
        print(f"User {TEST_USERNAME} not found in database. Please create the user first.")
        return False
    
    print(f"Found user {TEST_USERNAME} with ID: {user_id}")
    
    # Add test credit transactions
    add_test_credit_transactions(user_id)
    
    # Login and get token
    token = login_and_get_token()
    if not token:
        return False
    
    # Test credits endpoint
    success = test_credits_endpoint(token)
    
    if success:
        print("✅ Credits endpoint test passed!")
        return True
    else:
        print("❌ Credits endpoint test failed!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
