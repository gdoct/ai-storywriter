import requests
from llm_service import BaseLLMService


class OllamaService(BaseLLMService):
    def __init__(self, config):
        super().__init__(config)
        self.base_url = config.get('url', 'http://localhost:11434')

    def get_models(self):
        resp = requests.get(f"{self.base_url}/api/tags", timeout=10)
        resp.raise_for_status()
        data = resp.json()
        return [m['name'] for m in data.get('models', [])]

    def test_connection(self):
        try:
            models = self.get_models()
            return {'status': 'connected', 'models': models}
        except Exception as e:
            return {'status': 'error', 'error': str(e)}

    def chat_completion_stream(self, payload):
        try:
            # Adapt the payload for Ollama API format
            model = payload.get('model')
            if not model:
                # Get first available model if none specified
                models = self.get_models()
                model = models[0] if models else 'llama2'
            
            ollama_payload = {
                'model': model,
                'messages': payload.get('messages', []),
                'stream': True,
                'options': {}
            }
            
            # Add temperature if provided
            if 'temperature' in payload and payload['temperature'] is not None:
                ollama_payload['options']['temperature'] = float(payload['temperature'])
                
            # Add seed if provided
            if 'seed' in payload and payload['seed'] is not None:
                ollama_payload['options']['seed'] = int(payload['seed'])
                
            # Stream the response
            with requests.post(f"{self.base_url}/api/chat", 
                             json=ollama_payload, 
                             stream=True, 
                             timeout=60) as resp:
                resp.raise_for_status()
                for chunk in resp.iter_content(chunk_size=4096):
                    if chunk:
                        yield chunk
        except Exception as e:
            import traceback
            print(f"Error in Ollama chat_completion_stream: {str(e)}")
            print(traceback.format_exc())
            raise
