#!/usr/bin/env python3
"""
Test the new frontend AI endpoint to verify it works correctly
"""

import requests
import json

def test_frontend_endpoint():
    """Test the new frontend AI endpoint"""
    
    # Use test user token
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJNZWxvZGVlIEdhcmNpYSIsImlkZW50aXR5IjoiTWVsb2RlZSBHYXJjaWEiLCJleHAiOjE3ODc1MTA4NTl9.2eSGyeL7hiAHZ_SVe8nwb0EmSvYzIWN5_aHSiRe688k"
    
    url = "http://localhost:5000/api/proxy/llm/v1/frontend/chat/completions"
    
    payload = {
        "model": "google/gemma-3-4b",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant. Generate a short story synopsis."
            },
            {
                "role": "user", 
                "content": "Create a brief synopsis for a fantasy adventure story."
            }
        ],
        "temperature": 0.8,
        "max_tokens": 100,
        "stream": True
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    print("Testing new frontend AI endpoint...")
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, headers=headers, json=payload, stream=True)
        
        print(f"\nResponse status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code != 200:
            print(f"Error response: {response.text}")
            return False
        
        print(f"\nStreaming response:")
        print("-" * 60)
        
        full_response = ""
        chunk_count = 0
        
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                print(f"Chunk {chunk_count}: {line_str}")
                
                if line_str.startswith('data: '):
                    data_part = line_str[6:]
                    if data_part.strip() and data_part.strip() != '[DONE]':
                        try:
                            chunk_data = json.loads(data_part)
                            if 'choices' in chunk_data and len(chunk_data['choices']) > 0:
                                delta = chunk_data['choices'][0].get('delta', {})
                                content = delta.get('content', '')
                                if content:
                                    full_response += content
                                    print(f"  → Content: {repr(content)}")
                        except json.JSONDecodeError as e:
                            print(f"  → JSON parse error: {e}")
                
                chunk_count += 1
                if chunk_count > 30:  # Safety limit
                    break
        
        print("-" * 60)
        print(f"FULL RESPONSE: {repr(full_response)}")
        print(f"Total chunks: {chunk_count}")
        
        # Check if response is coherent (not garbage)
        is_coherent = len(full_response.strip()) > 10 and not any(x in full_response for x in ["fortress- stability", "ido A past", "simmer.,"])
        
        print(f"\nResult: {'SUCCESS' if is_coherent else 'FAILURE'}")
        if not is_coherent:
            print("Response appears to be garbage text!")
        
        return is_coherent
        
    except Exception as e:
        print(f"Request failed: {e}")
        return False

if __name__ == "__main__":
    success = test_frontend_endpoint()
    exit(0 if success else 1)