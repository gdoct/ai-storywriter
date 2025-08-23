import json
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any
from models.settings import (
    LLMSettingsRequest, LLMSettingsResponse, LLMTestRequest, LLMTestResponse,
    LLMModelsResponse, LLMStatusResponse, CacheInfoResponse, ClearCacheResponse,
    VisionSettingsRequest, VisionSettingsResponse
)
from models.user_settings import (
    UserSettingsRequest, UserSettingsResponse, LLMProviderPresetRequest,
    LLMProviderPresetResponse, LLMRequestLogRequest
)
from config.app_config import get_vision_model_config
from data.db import get_db_connection
from data.user_preferences_repository import UserPreferencesRepository
from data.llm_repository import LLMRepository
from llm_services.llm_service import get_llm_service
from middleware.fastapi_auth import get_current_user, require_roles

router = APIRouter()

def get_current_settings():
    """Helper: get current settings from provider presets"""
    # Use the most recently updated enabled provider
    conn = get_db_connection()
    c = conn.cursor()
    
    # Get the most recently updated enabled provider
    c.execute('''
        SELECT id, provider_name, display_name, base_url, is_enabled, 
               credit_multiplier, config_json, created_at, updated_at
        FROM llm_provider_presets 
        WHERE is_enabled = 1
        ORDER BY updated_at DESC
        LIMIT 1
    ''')
    
    row = c.fetchone()
    conn.close()
    
    if row:
        # Convert provider preset to old settings format for compatibility
        provider = dict(row)
        print(f"[DEBUG] Selected provider: {provider['provider_name']} (updated: {provider['updated_at']})")  # Debug log
        
        config = {}
        if provider.get('config_json'):
            try:
                config = json.loads(provider['config_json'])
            except json.JSONDecodeError:
                pass
        
        return {
            'backend_type': provider['provider_name'],
            'config_json': provider.get('config_json', '{}'),
            'config': config,
            'base_url': provider.get('base_url')
        }
    return None

