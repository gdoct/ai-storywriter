#!/usr/bin/env python3
"""
Debug script to intercept and log AI requests to see what parameters are being sent.
This will help us understand why we're getting garbage text.
"""

import json
from datetime import datetime
from typing import Any, Dict

class RequestLogger:
    def __init__(self, log_file="ai_requests.log"):
        self.log_file = log_file
    
    def log_request(self, endpoint: str, payload: Dict[str, Any], user_info: str = ""):
        """Log an AI request with timestamp and details"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
        
        log_entry = {
            "timestamp": timestamp,
            "endpoint": endpoint,
            "user": user_info,
            "payload": payload
        }
        
        print(f"\n{'='*60}")
        print(f"AI REQUEST LOG - {timestamp}")
        print(f"Endpoint: {endpoint}")
        print(f"User: {user_info}")
        print(f"{'='*60}")
        
        # Pretty print the payload
        print("PAYLOAD:")
        print(json.dumps(payload, indent=2))
        
        # Log specific parameters that might cause issues
        if "messages" in payload:
            print(f"\nMESSAGE COUNT: {len(payload['messages'])}")
            for i, msg in enumerate(payload['messages']):
                print(f"Message {i}: {msg.get('role', 'unknown')} - {len(msg.get('content', ''))} chars")
                if len(msg.get('content', '')) < 200:  # Only show short messages fully
                    print(f"  Content: {repr(msg.get('content', ''))}")
                else:
                    print(f"  Content preview: {repr(msg.get('content', '')[:100])}...")
        
        # Check for problematic parameters
        print(f"\nKEY PARAMETERS:")
        print(f"  Model: {payload.get('model', 'NOT_SET')}")
        print(f"  Temperature: {payload.get('temperature', 'NOT_SET')}")
        print(f"  Max tokens: {payload.get('max_tokens', 'NOT_SET')}")
        print(f"  Stream: {payload.get('stream', 'NOT_SET')}")
        
        # Check for parameters that might cause garbage output
        warning_flags = []
        if payload.get('temperature', 1.0) == 0:
            warning_flags.append("Temperature is 0 - might cause repetitive output")
        if not payload.get('model'):
            warning_flags.append("No model specified")
        if payload.get('max_tokens', 0) < 10:
            warning_flags.append("Very low max_tokens")
            
        if warning_flags:
            print(f"\n⚠️  POTENTIAL ISSUES:")
            for flag in warning_flags:
                print(f"  - {flag}")
        
        print(f"{'='*60}\n")
        
        # Also write to file
        with open(self.log_file, 'a') as f:
            f.write(json.dumps(log_entry) + '\n')

# Global logger instance
logger = RequestLogger()

if __name__ == "__main__":
    print("Request logger initialized. Import this module to use logger.log_request()")