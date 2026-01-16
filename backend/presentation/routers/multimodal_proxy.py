import datetime
import json
import threading
import traceback
import logging
import time
import random
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.responses import StreamingResponse, JSONResponse
from domain.models.llm import (
    LLMCompletionRequest, LLMModelsResponse, LLMModel, 
    LLMStatusResponse, LLMErrorResponse
)
from infrastructure.database.repositories import UserRepository
from infrastructure.database.user_preferences_repository import UserPreferencesRepository
from infrastructure.database.llm_repository import LLMRepository
from domain.services.llm_proxy_service import LLMProxyService
from domain.services.credit_service import CreditService
from api.middleware.fastapi_auth import get_current_user
from infrastructure.llm_services.llm_service import get_llm_service
import tiktoken

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Create a global lock for AI processing
multimodal_ai_lock = threading.Lock()

def count_tokens(text, model_name="gpt-4"):
    """Helper function to count tokens for multimodal models"""
    try:
        encoding = tiktoken.encoding_for_model("gpt-4")  # Use GPT-4 encoding for multimodal
    except KeyError:
        encoding = tiktoken.get_encoding("cl100k_base")
    return len(encoding.encode(text))

def extract_text_from_content(content):
    """Extract text content from multimodal content"""
    if isinstance(content, str):
        return content
    elif isinstance(content, list):
        text_parts = []
        for part in content:
            if hasattr(part, 'text') and part.text:
                text_parts.append(part.text)
            elif isinstance(part, dict) and part.get('type') == 'text' and part.get('text'):
                text_parts.append(part.get('text'))
        return " ".join(text_parts)
    return ""

@router.get("/proxy/multimodal/v1/status", response_model=LLMStatusResponse)
async def multimodal_status():
    """
    Check if the multimodal AI service is currently busy processing a request.
    """
    is_busy = multimodal_ai_lock.locked()
    return LLMStatusResponse(busy=is_busy)

