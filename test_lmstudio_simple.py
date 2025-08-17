#!/usr/bin/env python3
"""
Simple test to check LM Studio connection
"""
import requests
import json

def test_lmstudio_connection():
    # First test if we can reach LM Studio at all
    try:
        print("Testing connection to LM Studio...")
        
        # Test models endpoint first
        models_url = "http://192.168.32.1:1234/v1/models"
        response = requests.get(models_url, timeout=5)
        print(f"Models endpoint status: {response.status_code}")
        
        if response.status_code == 200:
            models = response.json()
            print(f"Available models: {json.dumps(models, indent=2)}")
        
        # Test simple non-streaming completion
        print("\nTesting simple completion...")
        url = "http://192.168.32.1:1234/v1/chat/completions"
        payload = {
            "model": "default",
            "messages": [{"role": "user", "content": "Hello"}],
            "stream": False,
            "max_tokens": 10
        }
        
        response = requests.post(url, json=payload, timeout=10)
        print(f"Chat completion status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
        else:
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError as e:
        print(f"Connection failed: {e}")
        print("Is LM Studio running and accessible at http://192.168.32.1:1234?")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_lmstudio_connection()