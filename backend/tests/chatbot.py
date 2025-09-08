import json
import sys
from pathlib import Path

import requests

# Import test configuration
sys.path.append(str(Path(__file__).parent.parent.parent))
from test_config import get_backend_url

BACKEND_URL = get_backend_url()
LOGIN_ENDPOINT = f"{BACKEND_URL}/api/login"
LLM_PROXY_ENDPOINT = f"{BACKEND_URL}/proxy/llm/v1/chat/completions"


def get_jwt_token(username: str, password: str) -> str:
    resp = requests.post(
        LOGIN_ENDPOINT,
        json={"username": username, "password": password},
        timeout=10
    )
    resp.raise_for_status()
    data = resp.json()
    return data["access_token"]


def stream_chat_completion(jwt_token: str, user_message: str):
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gemma3:4b",  # or any model loaded in LM Studio
        "messages": [
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.8,
        "max_tokens": 1024
    }
    with requests.post(LLM_PROXY_ENDPOINT, headers=headers, json=payload, stream=True, timeout=120) as resp:
        resp.raise_for_status()
        print("\n--- AI Response ---")
        for line in resp.iter_lines(decode_unicode=False):
            if line:
                line = line.decode('utf-8', errors='ignore')
                # LM Studio streams as SSE: lines start with 'data: '
                if line.startswith('data: '):
                    data = line[6:]
                    if data == '[DONE]':
                        break
                    try:
                        chunk = json.loads(data)
                        # Extract content from chunk
                        choices = chunk.get('choices', [])
                        for choice in choices:
                            delta = choice.get('delta', {})
                            content = delta.get('content')
                            if content:
                                print(content, end='', flush=True)
                    except Exception:
                        # Print raw if not JSON
                        print(data, end='', flush=True)
        print("\n-------------------\n")

def main():
    print("Logging in as test-user...")
    try:
        jwt_token = get_jwt_token("test-user", "")
    except Exception as e:
        print(f"Login failed: {e}")
        sys.exit(1)
    print("Login successful. Type your message and press Enter. (Ctrl+C to exit)")
    while True:
        try:
            user_input = input("You: ")
            if not user_input.strip():
                continue
            stream_chat_completion(jwt_token, user_input)
        except KeyboardInterrupt:
            print("\nExiting.")
            break
        except Exception as e:
            print(f"Error: {e}\n")

if __name__ == "__main__":
    main()
