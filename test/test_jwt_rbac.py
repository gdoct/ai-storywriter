#!/usr/bin/env python3
"""
Test script to check JWT token processing and role-based access control
"""
import json
import os
import sys

import requests

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

BASE_URL = 'http://localhost:5000'

def test_login_and_roles():
    """Test login and role-based endpoints"""
    print("🧪 Testing JWT Token Processing and RBAC")
    
    # Test 1: Login to get JWT token
    print("\n1. Testing login...")
    login_data = {
        'email': 'guido.docter@gmail.com'
    }
    
    try:
        response = requests.post(f'{BASE_URL}/api/login', json=login_data, timeout=5)
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print(f"✅ Login successful, got token: {token[:20]}...")
            
            # Test 2: Access protected endpoint with JWT
            print("\n2. Testing role-protected endpoint...")
            headers = {'Authorization': f'Bearer {token}'}
            
            # Test admin endpoint
            response = requests.get(f'{BASE_URL}/api/admin/roles/users/9213cdfb-145d-4524-bb0f-094c63762088', 
                                    headers=headers, timeout=5)
            
            if response.status_code == 200:
                print("✅ Role-protected endpoint accessible")
                data = response.json()
                print(f"   User roles: {data.get('active_roles', [])}")
            else:
                print(f"❌ Role endpoint failed: {response.status_code}")
                print(f"   Response: {response.text}")
                
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Is it running on localhost:5000?")
        print("   Start the backend with: ./start-backend.sh")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

if __name__ == '__main__':
    test_login_and_roles()
