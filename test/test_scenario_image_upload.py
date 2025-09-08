#!/usr/bin/env python3
"""
Test script for the scenario image upload feature.
This script tests the basic functionality without requiring a full frontend.
"""

import json
import os
from io import BytesIO
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))
from test_config import get_backend_url

import requests
from PIL import Image

# Test configuration
BASE_URL = get_backend_url()
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "password123"

def create_test_image():
    """Create a simple test image in memory."""
    # Create a simple colored rectangle
    img = Image.new('RGB', (400, 300), color='lightblue')
    
    # Save to BytesIO
    img_bytes = BytesIO()
    img.save(img_bytes, format='JPEG', quality=85)
    img_bytes.seek(0)
    
    return img_bytes

def test_scenario_image_upload():
    """Test the scenario image upload endpoint."""
    print("Testing scenario image upload feature...")
    
    # Step 1: Login to get a token
    login_data = {
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    }
    
    try:
        login_response = requests.post(f"{BASE_URL}/api/login", json=login_data)
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.status_code} - {login_response.text}")
            print("Please ensure you have a test user or update the credentials in this script.")
            return False
        
        token = login_response.json().get('access_token')
        if not token:
            print("No access token received")
            return False
        
        print("✅ Login successful")
        
        # Step 2: Create a test scenario first
        scenario_data = {
            "title": "Test Scenario for Image Upload",
            "synopsis": "A test scenario to verify image upload functionality",
            "userId": "test-user",
            "writingStyle": {
                "style": "Narrative",
                "genre": "Fantasy"
            }
        }
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        scenario_response = requests.post(f"{BASE_URL}/api/scenario", json=scenario_data, headers=headers)
        if scenario_response.status_code != 201:
            print(f"Failed to create test scenario: {scenario_response.status_code} - {scenario_response.text}")
            return False
        
        scenario = scenario_response.json()
        scenario_id = scenario.get('id')
        print(f"✅ Test scenario created with ID: {scenario_id}")
        
        # Step 3: Create a test image
        test_image = create_test_image()
        
        # Step 4: Upload the image
        upload_headers = {
            'Authorization': f'Bearer {token}'
        }
        
        files = {
            'image': ('test_scenario_image.jpg', test_image, 'image/jpeg')
        }
        
        upload_response = requests.post(
            f"{BASE_URL}/api/scenario/{scenario_id}/upload-image",
            headers=upload_headers,
            files=files
        )
        
        print(f"Upload response status: {upload_response.status_code}")
        
        if upload_response.status_code == 200:
            result = upload_response.json()
            print("✅ Scenario image upload successful!")
            print(f"Image ID: {result.get('imageId', 'Unknown')}")
            print(f"Image URL: {result.get('imageUrl', 'Unknown')}")
            
            # Step 5: Test if the image can be accessed via URL
            image_url = result.get('imageUrl')
            if image_url:
                image_response = requests.get(f"{BASE_URL}{image_url}")
                if image_response.status_code == 200 and image_response.headers.get('content-type', '').startswith('image/'):
                    print("✅ Image can be accessed via URL")
                else:
                    print(f"❌ Image URL not accessible: {image_response.status_code}")
                    return False
            
            # Step 6: Test image deletion
            delete_response = requests.delete(
                f"{BASE_URL}/api/scenario/{scenario_id}/delete-image",
                headers=headers
            )
            
            if delete_response.status_code == 200:
                print("✅ Image deleted successfully")
            else:
                print(f"❌ Image deletion failed: {delete_response.status_code}")
                return False
            
            # Step 7: Clean up test scenario
            cleanup_response = requests.delete(f"{BASE_URL}/api/scenario/{scenario_id}", headers=headers)
            if cleanup_response.status_code == 200:
                print("✅ Test scenario cleaned up")
            
            return True
        else:
            print(f"❌ Upload failed: {upload_response.status_code}")
            print(f"Response: {upload_response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error. Please make sure the backend server is running on http://localhost:5000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("Scenario Image Upload Test")
    print("=" * 40)
    success = test_scenario_image_upload()
    if success:
        print("\n🎉 All tests passed!")
    else:
        print("\n💥 Tests failed. Check the output above for details.")
