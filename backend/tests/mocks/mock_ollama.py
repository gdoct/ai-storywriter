class MockOllamaService:
    def __init__(self, base_url):
        self.base_url = base_url
    def get_models(self):
        return ['llama2:7b', 'codellama:13b']
    def test_connection(self):
        return {
            'status': 'connected',
            'models': self.get_models(),
            'server_info': {'version': '0.1.0'}
        }
