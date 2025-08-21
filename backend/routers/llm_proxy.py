import datetime
import json
import threading
import traceback
import logging
import time
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.responses import StreamingResponse, JSONResponse
from models.llm import (
    LLMCompletionRequest, LLMModelsResponse, LLMModel, 
    LLMStatusResponse, LLMErrorResponse
)
from data.repositories import UserRepository
from data.user_preferences_repository import UserPreferencesRepository
from data.llm_repository import LLMRepository
from services.llm_proxy_service import LLMProxyService
from services.credit_service import CreditService
from middleware.fastapi_auth import get_current_user
import tiktoken

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Create a global lock for AI processing
ai_lock = threading.Lock()

def count_tokens(text, model_name="gpt-3.5-turbo"):
    """Helper function to count tokens"""
    try:
        encoding = tiktoken.encoding_for_model(model_name)
    except KeyError:
        # Fallback for models not directly supported by tiktoken's model registry
        encoding = tiktoken.get_encoding("cl100k_base")
    return len(encoding.encode(text))

@router.get("/proxy/llm/v1/status", response_model=LLMStatusResponse)
async def proxy_status():
    """
    Checks if the AI service is currently busy processing a request.
    This is non-blocking and returns the status immediately.
    """
    is_busy = ai_lock.locked()
    return LLMStatusResponse(busy=is_busy)

@router.get("/proxy/llm/v1/models", response_model=LLMModelsResponse)
async def proxy_models(request: Request, current_user: dict = Depends(get_current_user)):
    """
    Get available models from the LLM backend based on user's mode
    """
    try:
        user_id = current_user.get('user_id') or current_user.get('id') or current_user.get('username')
        
        # Extract BYOK headers if present
        byok_headers = LLMProxyService.extract_byok_headers(dict(request.headers))
        
        # Get appropriate LLM service for the user
        service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
        models = service.get_models()
        
        return LLMModelsResponse(
            data=[LLMModel(id=model) for model in models]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        logger.error(f"[{now}] LLM proxy models error - User: {user_id}, Error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e)
        )

@router.post("/proxy/llm/v1/chat/completions")
async def proxy_chat_completions(
    completion_request: LLMCompletionRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Proxy chat completions with BYOK and member mode support, credit system, and locking mechanism
    """
    # Try to acquire the lock (non-blocking)
    if not ai_lock.acquire(blocking=False):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="AI is currently processing another request. Please try again shortly."
        )

    start_time = time.time()
    user_id = current_user.get('user_id') or current_user.get('id') or current_user.get('username')
    
    try:
        # Extract BYOK headers if present
        byok_headers = LLMProxyService.extract_byok_headers(dict(request.headers))
        
        # Get user's LLM mode
        llm_mode = UserPreferencesRepository.get_user_llm_mode(user_id)
        
        # Estimate request tokens for credit checking (only for member mode)
        request_text_parts = []
        for message in completion_request.messages:
            if isinstance(message.content, str):
                request_text_parts.append(message.content)
        
        request_text = " ".join(request_text_parts)
        estimated_request_tokens = count_tokens(request_text, completion_request.model)
        
        # Credit check only for member mode
        if llm_mode == 'member':
            current_balance = UserRepository.get_user_credit_balance(user_id)
            
            # Check if balance can cover at least the request tokens (minimum cost)
            if current_balance < estimated_request_tokens:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail=f'Insufficient credits. Estimated {estimated_request_tokens} credits needed for request, you have {current_balance}.'
                )

        # Get appropriate LLM service for the user
        service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
        
        # Prepare payload
        payload = {
            'model': completion_request.model,
            'messages': [msg.dict() for msg in completion_request.messages],
            'temperature': completion_request.temperature,
            'max_tokens': completion_request.max_tokens,
            'stream': True  # Force streaming for better control
        }

        # Add optional parameters
        if completion_request.top_p is not None:
            payload['top_p'] = completion_request.top_p
        if completion_request.presence_penalty is not None:
            payload['presence_penalty'] = completion_request.presence_penalty
        if completion_request.frequency_penalty is not None:
            payload['frequency_penalty'] = completion_request.frequency_penalty

        # Deduct initial estimated request tokens (only for member mode)
        if mode == 'member':
            UserRepository.add_credit_transaction(
                user_id=user_id,
                transaction_type='usage_request',
                amount=-estimated_request_tokens,
                description=f"AI chat request tokens for model: {completion_request.model}",
                related_entity_id=completion_request.model
            )

        def generate():
            total_response_tokens = 0
            accumulated_content = []
            request_endpoint = f"{service.base_url}/chat/completions" if hasattr(service, 'base_url') else "unknown"
            
            try:
                for chunk in service.chat_completion_stream(payload):
                    if chunk:
                        # Process chunk for token counting
                        chunk_str = chunk.decode('utf-8') if isinstance(chunk, bytes) else chunk
                        if chunk_str.startswith('data: '):
                            data_part = chunk_str[6:]
                            if data_part.strip() and data_part.strip() != '[DONE]':
                                try:
                                    chunk_data = json.loads(data_part)
                                    if 'choices' in chunk_data and len(chunk_data['choices']) > 0:
                                        delta = chunk_data['choices'][0].get('delta', {})
                                        if 'content' in delta:
                                            accumulated_content.append(delta['content'])
                                except json.JSONDecodeError:
                                    pass
                        
                        yield chunk
                
                # After streaming is complete, calculate response tokens and process credits/logging
                if accumulated_content:
                    response_text = ''.join(accumulated_content)
                    total_response_tokens = count_tokens(response_text, completion_request.model)
                    
                    # Deduct response tokens (only for member mode)
                    if mode == 'member':
                        UserRepository.add_credit_transaction(
                            user_id=user_id,
                            transaction_type='usage_response',
                            amount=-total_response_tokens,
                            description=f"AI chat response tokens for model: {completion_request.model}",
                            related_entity_id=completion_request.model
                        )
                
                # Log the request
                LLMProxyService.log_request(
                    user_id=user_id,
                    endpoint_url=request_endpoint,
                    provider=provider,
                    mode=mode,
                    tokens_sent=estimated_request_tokens,
                    tokens_received=total_response_tokens,
                    start_time=start_time,
                    status="success"
                )
                
            except Exception as e:
                logger.error(f"Streaming error: {str(e)}")
                
                # Log the error
                LLMProxyService.log_request(
                    user_id=user_id,
                    endpoint_url=request_endpoint,
                    provider=provider,
                    mode=mode,
                    tokens_sent=estimated_request_tokens,
                    tokens_received=0,
                    start_time=start_time,
                    status="error",
                    error_message=str(e)
                )
                
                error_chunk = f'data: {{"error": "Stream error: {str(e)}"}}\n\n'
                yield error_chunk.encode('utf-8')
            finally:
                # Always release the lock when done
                ai_lock.release()

        return StreamingResponse(
            generate(),
            media_type='text/plain',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
            }
        )

    except HTTPException:
        ai_lock.release()
        raise
    except Exception as e:
        ai_lock.release()
        logger.error(f"LLM proxy error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )