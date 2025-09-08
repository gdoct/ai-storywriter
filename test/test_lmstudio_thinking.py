#!/usr/bin/env python3
"""
Test script to verify LM Studio thinking output
"""
import requests
import json
import sys

def test_lmstudio_thinking():
    url = "http://192.168.32.1:1234/v1/chat/completions"
    
    # Test payload with a simple reasoning request that might trigger thinking
    payload = {
        "model": "openai-gpt-oss-20b-abliterated-uncensored-neo-imatrix",  # Use a specific model
        "messages": [
            {
                "role": "user", 
                "content": "What is 5+7? Think step by step."
            }
        ],
        "stream": True,
        "temperature": 0.3,
        "max_tokens": 100
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print("Testing LM Studio at http://192.168.32.1:1234")
    print("Payload:", json.dumps(payload, indent=2))
    print("\n" + "="*50)
    print("STREAMING RESPONSE:")
    print("="*50)
    
    try:
        response = requests.post(url, headers=headers, json=payload, stream=True)
        response.raise_for_status()
        
        full_response = ""
        chunk_count = 0
        
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                print(f"Raw line: {repr(line_str)}")
                
                if line_str.startswith('data: '):
                    data_part = line_str[6:]  # Remove 'data: ' prefix
                    
                    if data_part == '[DONE]':
                        print("Stream completed: [DONE]")
                        break
                    
                    try:
                        chunk_data = json.loads(data_part)
                        if 'choices' in chunk_data and len(chunk_data['choices']) > 0:
                            delta = chunk_data['choices'][0].get('delta', {})
                            content = delta.get('content', '')
                            
                            if content:
                                print(f"Content chunk {chunk_count}: {repr(content)}")
                                full_response += content
                                chunk_count += 1
                                
                                # Check for thinking tags
                                if '<think>' in content:
                                    print("*** FOUND <think> TAG! ***")
                                if '</think>' in content:
                                    print("*** FOUND </think> TAG! ***")
                    
                    except json.JSONDecodeError as e:
                        print(f"Failed to parse JSON: {data_part}")
                        print(f"JSON Error: {e}")
        
        print("\n" + "="*50)
        print("FULL RESPONSE:")
        print("="*50)
        print(full_response)
        
        print("\n" + "="*50)
        print("ANALYSIS:")
        print("="*50)
        print(f"Total chunks received: {chunk_count}")
        print(f"Contains <think>: {'<think>' in full_response}")
        print(f"Contains </think>: {'</think>' in full_response}")
        
        if '<think>' in full_response and '</think>' in full_response:
            # Extract thinking content
            start = full_response.find('<think>') + 7
            end = full_response.find('</think>')
            if start < end:
                thinking_content = full_response[start:end]
                print(f"Thinking content length: {len(thinking_content)} chars")
                print("Thinking content preview:")
                print("-" * 30)
                print(thinking_content[:200] + ("..." if len(thinking_content) > 200 else ""))
                print("-" * 30)
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to LM Studio at http://192.168.32.1:1234")
        print("Please check:")
        print("1. LM Studio is running")
        print("2. Server is started in LM Studio")
        print("3. A model is loaded")
        print("4. The IP address is correct")
        return False
        
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Request failed: {e}")
        return False

if __name__ == "__main__":
    test_lmstudio_thinking()