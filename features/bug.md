# Feature: Multi-LLM Backend Support

## Current State Analysis

The frontend currently has a SettingsPage with basic LM Studio configuration. The backend has a `lmstudio_proxy_controller` that proxies requests to LM Studio running on Windows (port 1234) while the backend runs on WSL (port 5000) and frontend on Windows (port 3000).

**Current Issues:**
- Settings page is hardcoded for LM Studio only
- Settings are stored in localStorage, not database
- No support for multiple LLM backends (Ollama, ChatGPT)
- Limited connection testing and status display
- No centralized backend configuration management

## Required Changes

### 1. Backend Changes

#### 1.1 Database Schema Updates
- Add `settings` table to store LLM backend configurations
- Fields: `id`, `user_id`, `backend_type`, `config_json`, `is_active`, `created_at`, `updated_at`

#### 1.2 New Backend Controllers
- **Settings Controller** (`settings_controller.py`):
  - `GET /api/settings/llm` - Get current LLM settings
  - `POST /api/settings/llm` - Save LLM settings
  - `POST /api/settings/llm/test` - Test connection to selected backend
  - `GET /api/settings/llm/status` - Get current backend status
  - `GET /api/settings/llm/models` - Get available models from active backend

#### 1.3 LLM Backend Abstraction
- **Base LLM Service** (`llm_service.py`):
  - Abstract base class for all LLM backends
  - Common interface: `get_models()`, `test_connection()`, `chat_completion()`
  
- **LM Studio Service** (`lmstudio_service.py`):
  - Extend base service for LM Studio API
  - Handle Windows host communication from WSL
  
- **Ollama Service** (`ollama_service.py`):
  - Extend base service for Ollama API
  
- **OpenAI Service** (`openai_service.py`):
  - Extend base service for OpenAI API

#### 1.4 Update Existing Proxy Controller
- Modify `lmstudio_proxy_controller.py` to use the new service layer
- Make it backend-agnostic using the active LLM service and rename oit to `llm_proxy_controller.py`

### 2. Frontend Changes

#### 2.1 Settings Page Redesign
**Replace current LM Studio-only UI with:**

1. **Backend Selection Section:**
   - Dropdown: "LM Studio", "Ollama", "ChatGPT"
   - Dynamic configuration form based on selection

2. **Configuration Forms:**
   - **LM Studio/Ollama:** URL/Address field (default: localhost:1234 for LM Studio, localhost:11434 for Ollama)
   - **ChatGPT:** API Key field (password input)

3. **Connection Testing:**
   - "Test Connection" button
   - Real-time status display (Connected/Disconnected/Error)
   - Error message display

4. **Model Selection:**
   - Dropdown populated from `GET /api/settings/llm/models`
   - "Refresh Models" button
   - Default model selection

5. **Status Dashboard:**
   - Current backend type
   - Connection status
   - Active model
   - Last connection test timestamp

#### 2.2 Service Layer Updates
- **Update `settings.ts`:**
  - Remove localStorage dependency
  - Add API calls to backend settings endpoints
  - Support multiple backend types

- **Create `llmBackend.ts`:**
  - Interface definitions for different backend types
  - API calls for testing connections and fetching models

#### 2.3 Type Definitions
- **Update `LMStudioTypes.ts` → `LLMTypes.ts`:**
  ```typescript
  type BackendType = 'lmstudio' | 'ollama' | 'chatgpt';
  
  interface LLMConfig {
    backendType: BackendType;
    lmstudio?: { url: string; };
    ollama?: { url: string; };
    chatgpt?: { apiKey: string; };
    defaultModel?: string;
  }
  ```

### 3. Implementation Order

1. **Phase 1: Backend Foundation**
   - Add settings table to database
   - Create base LLM service interface
   - Implement LM Studio service (migrate existing logic)
   - Create settings controller with basic CRUD

2. **Phase 2: Multi-Backend Support**
   - Implement Ollama and OpenAI services
   - Add connection testing endpoints
   - Update proxy controller to use service layer

3. **Phase 3: Frontend Integration**
   - Update TypeScript types
   - Redesign Settings page UI
   - Integrate with new backend API
   - Remove localStorage dependency

4. **Phase 4: Testing & Polish**
   - Test all three backend types
   - Handle edge cases and errors
   - Add loading states and user feedback
   - Documentation updates

### 4. Technical Considerations

- **WSL Communication:** Ensure backend can reach Windows localhost (use `192.168.32.1` or `host.docker.internal` or Windows IP)
- **CORS:** Backend proxy eliminates CORS issues for all backends
- **Error Handling:** Robust error handling for network timeouts and API failures  
- **Security:** Encrypt API keys in database, don't log sensitive data
- **Migration:** Migrate existing localStorage settings to database on first load

