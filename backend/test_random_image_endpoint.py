#!/usr/bin/env python3
"""
Test script for the random image endpoint
"""
import os
import sys

# Add the backend directory to the path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

import json

from controllers.image_controller import get_random_image
from flask import Flask, request


def test_random_image_logic():
    """Test the random image selection logic"""
    
    # Create a minimal Flask app for testing
    app = Flask(__name__)
    
    with app.app_context():
        # Test cases
        test_cases = [
            {'genre': 'fantasy', 'type': 'character'},
            {'genre': 'scify', 'type': 'character'},
            {'genre': 'fantasy', 'type': 'background'},
            {'genre': 'scify', 'type': 'background'},
            {'genre': 'romance', 'type': 'background'},
            {'genre': 'romance', 'type': 'character'},  # Should fail
            {'genre': 'general', 'type': 'background'},  # Should fail
            {'genre': 'invalid', 'type': 'character'},  # Should fail
            {'genre': 'fantasy', 'type': 'invalid'},   # Should fail
        ]
        
        for test_case in test_cases:
            print(f"\nTesting: genre={test_case['genre']}, type={test_case['type']}")
            
            # Mock the request args
            with app.test_request_context(f"/?genre={test_case['genre']}&type={test_case['type']}"):
                try:
                    response = get_random_image()
                    if hasattr(response, 'get_json'):
                        data = response.get_json()
                        status_code = response.status_code
                    else:
                        # Handle tuple response (data, status_code)
                        data, status_code = response
                    
                    print(f"Status: {status_code}")
                    print(f"Response: {json.dumps(data, indent=2)}")
                    
                except Exception as e:
                    print(f"Error: {e}")

if __name__ == "__main__":
    test_random_image_logic()