@router.get("/settings/llm/debug/providers")
async def debug_get_all_providers():
    """Debug endpoint to list all provider presets"""
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            SELECT id, provider_name, display_name, is_enabled, updated_at, config_json
            FROM llm_provider_presets 
            ORDER BY updated_at DESC
        ''')
        
        rows = c.fetchall()
        conn.close()
        
        providers = [dict(row) for row in rows]
        print(f"[DEBUG] All providers in database: {providers}")
        return {"providers": providers}
        
    except Exception as e:
        print(f"[DEBUG] Error getting providers: {e}")
        return {"error": str(e)}

@router.get("/settings/llm", response_model=LLMSettingsResponse)
async def get_llm_settings():
    """Get current LLM settings"""
    settings = get_current_settings()
    if settings:
        config = json.loads(settings['config_json']) if settings['config_json'] else {}
        settings['config'] = config
        
        print(f"[DEBUG] LLM Settings - backend_type: {settings['backend_type']}, config: {config}")  # Debug log
        
        # Extract showThinking from config and put it at top level for frontend
        if 'showThinking' in config:
            settings['showThinking'] = config['showThinking']
        else:
            settings['showThinking'] = False
        
        return LLMSettingsResponse(**settings)
    
    return LLMSettingsResponse(backend_type=None, showThinking=False)

@router.post("/settings/llm", response_model=Dict[str, Any])
async def save_llm_settings(data: LLMSettingsRequest, current_user: dict = Depends(require_roles(["admin"]))):
    """Save LLM settings (Admin only - now manages provider presets)"""
    config = data.config.copy()
    
    # Add showThinking to config if it exists in the request
    if data.showThinking is not None:
        config['showThinking'] = data.showThinking
    
    # Invalidate model cache when settings change
    from llm_services.model_cache import get_model_cache
    cache = get_model_cache()
    cache.invalidate(data.backend_type, config)
    
    # Update the provider preset instead of the old settings table
    config_json = json.dumps(config)
    
    # Find the provider preset and update it
    print(f"[DEBUG] Looking for provider preset: {data.backend_type}")  # Debug log
    provider_preset = LLMRepository.get_provider_preset(data.backend_type)
    print(f"[DEBUG] Found provider preset: {provider_preset}")  # Debug log
    if provider_preset:
        # Update existing provider preset
        update_data = {
            'config_json': config_json,
            'is_enabled': True  # Enable it when settings are saved
        }
        success = LLMRepository.update_provider_preset(provider_preset['id'], update_data)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update provider preset"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider preset '{data.backend_type}' not found"
        )
    
    # Include showThinking in the response
    response_data = {
        'backend_type': data.backend_type, 
        'config': config, 
        'default_model': data.default_model
    }
    if data.showThinking is not None:
        response_data['showThinking'] = data.showThinking
        
    return response_data

@router.post("/settings/llm/test", response_model=LLMTestResponse)
async def test_llm_connection(data: LLMTestRequest):
    """Test LLM connection"""
    try:
        service = get_llm_service(data.backend_type, data.config)
        result = service.test_connection()
        return LLMTestResponse(**result)
    except Exception as e:
        return LLMTestResponse(status='error', error=str(e))

@router.get("/settings/llm/models", response_model=LLMModelsResponse)
async def get_llm_models():
    """Get available LLM models"""
    settings = get_current_settings()
    if not settings:
        return LLMModelsResponse(models=[])
    
    config = json.loads(settings['config_json']) if settings['config_json'] else {}
    backend_type = settings['backend_type']
    try:
        service = get_llm_service(backend_type, config)
        models = service.get_models()  # Uses cache by default
        return LLMModelsResponse(models=models)
    except Exception as e:
        return LLMModelsResponse(models=[], error=str(e))

@router.post("/settings/llm/models/refresh", response_model=LLMModelsResponse)
async def refresh_llm_models():
    """Force refresh the model list cache"""
    settings = get_current_settings()
    if not settings:
        return LLMModelsResponse(models=[], error='No active LLM backend configured')
    
    config = json.loads(settings['config_json']) if settings['config_json'] else {}
    backend_type = settings['backend_type']
    
    try:
        service = get_llm_service(backend_type, config)
        # Force refresh by bypassing cache
        models = service.get_models(use_cache=False)
        return LLMModelsResponse(models=models, refreshed=True)
    except Exception as e:
        return LLMModelsResponse(models=[], error=str(e), refreshed=False)

@router.get("/settings/llm/cache/info", response_model=CacheInfoResponse)
async def get_cache_info():
    """Get information about the model cache"""
    from llm_services.model_cache import get_model_cache
    cache = get_model_cache()
    cache_info = cache.get_cache_info()
    return CacheInfoResponse(**cache_info)

@router.post("/settings/llm/cache/clear", response_model=ClearCacheResponse)
async def clear_cache():
    """Clear all cached models"""
    from llm_services.model_cache import get_model_cache
    cache = get_model_cache()
    cache.invalidate_all()
    return ClearCacheResponse(cleared=True)

@router.get("/settings/llm/status", response_model=LLMStatusResponse)
async def get_llm_status():
    """Get LLM connection status"""
    settings = get_current_settings()
    if not settings:
        return LLMStatusResponse(status='not_configured', backend_type=None)
    
    config = json.loads(settings['config_json']) if settings['config_json'] else {}
    backend_type = settings['backend_type']
    
    try:
        service = get_llm_service(backend_type, config)
        result = service.test_connection()
        # Add backend type to the response
        result['backend_type'] = backend_type
        return LLMStatusResponse(**result)
    except Exception as e:
        return LLMStatusResponse(
            status='error',
            backend_type=backend_type,
            error=str(e)
        )

@router.get("/settings/vision", response_model=VisionSettingsResponse)
async def get_vision_settings():
    """Get vision model settings"""
    try:
        # Get active backend type
        settings = get_current_settings()
        if not settings:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='No active LLM backend configured'
            )
            
        backend_type = settings['backend_type']
        
        # Get vision config for the active backend
        vision_config = get_vision_model_config(backend_type)
        
        return VisionSettingsResponse(
            status='success',
            backend_type=backend_type,
            vision_config=vision_config
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/settings/vision", response_model=VisionSettingsResponse)
async def update_vision_settings(data: VisionSettingsRequest):
    """Update vision model settings"""
    try:
        backend_type = data.backend_type
        
        if not backend_type:
            # Get from active settings
            settings = get_current_settings()
            if not settings:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail='No active LLM backend configured'
                )
            backend_type = settings['backend_type']
        
        # For now just return the config - in a real implementation
        # we would update the database with custom vision settings
        vision_config = get_vision_model_config(backend_type, data.model)
        
        return VisionSettingsResponse(
            status='success',
            backend_type=backend_type,
            vision_config=vision_config
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
# Admin Provider Management Endpoints

@router.get("/admin/settings/providers")
async def get_admin_provider_settings(current_user: dict = Depends(require_roles(["admin"]))):
    """Get all LLM provider presets for admin management"""
    try:
        # Get all providers (not just enabled ones)
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            SELECT p.id, p.provider_name, p.display_name, p.base_url, p.is_enabled, 
                   p.credit_multiplier, p.config_json, p.created_at, p.updated_at,
                   COUNT(k.id) as key_count
            FROM llm_provider_presets p
            LEFT JOIN llm_admin_keys k ON p.id = k.provider_preset_id
            GROUP BY p.id, p.provider_name, p.display_name, p.base_url, p.is_enabled, 
                     p.credit_multiplier, p.config_json, p.created_at, p.updated_at
            ORDER BY p.provider_name
        ''')
        
        rows = c.fetchall()
        conn.close()
        
        providers = []
        for row in rows:
            provider = dict(row)
            provider['has_api_key'] = provider['key_count'] > 0
            del provider['key_count']  # Remove the count field
            
            # Parse config_json if present
            if provider['config_json']:
                try:
                    provider['config'] = json.loads(provider['config_json'])
                except json.JSONDecodeError:
                    provider['config'] = {}
            else:
                provider['config'] = {}
            
            providers.append(provider)
        
        return {"providers": providers}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve provider settings: {str(e)}"
        )

@router.put("/admin/settings/providers/{provider_id}/enable")
async def toggle_provider_status(
    provider_id: int,
    enabled: bool,
    current_user: dict = Depends(require_roles(["admin"]))
):
    """Enable or disable a provider preset"""
    try:
        success = LLMRepository.update_provider_preset(provider_id, {'is_enabled': enabled})
        
        if success:
            status_text = "enabled" if enabled else "disabled"
            return {"message": f"Provider {status_text} successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update provider status"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to toggle provider status: {str(e)}"
        )

@router.put("/admin/settings/providers/{provider_id}/multiplier")
async def update_provider_multiplier(
    provider_id: int,
    multiplier: float,
    current_user: dict = Depends(require_roles(["admin"]))
):
    """Update a provider's credit multiplier"""
    try:
        if multiplier < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Credit multiplier must be non-negative"
            )
        
        success = LLMRepository.update_provider_preset(provider_id, {'credit_multiplier': multiplier})
        
        if success:
            return {"message": f"Credit multiplier updated to {multiplier}x"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update credit multiplier"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update credit multiplier: {str(e)}"
        )
