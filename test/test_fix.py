#!/usr/bin/env python3
"""
Test script to verify the LM Studio connection test fix
"""
import json
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))
from test_config import get_backend_url

import requests

BASE_URL = get_backend_url()
JWT_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc0ODczMDcwNiwianRpIjoiY2UzMzJjODktZGIzYy00NDFhLTk0YzItYTM1NTFiOGZkZTM3IiwidHlwZSI6ImFjY2VzcyIsInN1YiI6Imd1aWRvLmRvY3RlckBnbWFpbC5jb20iLCJuYmYiOjE3NDg3MzA3MDYsImNzcmYiOiI3M2MwZjZhNS1mZjdmLTRjYmYtODUwNS04NzY2MDE2ZjFiZjIiLCJleHAiOjE3ODAyNjY3MDZ9.f9Yx-lg6jxoOdKkoxnw7cvMU3S6eH3LKNKrDAvtGePQ"

headers = {
    "Authorization": JWT_TOKEN,
    "Content-Type": "application/json"
}

def test_lm_studio_connection():
    """Test LM Studio connection test endpoint with correct format"""
    print("🔧 Testing LM Studio connection with CORRECT format...")
    
    # This is the NEW correct format that the frontend now sends
    test_data = {
        "backend_type": "lmstudio",
        "config": {
            "url": "http://localhost:9999"  # Non-existent URL for testing
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/settings/llm/test",
            headers=headers,
            json=test_data,
            timeout=5
        )
        
        result = response.json()
        print(f"✅ Status Code: {response.status_code}")
        print(f"✅ Response: {json.dumps(result, indent=2)}")
        
        # Check that it's properly trying to connect to LM Studio (not OpenAI)
        if result.get("status") == "error" and "localhost:9999" in result.get("error", ""):
            print("✅ SUCCESS: Correctly attempting to connect to LM Studio!")
        else:
            print("❌ FAILED: Unexpected response")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_old_problematic_format():
    """Test what happens with the old problematic format"""
    print("\n🐛 Testing with OLD problematic format (should fail cleanly)...")
    
    # This was the OLD problematic format that caused OpenAI calls
    old_test_data = {
        "backendType": "lmstudio",  # Wrong field name
        "lmstudio": {
            "url": "http://localhost:1234"
        },
        "chatgpt": {
            "apiKey": "sk-test123"  # This was causing OpenAI calls!
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/settings/llm/test",
            headers=headers,
            json=old_test_data,
            timeout=5
        )
        
        result = response.json()
        print(f"✅ Status Code: {response.status_code}")
        print(f"✅ Response: {json.dumps(result, indent=2)}")
        
        # Check that it fails cleanly without calling OpenAI
        if result.get("status") == "error" and "Unknown backend_type" in result.get("error", ""):
            print("✅ SUCCESS: Old format fails cleanly without calling OpenAI!")
        else:
            print("❌ FAILED: Should have failed with 'Unknown backend_type' error")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_openai_format():
    """Test OpenAI format works correctly"""
    print("\n🤖 Testing OpenAI format (should try to call OpenAI)...")
    
    test_data = {
        "backend_type": "chatgpt",
        "config": {
            "api_key": "sk-invalid-test-key"
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/settings/llm/test",
            headers=headers,
            json=test_data,
            timeout=10
        )
        
        result = response.json()
        print(f"✅ Status Code: {response.status_code}")
        print(f"✅ Response: {json.dumps(result, indent=2)}")
        
        # Check that it's properly trying to call OpenAI API
        if result.get("status") == "error" and "api.openai.com" in result.get("error", ""):
            print("✅ SUCCESS: Correctly attempting to connect to OpenAI!")
        else:
            print("⚠️  Note: Might not have reached OpenAI due to network/auth")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    print("🧪 Testing LM Studio Connection Fix")
    print("=" * 50)
    
    test_lm_studio_connection()
    test_old_problematic_format()
    test_openai_format()
    
    print("\n" + "=" * 50)
    print("🎉 Test completed!")
