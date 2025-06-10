import json
from unittest.mock import Mock, patch


class TestLLMProxyController:
    @patch('llm_service.get_active_llm_service')
    def test_proxy_models_lmstudio(self, mock_service, client):
        """Test proxying models request to LM Studio"""
        mock_llm = Mock()
        # Patch get_models/chat_completion directly to avoid real HTTP call
        mock_llm.get_models.return_value = ['llama-7b', 'codellama']
        mock_service.return_value = mock_llm
        # Patch llm_proxy_controller to use the mock service
        import backend.llm_services.llm_proxy_controller as llm_proxy_controller
        llm_proxy_controller.get_llm_service = lambda backend_type, config: mock_llm
        # Insert a dummy active settings row to avoid 400/502
        from db import get_db_connection
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('DELETE FROM settings')
        c.execute('''INSERT INTO settings (user_id, backend_type, config_json, is_active) VALUES (?, ?, ?, 1)''',
                  (None, 'lmstudio', '{"url": "http://localhost:1234"}'))
        conn.commit()
        conn.close()
        response = client.get('/proxy/llm/v1/models')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['data']) == 2
        assert data['data'][0]['id'] == 'llama-7b'

    @patch('llm_service.get_active_llm_service')
    def test_proxy_chat_completions(self, mock_service, client):
        """Test proxying chat completions"""
        mock_llm = Mock()
        # Patch get_models/chat_completion directly to avoid real HTTP call
        mock_llm.chat_completion.return_value = {
            'choices': [{'message': {'content': 'Test response'}}]
        }
        mock_service.return_value = mock_llm
        import backend.llm_services.llm_proxy_controller as llm_proxy_controller
        llm_proxy_controller.get_llm_service = lambda backend_type, config: mock_llm
        # Insert a dummy active settings row to avoid 400/502
        from db import get_db_connection
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('DELETE FROM settings')
        c.execute('''INSERT INTO settings (user_id, backend_type, config_json, is_active) VALUES (?, ?, ?, 1)''',
                  (None, 'lmstudio', '{"url": "http://localhost:1234"}'))
        conn.commit()
        conn.close()
        request_data = {
            'model': 'llama-7b',
            'messages': [{'role': 'user', 'content': 'Hello'}]
        }
        response = client.post('/proxy/llm/v1/chat/completions',
                             data=json.dumps(request_data),
                             content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['choices'][0]['message']['content'] == 'Test response'
