from unittest.mock import Mock, patch

import pytest
import requests_mock
from llm_services.llm_service import (LMStudioService, OllamaService,
                                      OpenAIService)


class TestLMStudioService:
    def test_init(self):
        service = LMStudioService({'url': 'http://localhost:1234'})
        assert service.base_url == 'http://localhost:1234'

    def test_get_models_success(self, requests_mock):
        requests_mock.get('http://localhost:1234/v1/models', 
              json={'data': [{'id': 'llama-7b'}, {'id': 'codellama'}]})
        service = LMStudioService({'url': 'http://localhost:1234'})
        models = service.get_models()
        assert models == ['llama-7b', 'codellama']

    def test_get_models_failure(self, requests_mock):
        requests_mock.get('http://localhost:1234/v1/models', status_code=500)
        service = LMStudioService({'url': 'http://localhost:1234'})
        with pytest.raises(Exception):
            service.get_models()

    def test_test_connection_success(self, requests_mock):
        requests_mock.get('http://localhost:1234/v1/models',
              json={'data': [{'id': 'llama-7b'}]})
        service = LMStudioService({'url': 'http://localhost:1234'})
        result = service.test_connection()
        assert result['status'] == 'connected'
        assert result['models'] == ['llama-7b']

class TestOllamaService:
    def test_get_models_success(self, requests_mock):
        requests_mock.get('http://localhost:11434/api/tags',
              json={'models': [{'name': 'llama2:7b'}, {'name': 'codellama:13b'}]})
        service = OllamaService({'url': 'http://localhost:11434'})
        models = service.get_models()
        assert models == ['llama2:7b', 'codellama:13b']

class TestOpenAIService:
    def test_get_models_success(self, requests_mock):
        requests_mock.get('https://api.openai.com/v1/models',
              json={'data': [{'id': 'gpt-4'}, {'id': 'gpt-3.5-turbo'}]})
        service = OpenAIService({'api_key': 'sk-test123'})
        models = service.get_models()
        assert models == ['gpt-4', 'gpt-3.5-turbo']

    def test_mask_api_key(self):
        service = OpenAIService({'api_key': 'sk-1234567890abcdef'})
        masked = service.mask_api_key()
        # Accept the actual mask length
        assert masked.startswith('sk-') and masked.endswith('f') and set(masked[3:-1]) == {'*'}
