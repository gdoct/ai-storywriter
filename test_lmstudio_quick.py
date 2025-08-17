#!/usr/bin/env python3
import requests
import json
import time

def test_quick():
    url = "http://192.168.32.1:1234/v1/chat/completions"
    payload = {
        "model": "openai-gpt-oss-20b-abliterated-uncensored-neo-imatrix",
        "messages": [{"role": "user", "content": "Say hello"}],
        "stream": True,
        "max_tokens": 20
    }
    
    print("Testing quick streaming...")
    try:
        response = requests.post(url, json=payload, stream=True, timeout=30)
        
        for i, line in enumerate(response.iter_lines()):
            if i > 10:  # Limit to first 10 chunks
                print("Stopping after 10 chunks...")
                break
                
            if line:
                line_str = line.decode('utf-8')
                print(f"Chunk {i}: {repr(line_str)}")
                
                if line_str.startswith('data: '):
                    data = line_str[6:]
                    if data == '[DONE]':
                        break
                    try:
                        chunk = json.loads(data)
                        content = chunk.get('choices', [{}])[0].get('delta', {}).get('content', '')
                        if content:
                            print(f"  -> Content: {repr(content)}")
                            if '<think>' in content or '</think>' in content:
                                print("  *** FOUND THINKING TAG! ***")
                    except:
                        pass
                        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_quick()