"""
Integration tests for Story Generator Agent
Tests the full story generation pipeline with a real LLM backend (LM Studio)

Run with:
    cd backend && PYTHONPATH=. pytest tests/integration/test_story_generator.py -v -s
"""

import asyncio
import pytest

from agents.story_generator.story_graph import StoryGeneratorGraph
from agents.story_generator.models.request_models import (
    StoryGenerationRequest,
    Scenario,
    GenerationOptions,
    Character,
    StyleSettings
)
from infrastructure.llm_services.lmstudio_service import LMStudioService


# LM Studio configuration - uses localhost with default port
LMSTUDIO_CONFIG = {
    'base_url': 'http://localhost:1234',
    'url': 'http://localhost:1234'
}


def get_current_model():
    """Get the currently loaded model from LM Studio.

    LM Studio's /v1/models endpoint returns all available models,
    but the first one in the list is typically the loaded/active model.
    """
    service = LMStudioService(LMSTUDIO_CONFIG)
    try:
        models = service.get_models(use_cache=False)
        if models:
            return models[0]  # Return first available model
        return None
    except Exception as e:
        pytest.skip(f"LM Studio not available: {e}")


def create_simple_scenario():
    """Create a minimal scenario for testing."""
    return Scenario(
        id="test-scenario-001",
        title="The Lost Key",
        synopsis="A young detective finds a mysterious key that unlocks a secret room in an old mansion.",
        writing_style=StyleSettings(
            style="narrative",
            genre="mystery",
            tone="suspenseful"
        ),
        characters=[
            Character(
                id="char-001",
                name="Emma Parker",
                role="protagonist",
                gender="female",
                appearance="Young woman in her late twenties with sharp green eyes and auburn hair",
                backstory="A former police detective who now works as a private investigator"
            )
        ]
    )


@pytest.mark.integration
class TestStoryGeneratorIntegration:
    """Integration tests for the story generator agent."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures."""
        self.model = get_current_model()
        if not self.model:
            pytest.skip("No model loaded in LM Studio")

        # Verify LM Studio connection
        service = LMStudioService(LMSTUDIO_CONFIG)
        result = service.test_connection()
        if result.get('status') != 'connected':
            pytest.skip(f"LM Studio not connected: {result.get('error', 'Unknown error')}")

    @pytest.mark.asyncio
    async def test_simple_story_generation(self):
        """Test that a story is generated from a simple scenario."""
        # Arrange
        scenario = create_simple_scenario()
        generation_options = GenerationOptions(
            model=self.model,
            temperature=0.7,
            max_tokens=500,  # Keep small for faster testing
            stream=True
        )

        request = StoryGenerationRequest(
            scenario=scenario,
            generation_options=generation_options
        )

        graph = StoryGeneratorGraph()
        user_id = "test-user-001"

        # Act
        events = []
        story_content = ""

        async for event in graph.stream_story_generation(request, user_id):
            events.append(event)
            if event.type == "content" and event.content:
                story_content += event.content
            elif event.type == "complete" and event.story:
                story_content = event.story
            elif event.type == "error":
                pytest.fail(f"Story generation failed: {event.error}")

        # Assert
        assert len(events) > 0, "Should receive at least one event"
        assert len(story_content) > 0, "Should generate some story content"

        # Check we got a complete event
        complete_events = [e for e in events if e.type == "complete"]
        assert len(complete_events) == 1, "Should have exactly one complete event"

        complete_event = complete_events[0]
        assert complete_event.story is not None, "Complete event should have story"
        assert complete_event.total_tokens is not None, "Complete event should have token count"

        print(f"\n--- Generated Story ({complete_event.total_tokens} tokens) ---")
        print(story_content[:500] + "..." if len(story_content) > 500 else story_content)
        print("--- End of Story ---\n")

    @pytest.mark.asyncio
    async def test_story_generation_with_minimal_scenario(self):
        """Test story generation with only title and synopsis (no characters)."""
        # Arrange
        scenario = Scenario(
            id="test-scenario-minimal",
            title="A Walk in the Park",
            synopsis="Someone takes a peaceful walk and discovers something unexpected."
        )

        generation_options = GenerationOptions(
            model=self.model,
            temperature=0.7,
            max_tokens=300,
            stream=True
        )

        request = StoryGenerationRequest(
            scenario=scenario,
            generation_options=generation_options
        )

        graph = StoryGeneratorGraph()

        # Act
        events = []
        async for event in graph.stream_story_generation(request, "test-user"):
            events.append(event)
            if event.type == "error":
                pytest.fail(f"Story generation failed: {event.error}")

        # Assert
        complete_events = [e for e in events if e.type == "complete"]
        assert len(complete_events) == 1, "Should complete successfully"
        assert complete_events[0].story, "Should generate a story"


@pytest.mark.integration
class TestLMStudioConnection:
    """Tests for LM Studio connectivity and model availability."""

    def test_lmstudio_connection(self):
        """Test that we can connect to LM Studio."""
        service = LMStudioService(LMSTUDIO_CONFIG)
        result = service.test_connection()

        if result.get('status') == 'error':
            pytest.skip(f"LM Studio not available: {result.get('error')}")

        assert result['status'] == 'connected'
        assert 'models' in result
        print(f"Connected to LM Studio. Available models: {result['models']}")

    def test_get_models(self):
        """Test that we can retrieve available models."""
        service = LMStudioService(LMSTUDIO_CONFIG)

        try:
            models = service.get_models(use_cache=False)
        except Exception as e:
            pytest.skip(f"LM Studio not available: {e}")

        assert isinstance(models, list)
        if models:
            print(f"Available models: {models}")
            print(f"Current/first model: {models[0]}")

    def test_simple_chat_completion(self):
        """Test a simple chat completion to verify the model works."""
        model = get_current_model()
        if not model:
            pytest.skip("No model available")

        service = LMStudioService(LMSTUDIO_CONFIG)

        payload = {
            'model': model,
            'messages': [
                {'role': 'user', 'content': 'Say "Hello" and nothing else.'}
            ],
            'max_tokens': 10,
            'temperature': 0.1
        }

        response = service.chat_completion(payload)

        assert response is not None
        assert 'choices' in response
        assert len(response['choices']) > 0

        content = response['choices'][0]['message']['content']
        print(f"Model response: {content}")
        assert len(content) > 0


# Run tests with: cd backend && PYTHONPATH=. pytest tests/integration/test_story_generator.py -v -s
if __name__ == "__main__":
    import sys
    import os
    # Ensure we're in the right directory
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    os.chdir(backend_dir)
    sys.path.insert(0, backend_dir)
    pytest.main([__file__, "-v", "-s"])
