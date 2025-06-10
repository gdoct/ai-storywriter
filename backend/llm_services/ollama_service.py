import json

import requests
from llm_services.llm_service import BaseLLMService


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
                model = models[0] if models else 'gemma3:4b'

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
                
            # Map max_tokens to num_predict for Ollama
            if 'max_tokens' in payload and payload['max_tokens'] is not None:
                ollama_payload['options']['num_predict'] = int(payload['max_tokens'])
                
            # Map other OpenAI parameters to Ollama options
            if 'top_p' in payload and payload['top_p'] is not None:
                ollama_payload['options']['top_p'] = float(payload['top_p'])
                
            if 'frequency_penalty' in payload and payload['frequency_penalty'] is not None:
                ollama_payload['options']['frequency_penalty'] = float(payload['frequency_penalty'])
                
            if 'presence_penalty' in payload and payload['presence_penalty'] is not None:
                ollama_payload['options']['presence_penalty'] = float(payload['presence_penalty'])
                
            # Use /api/chat endpoint for chat completions
            with requests.post(f"{self.base_url}/api/chat", 
                             json=ollama_payload, 
                             stream=True, 
                             timeout=60) as resp:
                resp.raise_for_status()
                
                # Process streaming response and convert to OpenAI format
                for line in resp.iter_lines(decode_unicode=True):
                    if line.strip():
                        try:
                            # Parse each JSON line from Ollama
                            ollama_response = json.loads(line)
                            
                            # Convert Ollama chat response to OpenAI format
                            if 'message' in ollama_response:
                                content = ollama_response['message'].get('content', '')
                                
                                # Create OpenAI-compatible streaming response
                                openai_chunk = {
                                    "id": f"chatcmpl-{ollama_response.get('created_at', '')}",
                                    "object": "chat.completion.chunk",
                                    "created": int(ollama_response.get('created_at', '0').replace('T', '').replace('Z', '').replace('-', '').replace(':', '')[:10]) if ollama_response.get('created_at') else 0,
                                    "model": ollama_response.get('model', model),
                                    "choices": [{
                                        "index": 0,
                                        "delta": {
                                            "role": "assistant" if content else None,
                                            "content": content
                                        } if content else {"role": "assistant"},
                                        "finish_reason": "stop" if ollama_response.get('done', False) else None
                                    }]
                                }
                                
                                # Yield the chunk in Server-Sent Events format
                                chunk_data = f"data: {json.dumps(openai_chunk)}\n\n"
                                yield chunk_data.encode('utf-8')
                                
                                # Send final done message
                                if ollama_response.get('done', False):
                                    final_chunk = {
                                        "id": f"chatcmpl-{ollama_response.get('created_at', '')}",
                                        "object": "chat.completion.chunk",
                                        "created": int(ollama_response.get('created_at', '0').replace('T', '').replace('Z', '').replace('-', '').replace(':', '')[:10]) if ollama_response.get('created_at') else 0,
                                        "model": ollama_response.get('model', model),
                                        "choices": [{
                                            "index": 0,
                                            "delta": {},
                                            "finish_reason": "stop"
                                        }]
                                    }
                                    yield f"data: {json.dumps(final_chunk)}\n\n".encode('utf-8')
                                    yield b"data: [DONE]\n\n"
                                    
                        except json.JSONDecodeError as e:
                            # Only log parsing errors
                            print(f"Ollama JSON parsing error: {e}")
                            continue
        except Exception as e:
            import traceback

            # Only log failed requests
            print(f"Ollama error: {str(e)}")
            print(traceback.format_exc())
            raise
