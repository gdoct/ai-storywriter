#!/usr/bin/env python3
"""Backend Vision API test script.

This script uses the exact same logic as test_lmstudio_vision.py but calls
our backend vision API instead of LM Studio directly. This helps identify
if vision processing issues are in our backend LLM proxy controllers.
"""

import argparse
import base64
import json
import random
from pathlib import Path
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import test configuration
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))
from test_config import get_backend_url

# Backend configuration
BACKEND_BASE_URL = get_backend_url()
BACKEND_VISION_ENDPOINT = f"{BACKEND_BASE_URL}/api/proxy/llm/v1/chat/completions"
DEFAULT_MODEL = "google/gemma-3-4b"
IMAGES_DIR = "../frontend/public/images/characters/general/female"
READ_TIMEOUT_SECONDS = 120

# Get auth token from .env file
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN")
if not ADMIN_TOKEN:
    raise ValueError("ADMIN_TOKEN not found in .env file")


def encode_image_to_base64(image_path: Path) -> str:
    """Encode image to base64 string (no data URI wrapper)."""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def get_random_image(images_dir: str) -> Path:
    """Pick a random image (jpg/jpeg/png) from the given directory."""
    image_dir = Path(images_dir)
    if not image_dir.exists():
        raise FileNotFoundError(f"Directory not found: {images_dir}")

    patterns = ["*.png", "*.jpg", "*.jpeg"]
    files = []
    for p in patterns:
        files.extend(image_dir.glob(p))

    if not files:
        raise FileNotFoundError(f"No images found in {images_dir}")

    return random.choice(files)


def call_backend_vision_api(image_path: Path, endpoint: str, model: str, prompt: str) -> str:
    """Send the image + prompt to backend and stream the response to stdout.

    Returns the full concatenated response string.
    """
    print(f"Selected image: {image_path}")

    b64 = encode_image_to_base64(image_path)

    # Build payload following the OpenAI vision format
    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": "data:image/png;base64," + b64}},
                ],
            }
        ],
        "max_tokens": 512,
        "temperature": 0.1,
        "stream": True,
    }

    headers = {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
        "Authorization": f"Bearer {ADMIN_TOKEN}",
    }

    print(f"Calling Backend Vision API (streaming) at {endpoint}...")
    print(f"Model: {model}")
    print(f"Read timeout (wait for first bytes): {READ_TIMEOUT_SECONDS}s")
    print("\n=== STREAMING BACKEND VISION API RESPONSE ===")
    print(f"Image: {image_path.name}")
    print("Response: ", end="", flush=True)

    try:
        # timeout=(connect_timeout, read_timeout)
        response = requests.post(
            endpoint,
            headers=headers,
            json=payload,
            stream=True,
            timeout=(10, READ_TIMEOUT_SECONDS),
        )

        if response.status_code not in (200, 201):
            # Print server error body for diagnosis
            body = response.text
            raise RuntimeError(f"HTTP {response.status_code}: {body}")

        full = ""

        # Many streaming endpoints use SSE-style lines like: data: {json}\n\n
        for raw_line in response.iter_lines(decode_unicode=True):
            if not raw_line:
                continue

            line = raw_line.strip()
            # Support both SSE `data: {json}` and raw JSON per-line
            if line.startswith("data:"):
                data_str = line[len("data:"):].strip()
            else:
                data_str = line

            if not data_str:
                continue

            if data_str == "[DONE]":
                break

            try:
                data = json.loads(data_str)
                # Debug: print raw JSON to see token usage info
                if "usage" in data:
                    print(f"\n[DEBUG] Found usage info: {data['usage']}")
                # Look for any fields that might contain token information
                if isinstance(data, dict):
                    for key, value in data.items():
                        if 'token' in str(key).lower() or 'usage' in str(key).lower():
                            print(f"[DEBUG] {key}: {value}")
            except Exception:
                # Not JSON, print raw chunk
                print(data_str, end="", flush=True)
                full += data_str
                continue

            # Try to extract streaming text from several possible shapes
            text_chunk = None
            if isinstance(data, dict) and "choices" in data and data["choices"]:
                choice = data["choices"][0]
                # delta style
                delta = choice.get("delta") or {}
                if isinstance(delta, dict):
                    # delta may contain content or 'content' list
                    if "content" in delta:
                        text_chunk = delta["content"]
                    elif "message" in delta and isinstance(delta["message"], dict):
                        # some servers stream a message object
                        msg = delta["message"].get("content")
                        if isinstance(msg, str):
                            text_chunk = msg
                # fallback for non-delta full message
                if text_chunk is None and "message" in choice:
                    msg = choice["message"]
                    if isinstance(msg, dict):
                        # message.content could be structured; try common keys
                        txt = msg.get("content") or msg.get("text")
                        if isinstance(txt, str):
                            text_chunk = txt

            # Print chunk if found
            if text_chunk:
                print(text_chunk, end="", flush=True)
                full += text_chunk

        print()  # newline after stream ends
        print("=" * 50)
        return full

    except requests.exceptions.ReadTimeout:
        print(f"\nError: read timed out after {READ_TIMEOUT_SECONDS} seconds waiting for response")
    except requests.exceptions.ConnectTimeout:
        print("\nError: connection timed out while connecting to backend")
    except requests.exceptions.ConnectionError:
        print(f"\nError: could not connect to backend at {BACKEND_BASE_URL}")
    except Exception as e:
        print(f"\nError: {e}")


def build_arg_parser():
    p = argparse.ArgumentParser(description="Backend vision streaming test")
    p.add_argument("--image", "-i", help="Path to an image file. If omitted, pick a random image from IMAGES_DIR")
    p.add_argument("--endpoint", "-e", default=BACKEND_VISION_ENDPOINT, help="Backend vision endpoint URL")
    p.add_argument("--model", "-m", default=DEFAULT_MODEL, help="Model to use (e.g. google/gemma-3-4b)")
    p.add_argument("--prompt", "-p", default="Look at this image and tell me: Is this person a male, female, or something else? Provide a brief explanation.", help="Prompt to send along with the image")
    return p


def main():
    parser = build_arg_parser()
    args = parser.parse_args()

    try:
        if args.image:
            image_path = Path(args.image)
            if not image_path.exists():
                raise FileNotFoundError(f"Image not found: {args.image}")
        else:
            image_path = get_random_image(IMAGES_DIR)

        call_backend_vision_api(image_path, args.endpoint, args.model, args.prompt)

    except Exception as exc:
        print(f"Error: {exc}")


if __name__ == "__main__":
    main()
