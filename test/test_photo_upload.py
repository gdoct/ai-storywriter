#!/usr/bin/env python3
"""
Test script for the character photo upload feature.
This script tests the basic functionality without requiring a full frontend.
"""

import json
import os
from io import BytesIO

import requests
from PIL import Image

# Test configuration
BASE_URL = "http://localhost:5000"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "password123"

def create_test_image():
    """Create a simple test image in memory."""
    # Create a simple red square image
    img = Image.new('RGB', (200, 200), color='red')
    img_bytes = BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes

def test_character_photo_upload():
    """Test the character photo upload endpoint."""
    print("Testing character photo upload feature...")
    
    # Step 1: Login to get a token (assuming you have a test user)
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
        
        # Step 2: Create a test image
        test_image = create_test_image()
        
        # Step 3: Prepare the upload data
        headers = {
            'Authorization': f'Bearer {token}'
        }
        
        files = {
            'photo': ('test_character.jpg', test_image, 'image/jpeg')
        }
        
        data = {
            'scenarioId': 'test-scenario-123',
            'characterName': 'Test Character',
            'characterRole': 'protagonist',
            'additionalPrompt': 'A brave hero with red clothing'
        }
        
        # Step 4: Upload the photo
        upload_response = requests.post(
            f"{BASE_URL}/api/characters/create-from-photo",
            headers=headers,
            files=files,
            data=data
        )
        
        print(f"Upload response status: {upload_response.status_code}")
        print(f"Upload response: {upload_response.text}")
        
        if upload_response.status_code == 200:
            result = upload_response.json()
            print("✅ Character photo upload successful!")
            print(f"Created character: {result.get('character', {}).get('name', 'Unknown')}")
            print(f"Photo ID: {result.get('photoId', 'Unknown')}")
            return True
        else:
            print(f"❌ Upload failed: {upload_response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error. Please make sure the backend server is running on http://localhost:5000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("Character Photo Upload Test")
    print("=" * 40)
    success = test_character_photo_upload()
    if success:
        print("\n🎉 All tests passed!")
    else:
        print("\n💥 Tests failed. Check the output above for details.")
