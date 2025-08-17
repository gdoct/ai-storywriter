"""
Model cache system for LLM services.

This module provides a centralized caching system for model lists
to avoid frequent API calls to LLM backends.
"""

import time
import json
from typing import Dict, List, Optional
from threading import Lock

class ModelCache:
    """Thread-safe model cache with automatic expiration."""
    
    def __init__(self, default_ttl: int = 3600):  # 1 hour default TTL
        self._cache: Dict[str, Dict] = {}
        self._lock = Lock()
        self.default_ttl = default_ttl
    
    def _get_cache_key(self, backend_type: str, config: dict) -> str:
        """Generate a unique cache key for the backend configuration."""
        # Create a stable key based on backend type and relevant config
        if backend_type == 'lmstudio':
            return f"{backend_type}:{config.get('url', 'default')}"
        elif backend_type == 'ollama':
            return f"{backend_type}:{config.get('url', 'default')}"
        elif backend_type == 'chatgpt':
            # Don't include the full API key in cache key for security
            api_key_hash = hash(config.get('api_key', '')) if config.get('api_key') else 'none'
            return f"{backend_type}:{api_key_hash}"
        elif backend_type == 'github':
            # Don't include the full token in cache key for security
            token_hash = hash(config.get('githubToken', '')) if config.get('githubToken') else 'none'
            return f"{backend_type}:{token_hash}"
        else:
            return f"{backend_type}:default"
    
    def get(self, backend_type: str, config: dict) -> Optional[List[str]]:
        """Get cached models for the given backend configuration."""
        cache_key = self._get_cache_key(backend_type, config)
        
        with self._lock:
            if cache_key not in self._cache:
                return None
            
            cache_entry = self._cache[cache_key]
            current_time = time.time()
            
            # Check if cache has expired
            if current_time > cache_entry['expires_at']:
                del self._cache[cache_key]
                return None
            
            return cache_entry['models']
    
    def set(self, backend_type: str, config: dict, models: List[str], ttl: Optional[int] = None) -> None:
        """Cache models for the given backend configuration."""
        cache_key = self._get_cache_key(backend_type, config)
        ttl = ttl or self.default_ttl
        expires_at = time.time() + ttl
        
        with self._lock:
            self._cache[cache_key] = {
                'models': models.copy(),
                'cached_at': time.time(),
                'expires_at': expires_at,
                'backend_type': backend_type
            }
    
    def invalidate(self, backend_type: str, config: dict) -> None:
        """Invalidate cached models for the given backend configuration."""
        cache_key = self._get_cache_key(backend_type, config)
        
        with self._lock:
            if cache_key in self._cache:
                del self._cache[cache_key]
    
    def invalidate_all(self) -> None:
        """Invalidate all cached models."""
        with self._lock:
            self._cache.clear()
    
    def get_cache_info(self) -> Dict:
        """Get information about the current cache state."""
        with self._lock:
            current_time = time.time()
            cache_info = {
                'total_entries': len(self._cache),
                'entries': []
            }
            
            for cache_key, entry in self._cache.items():
                cache_info['entries'].append({
                    'key': cache_key,
                    'backend_type': entry['backend_type'],
                    'model_count': len(entry['models']),
                    'cached_at': entry['cached_at'],
                    'expires_at': entry['expires_at'],
                    'is_expired': current_time > entry['expires_at'],
                    'age_seconds': int(current_time - entry['cached_at'])
                })
            
            return cache_info

# Global model cache instance
_model_cache = ModelCache()

def get_model_cache() -> ModelCache:
    """Get the global model cache instance."""
    return _model_cache