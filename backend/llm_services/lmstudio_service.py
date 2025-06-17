import base64
import json
import re

import requests
from llm_services.llm_service import BaseLLMService  # type: ignore


class LMStudioService(BaseLLMService):
    def __init__(self, config):
        super().__init__(config)
        self.base_url = config.get('url', 'http://localhost:1234')

    def get_models(self):
        resp = requests.get(f"{self.base_url}/v1/models", timeout=10)
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
        """Stream chat completion responses."""
        try:
            # Prepare completion parameters
            completion_params = {'stream': True}  # Enable streaming
            if 'messages' in payload:
                completion_params['messages'] = payload['messages']
            if 'temperature' in payload and payload['temperature'] is not None:
                completion_params['temperature'] = float(payload['temperature'])
            if 'seed' in payload and payload['seed'] is not None:
                completion_params['seed'] = int(payload['seed'])
            if 'max_tokens' in payload and payload['max_tokens'] is not None:
                completion_params['max_tokens'] = int(payload['max_tokens'])
            if 'model' in payload and payload['model'] is not None:
                completion_params['model'] = payload['model']
                
            # Stream the response
            with requests.post(f"{self.base_url}/v1/chat/completions", 
                             json=completion_params, 
                             stream=True, 
                             timeout=60) as resp:
                resp.raise_for_status()
                for chunk in resp.iter_content(chunk_size=4096):
                    if chunk:
                        yield chunk
        except Exception as e:
            import traceback

            # Only log failed requests
            print(f"LMStudio error: {str(e)}")
            print(traceback.format_exc())
            raise
            
    def vision_completion(self, image_data, prompt, model=None, parse_as_json=True):
        """Process image with vision AI and return character data using LMStudio.
        
        Args:
            image_data: Raw image data as bytes
            prompt: Text prompt to send with the image
            model: Optional model name override
            parse_as_json: Whether to parse the response as JSON (default: True)
                           Set to False for plain text responses like appearance descriptions
        """
        try:
            # Convert image to base64
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            
            # Use fixed model as requested - ignore model parameter for now
            vision_model = "google/gemma-3-4b"
            
            # For simplicity, assume JPEG - in production you'd detect properly
            image_type = "image/jpeg"

            # Check if this is an appearance-only prompt
            is_appearance_prompt = "appearance" in prompt.lower() and "physical" in prompt.lower()
            
            # Prepare the vision request payload
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
            
            # Send vision request to LM Studio
            headers = {"Content-Type": "application/json"}
            response = requests.post(
                f"{self.base_url}/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                raise Exception(f"Vision API error: {response.status_code}")
            
            # Parse the response
            response_data = response.json()
            vision_response = response_data.get('choices', [{}])[0].get('message', {}).get('content', '')
            
            # If this is an appearance prompt or parse_as_json is False, return raw text
            if is_appearance_prompt or not parse_as_json:
                return vision_response
            
            # Otherwise parse as structured data
            return self._parse_vision_response(vision_response)
            
        except Exception as e:
            print(f"LMStudio vision error: {str(e)}")
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