### 5. Success Criteria

- [ ] Users can select between LM Studio, Ollama, and ChatGPT
- [ ] Settings are persisted in database per user
- [ ] Connection testing works for all backend types
- [ ] Model listing and selection works for all backends
- [ ] Real-time status display shows current backend state
- [ ] Existing story generation continues to work with new system
- [ ] No CORS errors in browser console

### 6. Backend Testing Strategy

#### 6.1 Test Structure
Create a comprehensive test suite in `backend/tests/` directory:

```
backend/tests/
├── __init__.py
├── conftest.py                    # Pytest configuration and fixtures
├── test_settings_controller.py    # Settings API endpoint tests
├── test_llm_services.py          # LLM service layer tests
├── test_llm_proxy_controller.py   # Proxy controller tests
└── mocks/
    ├── __init__.py
    ├── mock_lmstudio.py           # Mock LM Studio responses
    ├── mock_ollama.py             # Mock Ollama responses
    └── mock_openai.py             # Mock OpenAI responses
```

#### 6.2 Test Dependencies
Add to `requirements.txt`:
```
pytest>=7.0.0
pytest-flask>=1.2.0
pytest-mock>=3.8.0
requests-mock>=1.9.0
```

#### 6.3 Core Test Files

**`conftest.py` - Test Configuration:**
```python
import pytest
import tempfile
import os
from app import create_app
from db import init_db

@pytest.fixture
def app():
    # Create temporary database for testing
    db_fd, db_path = tempfile.mkstemp()
    
    app = create_app()
    app.config['TESTING'] = True
    app.config['DATABASE'] = db_path
    
    with app.app_context():
        init_db()
    
    yield app
    
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers():
    # Mock authentication headers
    return {'Authorization': 'Bearer test_token'}
```

**`test_settings_controller.py` - Settings API Tests:**
```python
import json
import pytest
from unittest.mock import patch

class TestSettingsController:
    
    def test_get_llm_settings_empty(self, client, auth_headers):
        """Test getting LLM settings when none exist"""
        response = client.get('/api/settings/llm', headers=auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['backend_type'] is None
    
    def test_save_lmstudio_settings(self, client, auth_headers):
        """Test saving LM Studio settings"""
        settings_data = {
            'backend_type': 'lmstudio',
            'config': {'url': 'http://localhost:1234'},
            'default_model': 'llama-7b'
        }
        
        response = client.post('/api/settings/llm', 
                             headers=auth_headers,
                             data=json.dumps(settings_data),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['backend_type'] == 'lmstudio'
        assert data['config']['url'] == 'http://localhost:1234'
    
    def test_save_ollama_settings(self, client, auth_headers):
        """Test saving Ollama settings"""
        settings_data = {
            'backend_type': 'ollama',
            'config': {'url': 'http://localhost:11434'},
            'default_model': 'llama2'
        }
        
        response = client.post('/api/settings/llm',
                             headers=auth_headers,
                             data=json.dumps(settings_data),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['backend_type'] == 'ollama'
    
    def test_save_openai_settings(self, client, auth_headers):
        """Test saving OpenAI settings"""
        settings_data = {
            'backend_type': 'chatgpt',
            'config': {'api_key': 'sk-test123'},
            'default_model': 'gpt-4'
        }
        
        response = client.post('/api/settings/llm',
                             headers=auth_headers,
                             data=json.dumps(settings_data),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['backend_type'] == 'chatgpt'
        assert 'api_key' not in data['config']  # Should be masked in response
    
    @patch('llm_service.LMStudioService.test_connection')
    def test_connection_test_success(self, mock_test, client, auth_headers):
        """Test successful connection test"""
        mock_test.return_value = {'status': 'connected', 'models': ['llama-7b']}
        
        test_data = {
            'backend_type': 'lmstudio',
            'config': {'url': 'http://localhost:1234'}
        }
        
        response = client.post('/api/settings/llm/test',
                             headers=auth_headers,
                             data=json.dumps(test_data),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'connected'
        assert 'llama-7b' in data['models']
    
    @patch('llm_service.LMStudioService.test_connection')
    def test_connection_test_failure(self, mock_test, client, auth_headers):
        """Test failed connection test"""
        mock_test.side_effect = Exception("Connection refused")
        
        test_data = {
            'backend_type': 'lmstudio',
            'config': {'url': 'http://localhost:1234'}
        }
        
        response = client.post('/api/settings/llm/test',
                             headers=auth_headers,
                             data=json.dumps(test_data),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'error'
        assert 'Connection refused' in data['error']
```