@router.get("/proxy/multimodal/v1/models", response_model=LLMModelsResponse)
async def multimodal_models(request: Request, current_user: dict = Depends(get_current_user)):
    """
    Get available multimodal models from the LLM backend based on user's mode
    """
    try:
        user_id = current_user.get('user_id') or current_user.get('id') or current_user.get('username')
        
        # Get user's multimodal LLM configuration
        user_prefs = UserPreferencesRepository.get_user_preferences(user_id)
        multimodal_config = user_prefs.get('multimodal_llm_config', '{}')
        
        if isinstance(multimodal_config, str):
            multimodal_config = json.loads(multimodal_config) if multimodal_config else {}
        
        # Check if multimodal is enabled for this user
        if not multimodal_config.get('enabled', False):
            return LLMModelsResponse(data=[])
        
        # Extract BYOK headers if present
        byok_headers = LLMProxyService.extract_byok_headers(dict(request.headers))
        
        # For multimodal, we need to get the appropriate service
        mode = multimodal_config.get('mode', 'member')
        provider = multimodal_config.get('provider', 'openai_multimodal')
        
        # Build config for multimodal service
        config = {}
        if mode == 'byok' and byok_headers:
            config = {
                'api_key': byok_headers.get('X-BYOK-API-Key'),
                'base_url': byok_headers.get('X-BYOK-Base-URL'),
                'provider_type': provider
            }
        else:
            # Member mode - get admin configuration
            enabled_providers = LLMRepository.get_enabled_providers_by_backend_type('multimodal')
            if not enabled_providers:
                return LLMModelsResponse(data=[])
            
            selected_provider = enabled_providers[0]
            config = {
                'provider_type': selected_provider['provider_name'],
                'base_url': selected_provider.get('base_url')
            }
            
            # Add admin API key if needed
            if selected_provider['provider_name'] in ['openai_multimodal']:
                api_key = LLMRepository.get_provider_admin_key(selected_provider['provider_name'])
                if api_key:
                    config['api_key'] = api_key
        
        # Get multimodal service and fetch models
        service = get_llm_service(provider, config)
        models = service.get_models()
        
        return LLMModelsResponse(
            data=[LLMModel(id=model) for model in models]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        logger.error(f"[{now}] Multimodal proxy models error - User: {user_id}, Error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Multimodal service error: {str(e)}"
        )

@router.post("/proxy/multimodal/v1/chat/completions")
async def multimodal_chat_completions(
    completion_request: LLMCompletionRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Proxy multimodal chat completions with vision support, BYOK and member mode support
    """
    # Try to acquire the lock (non-blocking)
    if not multimodal_ai_lock.acquire(blocking=False):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Multimodal AI is currently processing another request. Please try again shortly."
        )

    start_time = time.time()
    user_id = current_user.get('user_id') or current_user.get('id') or current_user.get('username')
    
    # Generate random seed if none provided
    if completion_request.seed is None:
        completion_request.seed = random.randint(1, 2147483647)
    
    try:
        # Get user's multimodal LLM configuration
        user_prefs = UserPreferencesRepository.get_user_preferences(user_id)
        multimodal_config = user_prefs.get('multimodal_llm_config', '{}')
        
        if isinstance(multimodal_config, str):
            multimodal_config = json.loads(multimodal_config) if multimodal_config else {}
        
        # Check if multimodal is enabled for this user
        if not multimodal_config.get('enabled', False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Multimodal AI is not enabled for your account"
            )
        
        # Extract BYOK headers if present
        byok_headers = LLMProxyService.extract_byok_headers(dict(request.headers))
        
        # Get service configuration
        mode = multimodal_config.get('mode', 'member')
        provider = multimodal_config.get('provider', 'openai_multimodal')
        
        # Build config for multimodal service
        config = {}
        if mode == 'byok' and byok_headers:
            config = {
                'api_key': byok_headers.get('X-BYOK-API-Key'),
                'base_url': byok_headers.get('X-BYOK-Base-URL'),
                'provider_type': provider
            }
        else:
            # Member mode - get admin configuration
            enabled_providers = LLMRepository.get_enabled_providers_by_backend_type('multimodal')
            if not enabled_providers:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="No multimodal providers available"
                )
            
            selected_provider = enabled_providers[0]
            config = {
                'provider_type': selected_provider['provider_name'],
                'base_url': selected_provider.get('base_url')
            }
            
            # Add admin API key if needed
            if selected_provider['provider_name'] in ['openai_multimodal']:
                api_key = LLMRepository.get_provider_admin_key(selected_provider['provider_name'])
                if api_key:
                    config['api_key'] = api_key

        # Basic credit check for member mode
        if mode == 'member':
            request_text = " ".join([extract_text_from_content(msg.content) for msg in completion_request.messages])
            estimated_tokens = count_tokens(request_text, completion_request.model) * 2  # Multimodal uses more tokens
            current_balance = UserRepository.get_user_credit_balance(user_id)
            
            if current_balance < estimated_tokens:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail=f'Insufficient credits. Need approximately {estimated_tokens}, have {current_balance}.'
                )

        async def generate():
            
            try:
                # Get multimodal service
                service = get_llm_service(provider, config)
                
                # Build payload for the selected service
                payload = {
                    'model': completion_request.model,
                    'messages': [{"role": msg.role, "content": msg.content} for msg in completion_request.messages],
                    'temperature': completion_request.temperature,
                    'max_tokens': completion_request.max_tokens,
                    'stream': True
                }
                
                # Add optional parameters
                if completion_request.top_p is not None:
                    payload['top_p'] = completion_request.top_p
                if completion_request.presence_penalty is not None:
                    payload['presence_penalty'] = completion_request.presence_penalty
                if completion_request.frequency_penalty is not None:
                    payload['frequency_penalty'] = completion_request.frequency_penalty
                if completion_request.seed is not None:
                    payload['seed'] = completion_request.seed
                
                
                # Use the service's streaming method
                import asyncio
                for chunk in service.chat_completion_stream(payload):
                    if chunk:
                        yield chunk
                        await asyncio.sleep(0)
                        
                
                # TODO: Implement proper token counting and credit deduction for multimodal
                
            except Exception as e:
                logger.error(f"[MULTIMODAL AI] Stream error: {str(e)}")
                logger.error(traceback.format_exc())
                error_chunk = f"data: {{\"error\": \"Multimodal stream error: {str(e)}\"}}\n\n".encode('utf-8')
                yield error_chunk
                await asyncio.sleep(0)
            finally:
                # Always release the lock when done
                multimodal_ai_lock.release()

        return StreamingResponse(
            generate(), 
            media_type="text/plain",
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
            }
        )
        
    except HTTPException:
        multimodal_ai_lock.release()
        raise
    except Exception as e:
        multimodal_ai_lock.release()
        logger.error(f"[MULTIMODAL AI] Setup error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Multimodal AI error: {str(e)}"
        )