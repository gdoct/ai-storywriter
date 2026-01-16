"""
Story Generation Node
Prepares LLM configuration for story generation - actual streaming happens at graph level
"""

import logging
import tiktoken
from typing import Dict, Any
from infrastructure.llm_services.llm_service import get_llm_service
from infrastructure.database.llm_repository import LLMRepository
from infrastructure.database.user_preferences_repository import UserPreferencesRepository
from domain.services.max_tokens_service import MaxTokensService, TokenContext
from ..models.response_models import StoryStreamingEvent

logger = logging.getLogger(__name__)


async def story_generation_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare LLM configuration for story generation.
    This node sets up the LLM config and payload - actual streaming happens at graph level.
    """
    try:
        user_id = state.get("user_id")
        generation_options = state.get("generation_options", {})
        final_prompt = state.get("final_prompt", "")

        # Parse system and user prompts from final_prompt
        if "System:" in final_prompt and "User:" in final_prompt:
            parts = final_prompt.split("\n\nUser:", 1)
            system_prompt = parts[0].replace("System: ", "").strip()
            user_prompt = parts[1].strip() if len(parts) > 1 else ""
        else:
            # Fallback
            system_prompt = "You are a creative writer. Write engaging stories based on the provided scenario."
            user_prompt = f"Write a story based on this scenario: {state.get('scenario', {}).get('synopsis', 'No synopsis provided')}"

        streaming_events = []
        current_step = state.get("current_step", 0) + 1

        # Get user's LLM configuration
        user_prefs = UserPreferencesRepository.get_user_preferences(user_id)
        if not user_prefs:
            raise ValueError("User preferences not found")

        # Determine LLM mode and configuration
        llm_mode = user_prefs.get('llm_mode', 'member')

        # Get LLM service configuration
        config = {}
        if llm_mode == 'byok':
            byok_provider = user_prefs.get('byok_provider')
            if not byok_provider:
                raise ValueError("BYOK mode enabled but no provider configured")
            config = {
                'provider_type': byok_provider,
                'api_key': 'user_provided_key'
            }
        else:
            # Member mode - use admin configuration
            enabled_providers = LLMRepository.get_enabled_providers_by_backend_type('text')
            if not enabled_providers:
                raise ValueError("No LLM providers available")

            selected_provider = enabled_providers[0]
            config = {
                'provider_type': selected_provider['provider_name'],
                'base_url': selected_provider.get('base_url')
            }

            api_key = LLMRepository.get_provider_admin_key(selected_provider['provider_name'])
            if api_key:
                config['api_key'] = api_key

        # Get the configured model or use default from provider
        model_name = generation_options.get('model')
        if not model_name:
            try:
                service_temp = get_llm_service(config['provider_type'], config)
                available_models = service_temp.get_models()
                if available_models:
                    model_name = available_models[0]
                else:
                    model_name = "gpt-3.5-turbo"
            except Exception as e:
                logger.warning(f"Failed to get available models: {e}")
                model_name = "gpt-3.5-turbo"

        # Build LLM service payload
        payload = {
            'model': model_name,
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt}
            ],
            'temperature': generation_options.get('temperature', 0.8),
            'max_tokens': MaxTokensService.get_max_tokens(
                TokenContext.STORY_GENERATION,
                override=generation_options.get('max_tokens')
            ),
            'stream': True
        }

        if generation_options.get('seed'):
            payload['seed'] = generation_options['seed']

        # Token counting for credit deduction (estimate input tokens)
        try:
            encoding = tiktoken.encoding_for_model(model_name)
        except KeyError:
            encoding = tiktoken.get_encoding("cl100k_base")

        input_tokens = len(encoding.encode(final_prompt))

        # Update processing summary
        processing_summary = state.get("processing_summary", {})
        processing_summary["nodes_processed"] = processing_summary.get("nodes_processed", 0) + 1

        # Store config for streaming at graph level
        return {
            **state,
            "llm_config": config,
            "llm_payload": payload,
            "model_name": model_name,
            "input_tokens": input_tokens,
            "current_step": current_step,
            "streaming_events": streaming_events,
            "processing_summary": processing_summary,
            "ready_for_streaming": True  # Signal that we're ready to stream
        }

    except Exception as e:
        logger.error(f"Story generation setup failed: {str(e)}")
        return {
            **state,
            "error": f"Story generation failed: {str(e)}",
            "streaming_events": [StoryStreamingEvent(
                type="error",
                error=f"Story generation failed: {str(e)}"
            )]
        }


def _extract_text_from_chunk(chunk) -> str:
    """
    Extract text content from streaming chunk
    Different providers have different formats
    """
    try:
        import json

        # Convert bytes to string if needed
        if isinstance(chunk, bytes):
            chunk = chunk.decode('utf-8')

        # Ensure we have a string
        if not isinstance(chunk, str):
            return ''

        # Handle Server-Sent Events format
        if chunk.startswith('data: '):
            chunk = chunk[6:]  # Remove 'data: ' prefix

        if chunk.strip() == '[DONE]':
            return ''
        
        # Parse JSON
        data = json.loads(chunk)
        
        # Extract text from different provider formats
        if 'choices' in data and len(data['choices']) > 0:
            choice = data['choices'][0]
            
            # OpenAI format
            if 'delta' in choice and 'content' in choice['delta']:
                return choice['delta']['content']
            
            # Other formats
            if 'text' in choice:
                return choice['text']
        
        return ''
        
    except (json.JSONDecodeError, KeyError, IndexError, UnicodeDecodeError):
        # If parsing fails, try to return the chunk as plain text
        if isinstance(chunk, bytes):
            try:
                return chunk.decode('utf-8')
            except UnicodeDecodeError:
                return ''
        return chunk if isinstance(chunk, str) else ''