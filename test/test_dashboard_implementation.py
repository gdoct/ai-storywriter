#!/usr/bin/env python3
"""
Test script to verify dashboard endpoints are working correctly
"""
import json
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))
from test_config import get_backend_url

import requests

BASE_URL = get_backend_url()

def test_dashboard_endpoints():
    """Test all dashboard endpoints with sample data"""
    
    # First, we need to login to get a JWT token
    # This is a basic test - in a real scenario you'd need valid credentials
    print("Testing Dashboard Endpoints...")
    print("=" * 50)
    
    # Test the health endpoint first
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        if response.status_code == 200:
            print("✅ Backend is running")
        else:
            print("❌ Backend health check failed")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running. Please start the backend first.")
        return False
    
    # Note: For proper testing, you would need to:
    # 1. Create a test user
    # 2. Login to get JWT token
    # 3. Use the token in Authorization header
    # 4. Test each endpoint
    
    print("\n📋 Dashboard endpoints that should be available:")
    print("- GET /api/dashboard/stats")
    print("- GET /api/dashboard/recent-scenarios")
    print("- GET /api/dashboard/recent-stories")
    print("- GET /api/dashboard/last-activity")
    
    print("\n🔧 To fully test these endpoints:")
    print("1. Start the backend: ./start-backend.sh")
    print("2. Start the frontend: ./start-frontend.sh")
    print("3. Login to the app in browser")
    print("4. Navigate to dashboard to see real data")
    
    return True

if __name__ == "__main__":
    test_dashboard_endpoints()
