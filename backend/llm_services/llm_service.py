import abc
import json
import re

from config.character_config import (CHARACTER_FALLBACK_TEMPLATE,
                                     CHARACTER_REQUIRED_FIELDS,
                                     CHARACTER_SCHEMA_SAMPLE)
from data.db import get_db_connection


def parse_json_response(text_response, required_fields=None, schema_sample=None):
    """Parse a text response to extract JSON data.
    
    This utility function is shared across all LLM services to parse
    JSON data from AI responses in a consistent way. It handles various
    formats including markdown code blocks and incomplete JSON.
    
    Args:
        text_response (str): The raw text response from the AI
        required_fields (list): Optional list of field names that must be present
        schema_sample (dict): Optional sample JSON structure for validation
        
    Returns:
        dict: Parsed JSON data with required fields ensured
        
    Example schema_sample for character generation:
        {
            "name": "Character Name",
            "alias": "Character Alias", 
            "role": "Main/Supporting/Antagonist",
            "gender": "Male/Female/Other",
            "appearance": "Physical description",
            "backstory": "Character background",
            "extraInfo": "Additional details"
        }
    """
    # Try to extract JSON from markdown code blocks
    markdown_json_match = re.search(r'```json\s*(\{.*?\})\s*```', text_response, re.DOTALL)
    if markdown_json_match:
        json_text = markdown_json_match.group(1)
    else:
        # Look for JSON that might be incomplete (missing closing brace or markdown)
        json_start_match = re.search(r'```json\s*(\{.*)', text_response, re.DOTALL)
        if json_start_match:
            # Found start of JSON in markdown, try to extract and fix it
            raw_json = json_start_match.group(1)
            # Remove any trailing ``` if present
            raw_json = re.sub(r'\s*```\s*$', '', raw_json)
            
            # Try to fix incomplete JSON by adding missing closing brace
            if raw_json.count('{') > raw_json.count('}'):
                raw_json = raw_json.rstrip() + '}'
            
            json_text = raw_json
        else:
            # Fallback to looking for any JSON object
            json_match = re.search(r'\{.*\}', text_response, re.DOTALL)
            if json_match:
                json_text = json_match.group()
            else:
                json_text = None
    
    if json_text:
        try:
            parsed_data = json.loads(json_text)
            
            # Ensure all required fields are present if specified
            if required_fields:
                for field in required_fields:
                    if field not in parsed_data:
                        parsed_data[field] = ""
            
            return parsed_data
        except json.JSONDecodeError as json_err:
            raise ValueError(f"Invalid JSON in response: {json_err}")
    else:
        raise ValueError("No valid JSON found in response")


class BaseLLMService(abc.ABC):
    """Abstract base class for LLM backends."""
    
    def __init__(self, config):
        self.config = config

    @abc.abstractmethod
    def _fetch_models(self):
        """Fetch models from the backend API. Implemented by subclasses."""
        pass
    
    def get_models(self, use_cache: bool = True):
        """Get models with optional caching."""
        if not use_cache:
            return self._fetch_models()
        
        # Try to get from cache first
        from llm_services.model_cache import get_model_cache
        cache = get_model_cache()
        
        cached_models = cache.get(self.__class__.__name__.lower().replace('service', ''), self.config)
        if cached_models is not None:
            return cached_models
        
        # Cache miss - fetch from backend and cache result
        try:
            models = self._fetch_models()
            cache.set(self.__class__.__name__.lower().replace('service', ''), self.config, models)
            return models
        except Exception as e:
            # If fetch fails, return empty list and don't cache
            print(f"Failed to fetch models: {e}")
            return []

    @abc.abstractmethod
    def test_connection(self):
        pass
    
    @abc.abstractmethod
    def chat_completion(self, payload):
        """Returns a complete response as a string for blocking calls."""
        pass
    
    @abc.abstractmethod
    def chat_completion_stream(self, payload):
        """Returns a generator that yields response chunks for streaming."""
        pass
    
    @abc.abstractmethod
    def vision_completion(self, image_data, prompt, model=None):
        """Process image with vision AI and return structured response.
        
        Args:
            image_data: Raw image bytes
            prompt: Text prompt for vision analysis
            model: Optional model name (defaults to service-specific model)
            
        Returns:
            dict: Structured response data parsed from AI output
        """
        pass

