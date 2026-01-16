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
from api.middleware.fastapi_auth import get_current_user
from infrastructure.llm_services.llm_service import get_llm_service
import tiktoken

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Create a global lock for AI processing
image_ai_lock = threading.Lock()

def count_tokens_for_image_prompt(text, model_name="dall-e-3"):
    """Helper function to estimate credits for image generation"""
    # Image generation uses different credit calculation
    # Base cost varies by model and image size
    base_cost = 100  # Base credits for image generation
    
    # Add cost based on prompt complexity
    try:
        encoding = tiktoken.get_encoding("cl100k_base")
        prompt_tokens = len(encoding.encode(text))
        return base_cost + (prompt_tokens * 2)  # 2 credits per prompt token
    except:
        return base_cost + len(text)  # Fallback: 1 credit per character

@router.get("/proxy/image/v1/status", response_model=LLMStatusResponse)
async def image_status():
    """
    Check if the image generation AI service is currently busy processing a request.
    """
    is_busy = image_ai_lock.locked()
    return LLMStatusResponse(busy=is_busy)

@router.get("/proxy/image/v1/models", response_model=LLMModelsResponse)
async def image_models(request: Request, current_user: dict = Depends(get_current_user)):
    """
    Get available image generation models from the LLM backend based on user's mode
    """
    try:
        user_id = current_user.get('user_id') or current_user.get('id') or current_user.get('username')
        
        # Get user's image LLM configuration
        user_prefs = UserPreferencesRepository.get_user_preferences(user_id)
        image_config = user_prefs.get('image_llm_config', '{}')
        
        if isinstance(image_config, str):
            image_config = json.loads(image_config) if image_config else {}
        
        # Check if image generation is enabled for this user
        if not image_config.get('enabled', False):
            return LLMModelsResponse(data=[])
        
        # Extract BYOK headers if present
        byok_headers = LLMProxyService.extract_byok_headers(dict(request.headers))
        
        # For image generation, we need to get the appropriate service
        mode = image_config.get('mode', 'member')
        provider = image_config.get('provider', 'openai_dalle')
        
        # Build config for image generation service
        config = {}
        if mode == 'byok' and byok_headers:
            config = {
                'api_key': byok_headers.get('X-BYOK-API-Key'),
                'base_url': byok_headers.get('X-BYOK-Base-URL'),
                'provider_type': provider
            }
        else:
            # Member mode - get admin configuration
            enabled_providers = LLMRepository.get_enabled_providers_by_backend_type('image')
            if not enabled_providers:
                return LLMModelsResponse(data=[])
            
            selected_provider = enabled_providers[0]
            config = {
                'provider_type': selected_provider['provider_name'],
                'base_url': selected_provider.get('base_url')
            }
            
            # Add admin API key if needed
            if selected_provider['provider_name'] in ['openai_dalle', 'stability_ai']:
                api_key = LLMRepository.get_provider_admin_key(selected_provider['provider_name'])
                if api_key:
                    config['api_key'] = api_key
        
        # Get image generation service and fetch models
        service = get_llm_service(provider, config)
        models = service.get_models()
        
        return LLMModelsResponse(
            data=[LLMModel(id=model) for model in models]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        logger.error(f"[{now}] Image proxy models error - User: {user_id}, Error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Image generation service error: {str(e)}"
        )

@router.post("/proxy/image/v1/generations")
async def image_generations(
    completion_request: LLMCompletionRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate images from text prompts with BYOK and member mode support
    """
    # Try to acquire the lock (non-blocking)
    if not image_ai_lock.acquire(blocking=False):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Image generation AI is currently processing another request. Please try again shortly."
        )

    start_time = time.time()
    user_id = current_user.get('user_id') or current_user.get('id') or current_user.get('username')
    
    # logger.info(f"[IMAGE AI] Request from user: {user_id}")
    # logger.info(f"[IMAGE AI] Model: {completion_request.model}")
    
    try:
        # Get user's image LLM configuration
        user_prefs = UserPreferencesRepository.get_user_preferences(user_id)
        image_config = user_prefs.get('image_llm_config', '{}')
        
        if isinstance(image_config, str):
            image_config = json.loads(image_config) if image_config else {}
        
        # Check if image generation is enabled for this user
        if not image_config.get('enabled', False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Image generation is not enabled for your account"
            )
        
        # Extract BYOK headers if present
        byok_headers = LLMProxyService.extract_byok_headers(dict(request.headers))
        
        # Get service configuration
        mode = image_config.get('mode', 'member')
        provider = image_config.get('provider', 'openai_dalle')
        
        # Build config for image generation service
        config = {}
        if mode == 'byok' and byok_headers:
            config = {
                'api_key': byok_headers.get('X-BYOK-API-Key'),
                'base_url': byok_headers.get('X-BYOK-Base-URL'),
                'provider_type': provider
            }
        else:
            # Member mode - get admin configuration
            enabled_providers = LLMRepository.get_enabled_providers_by_backend_type('image')
            if not enabled_providers:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="No image generation providers available"
                )
            
            selected_provider = enabled_providers[0]
            config = {
                'provider_type': selected_provider['provider_name'],
                'base_url': selected_provider.get('base_url')
            }
            
            # Add admin API key if needed
            if selected_provider['provider_name'] in ['openai_dalle', 'stability_ai']:
                api_key = LLMRepository.get_provider_admin_key(selected_provider['provider_name'])
                if api_key:
                    config['api_key'] = api_key

        # Extract prompt from messages
        prompt_text = ""
        for message in completion_request.messages:
            if message.role == 'user':
                if isinstance(message.content, str):
                    prompt_text += message.content + " "
                elif isinstance(message.content, list):
                    for item in message.content:
                        if isinstance(item, dict) and item.get('type') == 'text':
                            prompt_text += item.get('text', '') + " "

        prompt_text = prompt_text.strip()
        if not prompt_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No text prompt found in the request"
            )

        # Credit check for member mode
        if mode == 'member':
            estimated_credits = count_tokens_for_image_prompt(prompt_text, completion_request.model)
            current_balance = UserRepository.get_user_credit_balance(user_id)
            
            if current_balance < estimated_credits:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail=f'Insufficient credits for image generation. Need approximately {estimated_credits}, have {current_balance}.'
                )

        async def generate():
            # logger.info(f"[IMAGE AI] Starting {provider} request (mode: {mode})")
            
            try:
                # Get image generation service
                service = get_llm_service(provider, config)
                
                # Build payload for image generation
                payload = {
                    'model': completion_request.model,
                    'messages': [{"role": msg.role, "content": msg.content} for msg in completion_request.messages],
                    'temperature': completion_request.temperature,
                    'max_tokens': completion_request.max_tokens,
                    'stream': True  # Use streaming for progress updates
                }
                
                # logger.info(f"[IMAGE AI] Using {provider} service for image generation")
                
                # Use the service's streaming method for status updates
                import asyncio
                for chunk in service.chat_completion_stream(payload):
                    if chunk:
                        yield chunk
                        await asyncio.sleep(0)
                        
                # logger.info(f"[IMAGE AI] Generation finished successfully")
                
                # TODO: Implement proper credit deduction based on actual image generation cost
                
            except Exception as e:
                logger.error(f"[IMAGE AI] Generation error: {str(e)}")
                logger.error(traceback.format_exc())
                error_chunk = f"data: {{\"error\": \"Image generation error: {str(e)}\"}}\n\n".encode('utf-8')
                yield error_chunk
                await asyncio.sleep(0)
            finally:
                # Always release the lock when done
                image_ai_lock.release()

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
        image_ai_lock.release()
        raise
    except Exception as e:
        image_ai_lock.release()
        logger.error(f"[IMAGE AI] Setup error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Image generation error: {str(e)}"
        )

@router.post("/proxy/image/v1/chat/completions")
async def image_chat_completions(
    completion_request: LLMCompletionRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Alias for image generation using chat completions format for compatibility
    """
    return await image_generations(completion_request, request, current_user)