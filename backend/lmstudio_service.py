import requests
from llm_service import BaseLLMService  # type: ignore


class LMStudioService(BaseLLMService):
    def __init__(self, config):
        super().__init__(config)
        self.base_url = config.get('url', 'http://192.168.32.1:1234')

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
            
            # Debug logging
            print(f"LMStudio Request URL: {self.base_url}/v1/chat/completions")
            print(f"LMStudio Request Payload: {completion_params}")
                
            # Stream the response
            with requests.post(f"{self.base_url}/v1/chat/completions", 
                             json=completion_params, 
                             stream=True, 
                             timeout=60) as resp:
                print(f"LMStudio Response Status: {resp.status_code}")
                print(f"LMStudio Response Headers: {dict(resp.headers)}")
                resp.raise_for_status()
                for chunk in resp.iter_content(chunk_size=4096):
                    if chunk:
                        yield chunk
        except Exception as e:
            import traceback
            print(f"Error in LMStudio chat_completion_stream: {str(e)}")
            print(traceback.format_exc())
            raise