def get_llm_service(backend_type, config):
    if backend_type == 'lmstudio':
        from llm_services.lmstudio_service import LMStudioService
        return LMStudioService(config)
    elif backend_type == 'ollama':
        from llm_services.ollama_service import OllamaService
        return OllamaService(config)
    elif backend_type == 'chatgpt':
        from llm_services.openai_service import OpenAIService
        return OpenAIService(config)
    elif backend_type == 'github':
        from llm_services.github_service import GitHubService
        return GitHubService(config)
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

def generate_character_from_image(image_data, user_prompt=""):
    """High-level function to generate character data from image using the active LLM service.
    
    This function provides a convenient interface for the character photo controller
    to generate character data from an uploaded image.
    """
    try:
        if not user_prompt.strip():
            raise ValueError("Prompt is required for character generation")
        
        # Get the active LLM service
        llm_service = get_active_llm_service()
        
        # Use the vision completion method
        raw_response = llm_service.vision_completion(image_data, user_prompt)
        
        # Get required fields and schema from config
        required_fields = CHARACTER_REQUIRED_FIELDS
        schema_sample = CHARACTER_SCHEMA_SAMPLE
        
        # Parse the response if it's a string, otherwise assume it's already parsed
        if isinstance(raw_response, str):
            character_data = parse_json_response(raw_response, required_fields, schema_sample)
        else:
            character_data = raw_response
            # Ensure required fields are present
            for field in required_fields:
                if field not in character_data:
                    character_data[field] = ""
        
        return character_data
    
    except Exception as e:
        # Fallback to a template if vision fails
        character_data = CHARACTER_FALLBACK_TEMPLATE.copy()
        
        return character_data

def generate_field_from_image(image_data, field_name, character_context="", user_prompt=""):
    """Generate a specific field value for a character from an image.
    
    This is a specialized version of generate_character_from_image that focuses
    on generating just a single field (like appearance) instead of a complete character.
    
    Args:
        image_data (bytes): Raw image data
        field_name (str): The field to generate (e.g., 'appearance')
        character_context (str): Optional existing character information for context
        user_prompt (str): Optional user prompt to guide generation
        
    Returns:
        str: Generated text for the requested field
    """
    try:
        if not user_prompt.strip():
            # Build a default prompt based on the field being requested
            if field_name.lower() == 'appearance':
                user_prompt = "Describe the physical appearance of this character based on the image."
                if character_context:
                    user_prompt += f" Character context: {character_context}"
            else:
                user_prompt = f"Generate the {field_name} for a character based on this image."
                if character_context:
                    user_prompt += f" Character context: {character_context}"
        
        # Get the active LLM service
        llm_service = get_active_llm_service()
        
        # Use the vision completion method (but with a field-specific prompt)
        raw_response = llm_service.vision_completion(image_data, user_prompt)
        
        # For appearance and other simple fields, we want plain text rather than JSON
        if isinstance(raw_response, str):
            # Clean up the response - remove any JSON formatting, quotes, etc.
            text = raw_response.strip()
            if text.startswith("```json") and text.endswith("```"):
                text = text[7:-3].strip()   
            # If it looks like JSON, try to extract just the field value
            if text.startswith('{') and text.endswith('}'):
                try:
                    import json
                    data = json.loads(text)
                    if field_name in data:
                        return data[field_name]
                except:
                    pass
            return text
        elif isinstance(raw_response, dict) and field_name in raw_response:
            # If we got JSON directly and it has our field, return just that field
            return raw_response[field_name]
        else:
            # Otherwise return the full response as a string
            return str(raw_response)
            
    except Exception as e:
        print(f"Error generating {field_name} from image: {str(e)}")
        return f"Could not generate {field_name} from image due to an error."

# Re-export for test imports
from llm_services.lmstudio_service import LMStudioService  # noqa: F401
from llm_services.ollama_service import OllamaService  # noqa: F401
from llm_services.openai_service import OpenAIService  # noqa: F401
# GitHubService import moved to avoid circular import - import directly when needed
