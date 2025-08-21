from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any
from models.user_settings import (
    UserSettingsRequest, UserSettingsResponse, LLMProviderPresetRequest,
    LLMProviderPresetResponse, LLMRequestLogRequest
)
from data.user_preferences_repository import UserPreferencesRepository
from data.llm_repository import LLMRepository
from data.db import get_db_connection
from services.credit_service import CreditService
from middleware.fastapi_auth import get_current_user, require_roles

router = APIRouter()

# User Settings Endpoints

@router.get("/user/settings", response_model=UserSettingsResponse)
async def get_user_settings(current_user: dict = Depends(get_current_user)):
    """Get current user's settings and preferences"""
    try:
        user_id = current_user.get('user_id') or current_user.get('username')
        preferences = UserPreferencesRepository.get_user_preferences(user_id)
        
        if not preferences:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserSettingsResponse(**preferences)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user settings: {str(e)}"
        )

@router.put("/user/settings")
async def update_user_settings(
    settings: UserSettingsRequest, 
    current_user: dict = Depends(get_current_user)
):
    """Update current user's settings and preferences"""
    try:
        user_id = current_user.get('user_id') or current_user.get('username')
        
        # Convert Pydantic model to dict, excluding None values
        update_data = {}
        
        if settings.username is not None:
            update_data['username'] = settings.username
        if settings.email is not None:
            update_data['email'] = settings.email
        if settings.first_name is not None:
            update_data['first_name'] = settings.first_name
        if settings.last_name is not None:
            update_data['last_name'] = settings.last_name
        if settings.llm_mode is not None:
            update_data['llm_mode'] = settings.llm_mode.value
        if settings.byok_provider is not None:
            update_data['byok_provider'] = settings.byok_provider.value
        if settings.notifications is not None:
            update_data['notifications'] = settings.notifications.dict()
        
        success = UserPreferencesRepository.create_or_update_user_preferences(user_id, update_data)
        
        if success:
            return {"message": "Settings updated successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update settings"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user settings: {str(e)}"
        )

# LLM Provider Management (Admin only)

@router.get("/admin/llm/providers")
async def get_llm_providers(current_user: dict = Depends(require_roles(["admin"]))):
    """Get all LLM provider presets (Admin only)"""
    try:
        providers = LLMRepository.get_enabled_providers()
        return {"providers": providers}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve LLM providers: {str(e)}"
        )

@router.put("/admin/llm/providers/{provider_id}")
async def update_llm_provider(
    provider_id: int,
    updates: LLMProviderPresetRequest,
    current_user: dict = Depends(require_roles(["admin"]))
):
    """Update an LLM provider preset (Admin only)"""
    try:
        update_data = updates.dict(exclude_unset=True)
        success = LLMRepository.update_provider_preset(provider_id, update_data)
        
        if success:
            return {"message": "Provider updated successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update provider"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update LLM provider: {str(e)}"
        )

@router.post("/admin/llm/providers/{provider_id}/keys")
async def set_provider_admin_key(
    provider_id: int,
    key_data: dict,
    current_user: dict = Depends(require_roles(["admin"]))
):
    """Set or update an admin API key for a provider (Admin only)"""
    try:
        key_name = key_data.get('key_name', 'api_key')
        encrypted_value = key_data.get('encrypted_value')
        
        if not encrypted_value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="encrypted_value is required"
            )
        
        # Get provider name by ID
        providers = LLMRepository.get_enabled_providers()
        provider = next((p for p in providers if p['id'] == provider_id), None)
        
        if not provider:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Provider not found"
            )
        
        success = LLMRepository.set_provider_admin_key(
            provider['provider_name'], key_name, encrypted_value
        )
        
        if success:
            return {"message": "API key updated successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update API key"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set provider API key: {str(e)}"
        )

@router.get("/admin/llm/providers/all")
async def get_all_llm_providers(current_user: dict = Depends(require_roles(["admin"]))):
    """Get all LLM provider presets including disabled ones (Admin only)"""
    try:
        # Get all providers (not just enabled ones)
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            SELECT id, provider_name, display_name, base_url, is_enabled, 
                   credit_multiplier, config_json, created_at, updated_at
            FROM llm_provider_presets 
            ORDER BY provider_name
        ''')
        
        rows = c.fetchall()
        conn.close()
        
        providers = [dict(row) for row in rows]
        return {"providers": providers}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve all LLM providers: {str(e)}"
        )

# LLM Request Logging

@router.post("/llm/log")
async def log_llm_request(
    log_data: LLMRequestLogRequest,
    current_user: dict = Depends(get_current_user)
):
    """Log an LLM request for usage tracking"""
    try:
        user_id = current_user.get('user_id') or current_user.get('username')
        
        success = LLMRepository.log_llm_request(
            user_id=user_id,
            endpoint_url=log_data.endpoint_url,
            provider=log_data.provider,
            mode=log_data.mode.value,
            tokens_sent=log_data.tokens_sent,
            tokens_received=log_data.tokens_received,
            credits_used=log_data.credits_used,
            duration_ms=log_data.duration_ms,
            status=log_data.status,
            error_message=log_data.error_message
        )
        
        if success:
            return {"message": "Request logged successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to log request"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to log LLM request: {str(e)}"
        )

@router.get("/user/llm/usage")
async def get_user_llm_usage(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get user's LLM usage history"""
    try:
        user_id = current_user.get('user_id') or current_user.get('username')
        usage = LLMRepository.get_user_llm_usage(user_id, limit)
        
        return {"usage": usage}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve LLM usage: {str(e)}"
        )

# Credit and Pricing Endpoints

@router.get("/pricing/providers")
async def get_provider_pricing():
    """Get pricing information for all LLM providers"""
    try:
        rates = CreditService.get_provider_credit_rates()
        return {"rates": rates}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve provider pricing: {str(e)}"
        )

@router.post("/pricing/estimate")
async def estimate_request_cost(
    request_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Estimate the credit cost for a request"""
    try:
        message_text = request_data.get('message', '')
        provider = request_data.get('provider', 'openai')
        model = request_data.get('model', 'gpt-3.5-turbo')
        
        if not message_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message text is required for cost estimation"
            )
        
        estimate = CreditService.estimate_cost(message_text, provider, model)
        return estimate
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to estimate cost: {str(e)}"
        )