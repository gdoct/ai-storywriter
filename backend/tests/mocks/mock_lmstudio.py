class MockLMStudioService:
    def __init__(self, base_url):
        self.base_url = base_url
    
    def get_models(self):
        return ['llama-7b-chat', 'codellama-13b', 'mistral-7b']
    
    def test_connection(self):
        return {
            'status': 'connected',
            'models': self.get_models(),
            'server_info': {'version': '0.2.9'}
        }
