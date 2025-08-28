import base64
import json
import re

import requests
from llm_services.llm_service import BaseLLMService


class GitHubService(BaseLLMService):
    def __init__(self, config):
        super().__init__(config)
        self.github_token = config.get('githubToken')
        self.base_url = 'https://models.github.ai'
        # GitHub Models API endpoints (launched May 2025)
        self.chat_endpoint = 'https://models.github.ai/inference/chat/completions'
        self.catalog_endpoint = 'https://models.github.ai/catalog/models'

    def _fetch_models(self):
        """Fetch available models from GitHub Models API."""
        
        headers = {
            'Authorization': f'Bearer {self.github_token}',
            'Accept': 'application/json'
        }
        
        # Use the official GitHub Models catalog endpoint
        try:
            print(f"Trying catalog endpoint: {self.catalog_endpoint}")
            resp = requests.get(self.catalog_endpoint, headers=headers, timeout=10)
            print(f"Catalog response status: {resp.status_code}")
            resp.raise_for_status()
            data = resp.json()
            print(f"Catalog response data type: {type(data)}")
            print(f"Catalog response (first 3 items): {data[:3] if isinstance(data, list) else data}")
            
            # GitHub Models catalog returns a direct list of model objects
            if isinstance(data, list):
                models = data
            elif isinstance(data, dict) and 'models' in data:
                models = data['models']
            else:
                models = []
            
            print(f"Found {len(models)} models in catalog")
            
            # Extract model IDs from the model objects
            model_ids = []
            for model in models:
                if isinstance(model, dict):
                    # GitHub Models returns objects with 'id' field
                    if 'id' in model:
                        model_ids.append(model['id'])
                        print(f"Found model: {model['id']}")
                elif isinstance(model, str):
                    model_ids.append(model)
            
            if model_ids:
                print(f"Successfully extracted {len(model_ids)} model IDs")
                return model_ids
            else:
                raise Exception("No valid model IDs found in catalog response")
                
        except Exception as e:
            print(f"Catalog endpoint failed: {e}")
            
            # Try OpenAI-compatible models endpoint
            try:
                print(f"Trying OpenAI-compatible endpoint: {self.base_url}/v1/models")
                resp = requests.get(f"{self.base_url}/v1/models", headers=headers, timeout=10)
                print(f"OpenAI endpoint response status: {resp.status_code}")
                resp.raise_for_status()
                data = resp.json()
                return [m['id'] for m in data.get('data', [])]
            except Exception as e2:
                print(f"OpenAI endpoint also failed: {e2}")
                
                # Return some common GitHub Models as fallback
                print("Returning fallback model list")
                return [
                    'openai/gpt-4o-mini',
                    'openai/gpt-4o', 
                    'meta-llama/llama-3.3-70b-instruct',
                    'microsoft/phi-3.5-mini-instruct',
                    'mistralai/mistral-7b-instruct-v0.3'
                ]

    def test_connection(self):
        try:
            models = self.get_models()
            return {'status': 'connected', 'models': models}
        except Exception as e:
            return {'status': 'error', 'error': str(e)}
    
    def chat_completion(self, payload):
        """Non-streaming chat completion."""
        try:
            headers = {
                'Authorization': f'Bearer {self.github_token}',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            
            # GitHub Models uses Azure AI Inference format
            messages = payload.get('messages', [])
            
            github_payload = {
                'messages': messages,
                'model': payload.get('model', 'gpt-4o-mini'),
                'stream': False  # Disable streaming
            }
            
            # Add temperature if provided
            if 'temperature' in payload and payload['temperature'] is not None:
                github_payload['temperature'] = float(payload['temperature'])
                
            # Add max_tokens if provided  
            if 'max_tokens' in payload and payload['max_tokens'] is not None:
                github_payload['max_tokens'] = int(payload['max_tokens'])

            # Make blocking request
            response = requests.post(self.chat_endpoint,
                                   headers=headers,
                                   json=github_payload,
                                   timeout=120)
            response.raise_for_status()
            
            # Parse response
            data = response.json()
            if 'choices' in data and len(data['choices']) > 0:
                return data['choices'][0]['message']['content']
            else:
                raise Exception("No response content received")
                
        except Exception as e:
            raise Exception(f"GitHub Models chat completion failed: {str(e)}")

    def chat_completion_stream(self, payload):
        try:
            headers = {
                'Authorization': f'Bearer {self.github_token}',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            
            # GitHub Models uses Azure AI Inference format
            # Keep messages in OpenAI format (system, user, assistant messages)
            messages = payload.get('messages', [])
            
            # Prepare the payload for GitHub Models API (Azure AI Inference format)
            github_payload = {
                'model': payload.get('model', 'openai/gpt-4o-mini'),
                'messages': messages,  # Keep original format
                'stream': True
            }
            
            # Add optional parameters
            if 'temperature' in payload and payload['temperature'] is not None:
                github_payload['temperature'] = float(payload['temperature'])
                
            if 'max_tokens' in payload and payload['max_tokens'] is not None:
                github_payload['max_tokens'] = int(payload['max_tokens'])
                
            if 'top_p' in payload and payload['top_p'] is not None:
                github_payload['top_p'] = float(payload['top_p'])
            
            # Debug logging
            print(f"GitHub Models API call to: {self.chat_endpoint}")
            print(f"Model: {github_payload['model']}")
            print(f"Messages count: {len(messages)}")
            
            # Use the OpenAI-compatible chat completions endpoint
            with requests.post(self.chat_endpoint, 
                             json=github_payload, 
                             headers=headers, 
                             stream=True, 
                             timeout=60) as resp:
                print(f"Response status: {resp.status_code}")
                if resp.status_code != 200:
                    print(f"Error response: {resp.text}")
                resp.raise_for_status()
                
                for chunk in resp.iter_content(chunk_size=4096):
                    if chunk:
                        yield chunk
                        
        except Exception as e:
            import traceback
            print(f"GitHub Models error: {str(e)}")
            print(traceback.format_exc())
            
            # Return error response in SSE format
            error_response = f"data: {{\"error\": \"GitHub Models API error: {str(e)}\"}}\n\n"
            yield error_response.encode('utf-8')
    

    def vision_completion(self, image_data, prompt, model=None):
        """Process image with vision AI and return character data using GitHub Models."""
        try:
            # Convert image to base64
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            
            # Use a vision-capable model from GitHub Models
            # Note: This would need to be updated based on available vision models
            vision_model = model or "openai/gpt-4o"
            
            # Detect proper image type
            image_type = "image/jpeg"
            
            headers = {'Authorization': f'Bearer {self.github_token}'}
            
            # Prepare the vision request payload for GitHub Models (OpenAI-compatible)
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
            
            # Send vision request to GitHub Models chat completions endpoint
            response = requests.post(
                self.chat_endpoint,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                raise Exception(f"GitHub Models Vision API error: {response.status_code}")
            
            # Parse the response
            response_data = response.json()
            vision_response = response_data.get('choices', [{}])[0].get('message', {}).get('content', '')
            
            return self._parse_vision_response(vision_response)
            
        except Exception as e:
            print(f"GitHub Models vision error: {str(e)}")
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

    def mask_token(self):
        """Mask the GitHub token for display purposes."""
        if not self.github_token or len(self.github_token) < 6:
            return '*' * len(self.github_token) if self.github_token else ''
        return self.github_token[:4] + '*' * (len(self.github_token)-8) + self.github_token[-4:]