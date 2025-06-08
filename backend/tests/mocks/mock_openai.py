class MockOpenAIService:
    def __init__(self, api_key):
        self.api_key = api_key
    def get_models(self):
        return ['gpt-4', 'gpt-3.5-turbo']
    def test_connection(self):
        return {
            'status': 'connected',
            'models': self.get_models(),
            'server_info': {'version': '2024-06'}
        }
    def mask_api_key(self):
        if not self.api_key or len(self.api_key) < 6:
            return '*' * len(self.api_key)
        return self.api_key[:3] + '*' * (len(self.api_key)-4) + self.api_key[-1]
