#!/usr/bin/env python3
"""
Quick test script to verify the random image endpoint with gender support
"""

import requests
import json

def test_random_image_endpoint():
    base_url = "http://localhost:5000"
    
    test_cases = [
        # Test with genre and gender specified
        {"genre": "fantasy", "type": "character", "gender": "male"},
        {"genre": "fantasy", "type": "character", "gender": "female"},
        {"genre": "fantasy", "type": "character", "gender": "other"},
        {"genre": "scify", "type": "character", "gender": "male"},
        
        # Test without gender (should randomly select)
        {"genre": "fantasy", "type": "character"},
        {"genre": "scify", "type": "character"},
        
        # Test invalid gender
        {"genre": "fantasy", "type": "character", "gender": "invalid"},
        
        # Test background images (no gender)
        {"genre": "fantasy", "type": "cover"},
    ]
    
    for i, params in enumerate(test_cases, 1):
        print(f"\nTest {i}: {params}")
        try:
            response = requests.get(f"{base_url}/api/images/random", params=params)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Success: {data['url']}")
            else:
                error_data = response.json()
                print(f"Error: {error_data.get('error', 'Unknown error')}")
                
        except requests.exceptions.ConnectionError:
            print("Error: Could not connect to server. Make sure the backend is running on localhost:5000")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_random_image_endpoint()
