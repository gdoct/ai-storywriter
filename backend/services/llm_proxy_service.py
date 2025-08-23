import time
from typing import Dict, Any, Optional, Tuple
from data.user_preferences_repository import UserPreferencesRepository
from data.llm_repository import LLMRepository
from llm_services.llm_service import get_llm_service

class LLMProxyService:
    """Service for handling LLM requests with BYOK and member mode support"""
    
    @staticmethod
    def get_llm_service_for_user(user_id: str, byok_headers: Optional[Dict[str, str]] = None):
        """Get the appropriate LLM service based on user's mode and preferences"""
        # Get user's LLM mode
        llm_mode = UserPreferencesRepository.get_user_llm_mode(user_id)
        
        if llm_mode == 'byok':
            # BYOK mode: use headers-provided credentials
            if not byok_headers:
                raise ValueError("BYOK mode requires API credentials in request headers")
            
            # Get user's preferred BYOK provider
            byok_provider = UserPreferencesRepository.get_user_byok_provider(user_id)
            if not byok_provider:
                raise ValueError("BYOK mode requires a selected provider")
            
            # Extract credentials from headers
            api_key = byok_headers.get('X-BYOK-API-Key')
            base_url = byok_headers.get('X-BYOK-Base-URL')
            
            if not api_key:
                raise ValueError("BYOK mode requires X-BYOK-API-Key header")
            
            # Create config for BYOK service
            config = {
                'api_key': api_key,
                'base_url': base_url or LLMProxyService._get_default_base_url(byok_provider)
            }
            
            return get_llm_service(byok_provider, config), byok_provider, 'byok'
        
        else:
            # Member mode: use admin-managed provider
            enabled_providers = LLMRepository.get_enabled_providers()
            
            if not enabled_providers:
                raise ValueError("No enabled LLM providers available")
            
            # Select the first enabled provider (can be enhanced with load balancing later)
            selected_provider = enabled_providers[0]
            provider_name = selected_provider['provider_name']
            
            # Create config from provider preset
            config = {}
            
            # Some providers need admin API keys, others don't (like local services)
            if provider_name in ['openai', 'github']:  # API-key based providers
                api_key = LLMRepository.get_provider_admin_key(provider_name)
                if not api_key:
                    raise ValueError(f"No admin API key configured for provider: {provider_name}")
                config['api_key'] = api_key  # TODO: Decrypt the encrypted value
            
            # Add base URL if available
            if selected_provider.get('base_url'):
                config['base_url'] = selected_provider.get('base_url')
            
            # Add provider-specific config
            if selected_provider.get('config_json'):
                try:
                    import json
                    provider_config = json.loads(selected_provider['config_json'])
                    config.update(provider_config)
                except json.JSONDecodeError:
                    pass  # Ignore invalid JSON
            
            return get_llm_service(provider_name, config), provider_name, 'member'
    
    @staticmethod
    def _get_default_base_url(provider: str) -> str:
        """Get default base URL for a BYOK provider"""
        defaults = {
            'openai': 'https://api.openai.com/v1',
            'github': 'https://models.inference.ai.azure.com'
        }
        return defaults.get(provider, 'https://api.openai.com/v1')
    
    @staticmethod
    def calculate_credits_used(tokens_sent: int, tokens_received: int, 
                             provider: str, mode: str) -> int:
        """Calculate credits used based on tokens and provider multiplier"""
        if mode == 'byok':
            # BYOK mode doesn't use credits
            return 0
        
        # Get provider preset to get credit multiplier
        provider_preset = LLMRepository.get_provider_preset(provider)
        if not provider_preset:
            return 0  # Fallback if provider not found
        
        credit_multiplier = provider_preset.get('credit_multiplier', 1.0)
        total_tokens = tokens_sent + tokens_received
        
        return int(total_tokens * credit_multiplier)
    
    @staticmethod
    def log_request(user_id: str, endpoint_url: str, provider: str, mode: str,
                   tokens_sent: int, tokens_received: int, 
                   start_time: float, status: str = "success", 
                   error_message: Optional[str] = None) -> bool:
        """Log an LLM request with comprehensive details"""
        
        # Calculate duration
        duration_ms = int((time.time() - start_time) * 1000)
        
        # Calculate credits used (only for member mode)
        credits_used = LLMProxyService.calculate_credits_used(
            tokens_sent, tokens_received, provider, mode
        )
        
        # Log the request
        return LLMRepository.log_llm_request(
            user_id=user_id,
            endpoint_url=endpoint_url,
            provider=provider,
            mode=mode,
            tokens_sent=tokens_sent,
            tokens_received=tokens_received,
            credits_used=credits_used,
            duration_ms=duration_ms,
            status=status,
            error_message=error_message
        )
    
    @staticmethod
    def extract_byok_headers(headers: Dict[str, str]) -> Optional[Dict[str, str]]:
        """Extract BYOK-related headers from request headers"""
        byok_headers = {}
        
        # Look for BYOK headers (case-insensitive)
        for key, value in headers.items():
            lower_key = key.lower()
            if lower_key == 'x-byok-api-key':
                byok_headers['X-BYOK-API-Key'] = value
            elif lower_key == 'x-byok-base-url':
                byok_headers['X-BYOK-Base-URL'] = value
            elif lower_key == 'x-byok-provider':
                byok_headers['X-BYOK-Provider'] = value
        
        return byok_headers if byok_headers else None