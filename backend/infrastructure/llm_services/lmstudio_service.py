import base64
import json
import re

import requests
from infrastructure.llm_services.llm_service import BaseLLMService  # type: ignore
from domain.services.max_tokens_service import MaxTokensService, TokenContext


class LMStudioService(BaseLLMService):
    def __init__(self, config):
        super().__init__(config)
        self.base_url = config.get('base_url') or config.get('url', 'http://localhost:1234')

    def _fetch_models(self):
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
    
    def chat_completion(self, payload):
        """Non-streaming chat completion."""
        try:
            # Prepare completion parameters
            completion_params = {'stream': False}  # Disable streaming
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
                
            # Make blocking request
            response = requests.post(f"{self.base_url}/v1/chat/completions", 
                                   json=completion_params, 
                                   timeout=120)
            response.raise_for_status()
            
            # Parse response and return full data (including usage information)
            data = response.json()
            if 'choices' in data and len(data['choices']) > 0:
                return data  # Return full response including usage info
            else:
                raise Exception("No response content received")
                
        except Exception as e:
            raise Exception(f"LMStudio chat completion failed: {str(e)}")
            
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
                
            # Stream the response - use longer timeout for story generation
            with requests.post(f"{self.base_url}/v1/chat/completions",
                             json=completion_params,
                             stream=True,
                             timeout=300) as resp:  # 5 minute timeout for long generations
                resp.raise_for_status()
                # Use minimal buffering for real-time streaming
                # Process Server-Sent Events line by line for real-time streaming
                for line in resp.iter_lines(decode_unicode=False, chunk_size=1):
                    if line:
                        # Decode the line to check its content
                        line_str = line.decode('utf-8', errors='ignore').strip()
                        # LM Studio returns SSE format: "data: {...}"
                        if line_str.startswith('data: [DONE]'):
                            yield f"data: [DONE]\n\n".encode('utf-8')
                            break
                        elif line_str.startswith('data: '):
                            yield f"{line_str}\n\n".encode('utf-8')
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
            
            # Create a focused character generation prompt
            focused_prompt = f"""
Look at this image and create a character based on what you see. Generate ONLY the following information in JSON format:

{prompt}

Return a JSON object with exactly these 3 fields:
- "name": A fitting name for this character
- "appearance": Detailed physical description based on the image
- "backstory": A short, interesting backstory (2-3 sentences)

Example format:
{{
  "name": "Character Name",
  "appearance": "Detailed physical description...",
  "backstory": "Short backstory..."
}}
"""
            
            # Prepare the vision request payload (no streaming for vision)
            payload = {
                "model": vision_model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": focused_prompt
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
                "max_tokens": MaxTokensService.get_max_tokens(TokenContext.VISION_ANALYSIS),
                "temperature": 0.3,
                "stream": False
            }
            
            # Send vision request to LM Studio (non-streaming)
            headers = {"Content-Type": "application/json"}
            response = requests.post(
                f"{self.base_url}/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=120
            )
            
            if response.status_code != 200:
                raise Exception(f"Vision API error: {response.status_code} - {response.text}")
            
            # Process non-streaming response
            result = response.json()
            if 'choices' not in result or len(result['choices']) == 0:
                raise Exception(f"No choices in vision response: {result}")
            
            message = result['choices'][0].get('message', {})
            vision_response = message.get('content', '')
            
            if not vision_response:
                raise Exception(f"Empty content in vision response: {result}")
            
            # If this is an appearance prompt or parse_as_json is False, return raw text
            if is_appearance_prompt or not parse_as_json:
                return vision_response
            
            # Otherwise parse as structured data
            return self._parse_vision_response(vision_response)
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"LMStudio vision error: {str(e)}")
            logger.error(f"Response status: {response.status_code if 'response' in locals() else 'No response'}")
            if 'response' in locals():
                logger.error(f"Response body: {response.text}")
            raise

    def _parse_vision_response(self, vision_response):
        """Parse the vision response to extract simplified character data."""
        from infrastructure.llm_services.llm_service import parse_json_response

        # Define required fields for simplified character generation
        required_fields = ['name', 'appearance', 'backstory']
        
        # Define schema sample for validation
        schema_sample = {
            "name": "Character Name",
            "appearance": "Physical description",
            "backstory": "Character background"
        }
        
        # Parse the simplified response
        parsed_data = parse_json_response(vision_response, required_fields, schema_sample)
        
        # Add default values for fields expected by the frontend but not generated
        parsed_data['alias'] = parsed_data.get('alias', '')
        parsed_data['role'] = parsed_data.get('role', 'Character')
        parsed_data['gender'] = parsed_data.get('gender', '')
        parsed_data['extraInfo'] = parsed_data.get('extraInfo', 'Generated from photo')
        
        return parsed_data
