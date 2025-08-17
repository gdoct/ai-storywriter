import json
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
from models.settings import (
    LLMSettingsRequest, LLMSettingsResponse, LLMTestRequest, LLMTestResponse,
    LLMModelsResponse, LLMStatusResponse, CacheInfoResponse, ClearCacheResponse,
    VisionSettingsRequest, VisionSettingsResponse
)
from config.app_config import get_vision_model_config
from data.db import get_db_connection
from llm_services.llm_service import get_llm_service

router = APIRouter()

def get_current_settings():
    """Helper: get current settings (for now, just the first active row)"""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM settings WHERE is_active=1 ORDER BY id DESC LIMIT 1')
    row = c.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

@router.get("/settings/llm", response_model=LLMSettingsResponse)
async def get_llm_settings():
    """Get current LLM settings"""
    settings = get_current_settings()
    if settings:
        config = json.loads(settings['config_json']) if settings['config_json'] else {}
        settings['config'] = config
        
        # Extract showThinking from config and put it at top level for frontend
        if 'showThinking' in config:
            settings['showThinking'] = config['showThinking']
        else:
            settings['showThinking'] = False
        
        return LLMSettingsResponse(**settings)
    
    return LLMSettingsResponse(backend_type=None, showThinking=False)

@router.post("/settings/llm", response_model=Dict[str, Any])
async def save_llm_settings(data: LLMSettingsRequest):
    """Save LLM settings"""
    config = data.config.copy()
    
    # Add showThinking to config if it exists in the request
    if data.showThinking is not None:
        config['showThinking'] = data.showThinking
    
    # Invalidate model cache when settings change
    from llm_services.model_cache import get_model_cache
    cache = get_model_cache()
    cache.invalidate(data.backend_type, config)
    
    config_json = json.dumps(config)
    conn = get_db_connection()
    c = conn.cursor()
    # Deactivate previous
    c.execute('UPDATE settings SET is_active=0 WHERE is_active=1')
    c.execute('''INSERT INTO settings (user_id, backend_type, config_json, is_active) VALUES (?, ?, ?, 1)''',
              (data.user_id, data.backend_type, config_json))
    conn.commit()
    conn.close()
    
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