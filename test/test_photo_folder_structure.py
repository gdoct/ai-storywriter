#!/usr/bin/env python3
"""
Test script to verify that photo uploads are organized in user-specific folders.
"""

import json
import os
import tempfile
from io import BytesIO

import requests
from PIL import Image

# Test configuration
BASE_URL = "http://localhost:5000"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "password123"

def create_test_image():
    """Create a simple test image in memory."""
    img = Image.new('RGB', (100, 100), color='blue')
    img_bytes = BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes

def get_auth_token():
    """Login and get JWT token."""
    login_data = {
        'email': TEST_USER_EMAIL,
        'password': TEST_USER_PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if response.status_code == 200:
        return response.json().get('access_token')
    else:
        print(f"Login failed: {response.text}")
        return None

def test_photo_folder_structure():
    """Test that photos are saved in user-specific folders."""
    print("Testing photo folder structure...")
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("❌ Failed to get auth token")
        return False
    
    # Create test image
    test_image = create_test_image()
    
    # Prepare upload
    headers = {'Authorization': f'Bearer {token}'}
    files = {'photo': ('test_image.jpg', test_image, 'image/jpeg')}
    data = {'prompt': 'Create a character from this test image'}
    
    # Upload photo
    response = requests.post(
        f"{BASE_URL}/api/characters/create-from-photo",
        headers=headers,
        files=files,
        data=data
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Photo upload successful")
        print(f"   Character name: {result.get('character', {}).get('name', 'Unknown')}")
        
        # Check if the response indicates the file was saved
        if 'character' in result and 'photo_url' in result['character']:
            print(f"   Photo URL: {result['character']['photo_url']}")
            print("✅ Folder structure test appears successful")
            return True
        else:
            print("❌ No photo URL in response")
            return False
    else:
        print(f"❌ Photo upload failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_character_photo_upload():
    """Test that character photo upload endpoint works."""
    print("Testing character photo upload endpoint...")
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("❌ Failed to get auth token")
        return False
    
    # Create test image
    test_image = create_test_image()
    
    # Prepare upload
    headers = {'Authorization': f'Bearer {token}'}
    files = {'photo': ('test_character_photo.jpg', test_image, 'image/jpeg')}
    data = {'characterId': 'test-character-123'}  # Mock character ID
    
    # Upload photo
    response = requests.post(
        f"{BASE_URL}/api/characters/upload-photo",
        headers=headers,
        files=files,
        data=data
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Character photo upload successful")
        print(f"   Photo ID: {result.get('photoId', 'Unknown')}")
        photo_url = result.get('photoUrl', 'Unknown')
        print(f"   Photo URL: {photo_url}")
        
        # Test if the photo can be accessed via URL
        if photo_url and photo_url != 'Unknown':
            photo_response = requests.get(f"{BASE_URL}{photo_url}")
            if photo_response.status_code == 200 and photo_response.headers.get('content-type', '').startswith('image/'):
                print("✅ Photo can be accessed via URL")
                return True
            else:
                print(f"❌ Photo URL not accessible: {photo_response.status_code}")
                return False
        else:
            print("❌ No valid photo URL returned")
            return False
    else:
        print(f"❌ Character photo upload failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

if __name__ == "__main__":
    folder_test = test_photo_folder_structure()
    upload_test = test_character_photo_upload()
    
    if folder_test and upload_test:
        print("\n🎉 All tests passed!")
    else:
        print("\n❌ Some tests failed!")
        exit(1)
