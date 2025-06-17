import base64
import json
import re

import requests
from llm_services.llm_service import BaseLLMService


class OpenAIService(BaseLLMService):
    def __init__(self, config):
        super().__init__(config)
        self.api_key = config.get('api_key')
        self.base_url = config.get('url', 'https://api.openai.com/v1')

    def get_models(self):
        headers = {'Authorization': f'Bearer {self.api_key}'}
        resp = requests.get(f"{self.base_url}/models", headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        return [m['id'] for m in data.get('data', [])]

    def test_connection(self):
        try:
            models = self.get_models()
            return {'status': 'connected', 'models': models}
        except Exception as e:
            return {'status': 'error', 'error': str(e)}

    def chat_completion_stream(self, payload):
        try:
            headers = {'Authorization': f'Bearer {self.api_key}'}
            
            # Make sure temperature and seed are correctly passed if provided
            openai_payload = {
                'model': payload.get('model', 'gpt-3.5-turbo'),  # Default to gpt-3.5-turbo
                'messages': payload.get('messages', []),
                'stream': True  # Enable streaming
            }
            
            # Add temperature if provided
            if 'temperature' in payload and payload['temperature'] is not None:
                openai_payload['temperature'] = float(payload['temperature'])
                
            # Add seed if provided (OpenAI API supports seed for deterministic outputs)
            if 'seed' in payload and payload['seed'] is not None:
                openai_payload['seed'] = int(payload['seed'])
                
            # Add max_tokens if provided
            if 'max_tokens' in payload and payload['max_tokens'] is not None:
                openai_payload['max_tokens'] = int(payload['max_tokens'])
            
            # Stream the response
            with requests.post(f"{self.base_url}/chat/completions", 
                             json=openai_payload, 
                             headers=headers, 
                             stream=True, 
                             timeout=60) as resp:
                resp.raise_for_status()
                for chunk in resp.iter_content(chunk_size=4096):
                    if chunk:
                        yield chunk
        except Exception as e:
            import traceback

            # Only log failed requests
            print(f"OpenAI error: {str(e)}")
            print(traceback.format_exc())
            raise

    def vision_completion(self, image_data, prompt, model=None):
        """Process image with vision AI and return character data using OpenAI."""
        try:
            # Convert image to base64
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            
            # Use fixed model as requested - ignore model parameter for now  
            # Note: For OpenAI, we'd typically use gpt-4-vision-preview, but keeping gemma-3-4b as specified
            vision_model = "google/gemma-3-4b"
            
            # For OpenAI, detect proper image type
            image_type = "image/jpeg"
            
            headers = {'Authorization': f'Bearer {self.api_key}'}
            
            # Prepare the vision request payload for OpenAI
            payload = {
                "model": vision_model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{image_type};base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                "max_tokens": 1000
            }
            
            # Send vision request to OpenAI
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                raise Exception(f"OpenAI Vision API error: {response.status_code}")
            
            # Parse the response
            response_data = response.json()
            vision_response = response_data.get('choices', [{}])[0].get('message', {}).get('content', '')
            
            return self._parse_vision_response(vision_response)
            
        except Exception as e:
            print(f"OpenAI vision error: {str(e)}")
            raise

    def _parse_vision_response(self, vision_response):
        """Parse the vision response to extract structured data."""
        from llm_services.llm_service import parse_json_response

        # Define required fields for character generation
        required_fields = ['name', 'alias', 'role', 'gender', 'appearance', 'backstory', 'extraInfo']
        
        # Define schema sample for validation
        schema_sample = {
            "name": "Character Name",
            "alias": "Character Alias", 
            "role": "Main/Supporting/Antagonist",
            "gender": "Male/Female/Other",
            "appearance": "Physical description",
            "backstory": "Character background",
            "extraInfo": "Additional details"
        }
        
        return parse_json_response(vision_response, required_fields, schema_sample)

    def mask_api_key(self):
        if not self.api_key or len(self.api_key) < 6:
            return '*' * len(self.api_key)
        return self.api_key[:3] + '*' * (len(self.api_key)-4) + self.api_key[-1]
