import requests
from llm_service import BaseLLMService


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
            print(f"Error in OpenAI chat_completion_stream: {str(e)}")
            print(traceback.format_exc())
            raise

    def mask_api_key(self):
        if not self.api_key or len(self.api_key) < 6:
            return '*' * len(self.api_key)
        return self.api_key[:3] + '*' * (len(self.api_key)-4) + self.api_key[-1]
