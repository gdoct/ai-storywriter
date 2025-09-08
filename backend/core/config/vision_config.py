"""
Vision models configuration.

This module defines configurations for vision AI models used in the StoryWriter application.
These settings can be adjusted without modifying the service implementation code.
"""

# Vision model configurations
VISION_MODELS = {
    # Default vision model for Ollama service
    'ollama': {
        'model': 'gemma-3-12b-it-max-horror-imatrix2',
        'timeout': 30,  # Request timeout in seconds
        'options': {
            # Additional model-specific options can be added here
            'temperature': 0.83,
            'top_p': 0.9,
        }
    },
    
    # Default vision model for OpenAI/ChatGPT service
    'chatgpt': {
        'model': 'gpt-4-vision-preview',
        'timeout': 60,
        'options': {
            'max_tokens': 1000
        }
    },
    
    # Default vision model for LMStudio service
    'lmstudio': {
        'model': 'default',  # LMStudio uses default loaded model
        'timeout': 45,
        'options': {}
    },
    
    # Default vision model for GitHub Models service
    'github': {
        'model': 'openai/gpt-4o',  # Vision-capable model available on GitHub Models
        'timeout': 60,
        'options': {
            'max_tokens': 1000
        }
    }
}

# Function to get vision model configuration for a specific backend
def get_vision_config(backend_type):
    """
    Get the vision model configuration for a specific backend.
    
    Args:
        backend_type (str): The backend type ('ollama', 'chatgpt', 'lmstudio', or 'github')
        
    Returns:
        dict: A configuration dictionary for the vision model
        
    Raises:
        ValueError: If the backend type is not supported
    """
    if backend_type not in VISION_MODELS:
        raise ValueError(f"Vision configuration not found for backend: {backend_type}")
    
    return VISION_MODELS[backend_type]
