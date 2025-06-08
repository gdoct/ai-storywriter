import abc
import json

from db import get_db_connection


class BaseLLMService(abc.ABC):
    """Abstract base class for LLM backends."""
    
    def __init__(self, config):
        self.config = config

    @abc.abstractmethod
    def get_models(self):
        pass

    @abc.abstractmethod
    def test_connection(self):
        pass
    
    @abc.abstractmethod
    def chat_completion_stream(self, payload):
        """Returns a generator that yields response chunks for streaming."""
        pass

def get_llm_service(backend_type, config):
    if backend_type == 'lmstudio':
        from lmstudio_service import LMStudioService
        return LMStudioService(config)
    elif backend_type == 'ollama':
        from ollama_service import OllamaService
        return OllamaService(config)
    elif backend_type == 'chatgpt':
        from openai_service import OpenAIService
        return OpenAIService(config)
    else:
        raise ValueError(f"Unknown backend_type: {backend_type}")

def get_active_llm_service():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM settings WHERE is_active=1 ORDER BY updated_at DESC LIMIT 1')
    row = c.fetchone()
    conn.close()
    if not row:
        raise Exception('No active LLM backend configured')
    backend_type = row['backend_type']
    config = json.loads(row['config_json']) if row['config_json'] else {}
    return get_llm_service(backend_type, config)

# Re-export for test imports
from lmstudio_service import LMStudioService  # noqa: F401
from ollama_service import OllamaService  # noqa: F401
from openai_service import OpenAIService  # noqa: F401
