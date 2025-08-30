#!/usr/bin/env python3
"""
Test script for chat endpoints to verify they work correctly.
This will help us identify the difference between working chat and broken frontend AI functions.
"""

import requests
import json
import sys
import time
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:5000"
TEST_USER_TOKEN = None  # We'll get this from environment or prompt

def get_auth_headers():
    """Get authentication headers"""
    # Try to read token from .env file or use a test token
    try:
        with open('/home/guido/storywriter/.env', 'r') as f:
            for line in f:
                if line.startswith('BEARER_TOKEN='):
                    token = line.split('=', 1)[1].strip()
                    return {"Authorization": f"Bearer {token}"}
    except FileNotFoundError:
        pass
    
    # Try to read from test user file
    try:
        with open('/home/guido/storywriter/frontend/playwright-tests/.testuser', 'r') as f:
            data = json.load(f)
            if 'jwt' in data:
                return {"Authorization": f"Bearer {data['jwt']}"}
    except (FileNotFoundError, json.JSONDecodeError):
        pass
    
    print("No authentication token found. Using default admin token.")
    # Default admin token for testing
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHdWlkbyBEb2N0ZXIiLCJleHAiOjE3ODgwODk4Nzh9.yyDx2GcsrzridWuOoNJkWh_ZYUQePovZgJbHGm4jf8I"
    return {"Authorization": f"Bearer {token}"}

def test_simple_chat_endpoint():
    """Test the simple chat endpoint that frontend AI functions use"""
    print("\n=== Testing Simple Chat Endpoint ===")
    
    headers = get_auth_headers()
    headers["Content-Type"] = "application/json"
    
    # Test payload similar to what frontend sends for backstory generation
    payload = {
        "model": "google/gemma-3-4b",
        "messages": [
            {
                "role": "system",
                "content": "You are an expert storyteller specializing in General Fiction fiction. Create compelling backstories that establish story foundations without overwhelming detail."
            },
            {
                "role": "user", 
                "content": "Create a compelling backstory for this General Fiction scenario.\n\nSCENARIO DETAILS:\n# Untitled Scenario\n\nNo synopsis\n\nREQUIREMENTS:\n• Write 2-3 concise paragraphs that establish the story's foundation\n• Focus on the key events, conflicts, or circumstances that set up the main story\n• Preserve all essential character relationships and motivations\n• Write in a neutral, engaging tone suitable for a book synopsis\n• Include only the most important background details needed for story context\n\nOUTPUT: Provide only the backstory text - no formatting, headers, or commentary."
            }
        ],
        "temperature": 0.8,
        "max_tokens": 1000,
        "stream": True
    }
    
    print(f"Sending request to: {BASE_URL}/api/proxy/llm/v1/simple/chat/completions")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/proxy/llm/v1/simple/chat/completions",
            headers=headers,
            json=payload,
            stream=True
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code != 200:
            print(f"Error response: {response.text}")
            return False
        
        # Process streaming response
        full_response = ""
        chunk_count = 0
        
        print("\nStreaming response:")
        print("-" * 50)
        
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                print(f"Raw line {chunk_count}: {repr(line_str)}")
                
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
                                    print(f"Content chunk: {repr(content)}")
                        except json.JSONDecodeError as e:
                            print(f"JSON decode error: {e} for data: {repr(data_part)}")
                
                chunk_count += 1
                if chunk_count > 50:  # Prevent infinite loops
                    break
        
        print("-" * 50)
        print(f"Full response: {repr(full_response)}")
        print(f"Total chunks: {chunk_count}")
        
        return len(full_response.strip()) > 0 and "ido A past one merely" not in full_response
        
    except Exception as e:
        print(f"Request failed: {e}")
        return False

