"""
Pytest configuration for integration tests.
These tests require external services (LM Studio) to be running.
"""

import os
import sys
import pytest

# Add backend to path for imports
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)


def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line(
        "markers", "integration: mark test as integration test (requires LM Studio)"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )


@pytest.fixture(scope="session")
def lmstudio_config():
    """LM Studio configuration fixture."""
    return {
        'base_url': os.getenv('LMSTUDIO_URL', 'http://localhost:1234'),
        'url': os.getenv('LMSTUDIO_URL', 'http://localhost:1234')
    }


@pytest.fixture(scope="session")
def lmstudio_service(lmstudio_config):
    """Create an LM Studio service instance."""
    from infrastructure.llm_services.lmstudio_service import LMStudioService
    return LMStudioService(lmstudio_config)


@pytest.fixture(scope="session")
def current_model(lmstudio_service):
    """Get the currently loaded model from LM Studio."""
    try:
        models = lmstudio_service.get_models(use_cache=False)
        if models:
            return models[0]
        pytest.skip("No models available in LM Studio")
    except Exception as e:
        pytest.skip(f"LM Studio not available: {e}")


@pytest.fixture
def story_generator():
    """Create a story generator graph instance."""
    from agents.story_generator.story_graph import StoryGeneratorGraph
    return StoryGeneratorGraph()