**`test_llm_services.py` - Service Layer Tests:**
```python
import pytest
from unittest.mock import patch, Mock
import requests_mock
from llm_service import LMStudioService, OllamaService, OpenAIService

class TestLMStudioService:
    
    def test_init(self):
        service = LMStudioService('http://localhost:1234')
        assert service.base_url == 'http://localhost:1234'
    
    @requests_mock.Mocker()
    def test_get_models_success(self, m):
        m.get('http://localhost:1234/v1/models', 
              json={'data': [{'id': 'llama-7b'}, {'id': 'codellama'}]})
        
        service = LMStudioService('http://localhost:1234')
        models = service.get_models()
        
        assert models == ['llama-7b', 'codellama']
    
    @requests_mock.Mocker()
    def test_get_models_failure(self, m):
        m.get('http://localhost:1234/v1/models', status_code=500)
        
        service = LMStudioService('http://localhost:1234')
        
        with pytest.raises(Exception):
            service.get_models()
    
    @requests_mock.Mocker()
    def test_test_connection_success(self, m):
        m.get('http://localhost:1234/v1/models',
              json={'data': [{'id': 'llama-7b'}]})
        
        service = LMStudioService('http://localhost:1234')
        result = service.test_connection()
        
        assert result['status'] == 'connected'
        assert result['models'] == ['llama-7b']

class TestOllamaService:
    
    @requests_mock.Mocker()
    def test_get_models_success(self, m):
        m.get('http://localhost:11434/api/tags',
              json={'models': [{'name': 'llama2:7b'}, {'name': 'codellama:13b'}]})
        
        service = OllamaService('http://localhost:11434')
        models = service.get_models()
        
        assert models == ['llama2:7b', 'codellama:13b']

class TestOpenAIService:
    
    @requests_mock.Mocker()
    def test_get_models_success(self, m):
        m.get('https://api.openai.com/v1/models',
              json={'data': [{'id': 'gpt-4'}, {'id': 'gpt-3.5-turbo'}]})
        
        service = OpenAIService('sk-test123')
        models = service.get_models()
        
        assert models == ['gpt-4', 'gpt-3.5-turbo']
    
    def test_mask_api_key(self):
        service = OpenAIService('sk-1234567890abcdef')
        masked = service.mask_api_key()
        assert masked == 'sk-***************f'
```

**`test_llm_proxy_controller.py` - Proxy Controller Tests:**
```python
import json
from unittest.mock import patch

class TestLLMProxyController:
    
    @patch('llm_service.get_active_llm_service')
    def test_proxy_models_lmstudio(self, mock_service, client):
        """Test proxying models request to LM Studio"""
        mock_llm = Mock()
        mock_llm.get_models.return_value = ['llama-7b', 'codellama']
        mock_service.return_value = mock_llm
        
        response = client.get('/proxy/llm/v1/models')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['data']) == 2
        assert data['data'][0]['id'] == 'llama-7b'
    
    @patch('llm_service.get_active_llm_service')
    def test_proxy_chat_completions(self, mock_service, client):
        """Test proxying chat completions"""
        mock_llm = Mock()
        mock_llm.chat_completion.return_value = {
            'choices': [{'message': {'content': 'Test response'}}]
        }
        mock_service.return_value = mock_llm
        
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
```

#### 6.4 Test Execution Commands

Add to project root:

**`run_tests.sh`:**
```bash
#!/bin/bash
cd backend
python -m pytest tests/ -v --tb=short
```

**`run_tests_coverage.sh`:**
```bash
#!/bin/bash
cd backend
python -m pytest tests/ --cov=. --cov-report=html --cov-report=term
```

#### 6.5 Mock Services for Development

**`mocks/mock_lmstudio.py`:**
```python
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
```

#### 6.6 Integration with CI/CD

Add GitHub Actions workflow (`.github/workflows/backend-tests.yml`):
```yaml
name: Backend Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
    - name: Run tests
      run: |
        cd backend
        python -m pytest tests/ -v
```

#### 6.7 Test Data Management

**Test Database Fixtures:**
- Create sample user data for testing
- Mock LLM service responses
- Test data cleanup between test runs
- Database migration testing

#### 6.8 Performance Testing

**Load Testing for Proxy Endpoints:**
```python
def test_proxy_performance(client):
    """Test proxy endpoint performance under load"""
    import time
    
    start_time = time.time()
    for _ in range(100):
        response = client.get('/proxy/llm/v1/models')
        assert response.status_code == 200
    
    duration = time.time() - start_time
    assert duration < 5.0  # Should complete 100 requests in under 5 seconds
```