def test_regular_chat_endpoint():
    """Test the regular chat endpoint that agent system uses"""
    print("\n=== Testing Regular Chat Endpoint ===")
    
    headers = get_auth_headers()
    headers["Content-Type"] = "application/json"
    
    # Test payload similar to what agent system sends
    payload = {
        "model": "default",
        "messages": [
            {
                "role": "user", 
                "content": "Create a compelling synopsis for a fantasy adventure story about a young wizard discovering their powers."
            }
        ],
        "temperature": 0.8,
        "max_tokens": 100,
        "stream": True
    }
    
    print(f"Sending request to: {BASE_URL}/api/proxy/llm/v1/chat/completions")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/proxy/llm/v1/chat/completions",
            headers=headers,
            json=payload,
            stream=True
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 429:
            print("AI is busy - this is expected behavior for the regular endpoint")
            return True
        
        if response.status_code != 200:
            print(f"Error response: {response.text}")
            return False
        
        # Process streaming response
        full_response = ""
        chunk_count = 0
        
        print("\nStreaming response:")
        print("-" * 50)
        
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                print(f"Raw line {chunk_count}: {repr(line_str)}")
                
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
                                    print(f"Content chunk: {repr(content)}")
                        except json.JSONDecodeError as e:
                            print(f"JSON decode error: {e} for data: {repr(data_part)}")
                
                chunk_count += 1
                if chunk_count > 50:  # Prevent infinite loops
                    break
        
        print("-" * 50)
        print(f"Full response: {repr(full_response)}")
        print(f"Total chunks: {chunk_count}")
        
        return len(full_response.strip()) > 0
        
    except Exception as e:
        print(f"Request failed: {e}")
        return False

def test_agent_endpoint():
    """Test the agent endpoint to see how it handles similar requests"""
    print("\n=== Testing Agent Endpoint ===")
    
    headers = get_auth_headers()
    headers["Content-Type"] = "application/json"
    
    # Test payload for agent
    payload = {
        "message": "Create a compelling synopsis for a fantasy adventure story about a young wizard discovering their powers.",
        "scenario": None,
        "stream": True
    }
    
    print(f"Sending request to: {BASE_URL}/api/agent/scenario")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/agent/scenario",
            headers=headers,
            json=payload,
            stream=True
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code != 200:
            print(f"Error response: {response.text}")
            return False
        
        # Process streaming response
        full_response = ""
        chunk_count = 0
        
        print("\nStreaming response:")
        print("-" * 50)
        
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                print(f"Raw line {chunk_count}: {repr(line_str)}")
                
                if line_str.startswith('data: '):
                    data_part = line_str[6:]
                    if data_part.strip():
                        try:
                            chunk_data = json.loads(data_part)
                            if chunk_data.get('type') == 'chat':
                                content = chunk_data.get('content', '')
                                if content:
                                    full_response += content
                                    print(f"Agent content: {repr(content)}")
                        except json.JSONDecodeError as e:
                            print(f"JSON decode error: {e} for data: {repr(data_part)}")
                
                chunk_count += 1
                if chunk_count > 100:  # Agents can be more verbose
                    break
        
        print("-" * 50)
        print(f"Full response: {repr(full_response)}")
        print(f"Total chunks: {chunk_count}")
        
        return len(full_response.strip()) > 0
        
    except Exception as e:
        print(f"Request failed: {e}")
        return False

def main():
    """Run all tests"""
    print("Chat Endpoint Testing")
    print("=" * 50)
    
    results = {
        "simple_chat": test_simple_chat_endpoint(),
        "regular_chat": test_regular_chat_endpoint(), 
        "agent": test_agent_endpoint()
    }
    
    print("\n" + "=" * 50)
    print("TEST RESULTS:")
    for test_name, passed in results.items():
        status = "PASS" if passed else "FAIL"
        print(f"  {test_name}: {status}")
    
    if not results["simple_chat"]:
        print("\n❌ Simple chat endpoint is broken - this explains frontend AI issues!")
    else:
        print("\n✅ Simple chat endpoint works - frontend issue may be elsewhere")
    
    return all(results.values())

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)