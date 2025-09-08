import json
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))
from test_config import get_backend_url

import requests


def test_chat_completion():
    url = f"{get_backend_url()}/proxy/llm/v1/chat/completions"
    payload = {
        "messages": [{"role": "user", "content": "Hello, test message"}],
        "temperature": 0.7
    }
    
    print(f"Sending request to {url} with payload: {json.dumps(payload)}")
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Error: {response.text}")
            return False
            
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        return True
    except Exception as e:
        print(f"Exception occurred: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_chat_completion()
    sys.exit(0 if success else 1)
