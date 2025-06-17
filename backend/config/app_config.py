"""
Main application configuration management.

This module provides functions to access and update various application configurations.
"""

from config.character_config import (CHARACTER_FALLBACK_TEMPLATE,
                                     CHARACTER_REQUIRED_FIELDS,
                                     CHARACTER_SCHEMA_SAMPLE)
from config.vision_config import get_vision_config


def get_vision_model_config(backend_type=None, model_name=None):
    """
    Get vision model configuration.
    
    Args:
        backend_type (str, optional): Backend type ('ollama', 'chatgpt', etc.)
        model_name (str, optional): Model name to override the default
        
    Returns:
        dict: Vision model configuration with model name, timeout, and options
    """
    if not backend_type:
        # Get active backend from settings
        from data.db import get_db_connection
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('SELECT backend_type FROM settings WHERE is_active=1 ORDER BY id DESC LIMIT 1')
        row = c.fetchone()
        conn.close()
        
        if not row:
            raise ValueError("No active backend configured")
        
        backend_type = row['backend_type']
    
    # Get vision config for the backend
    config = get_vision_config(backend_type)
    
    # Override model if specified
    if model_name:
        config['model'] = model_name
    
    return config
