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

def extract_text_from_content(content):
    """Extract text content from either string or structured content"""
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

@router.post("/proxy/llm/v1/frontend/chat/completions")
async def frontend_ai_chat_completions(
    completion_request: LLMCompletionRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Clean, simple streaming endpoint specifically for frontend AI buttons.
    Bypasses complex agent processing and uses direct LM Studio communication.
    """
    start_time = time.time()
    user_id = current_user.get('user_id') or current_user.get('id') or current_user.get('username')
    
    # Generate random seed if none provided
    if completion_request.seed is None:
        completion_request.seed = random.randint(1, 2147483647)
    
    try:
        # Extract BYOK headers if present
        byok_headers = LLMProxyService.extract_byok_headers(dict(request.headers))
        
        # Get user's LLM mode and service
        llm_mode = UserPreferencesRepository.get_user_llm_mode(user_id)
        service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
        
        # Basic credit check for member mode
        if llm_mode == 'member':
            request_text = " ".join([extract_text_from_content(msg.content) for msg in completion_request.messages])
            estimated_tokens = count_tokens(request_text, completion_request.model)
            current_balance = UserRepository.get_user_credit_balance(user_id)
            
            if current_balance < estimated_tokens:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail=f'Insufficient credits. Need {estimated_tokens}, have {current_balance}.'
                )

        async def generate():
            
            try:
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
                
                
                # Use the service's streaming method with immediate yielding to prevent buffering
                import asyncio
                for chunk in service.chat_completion_stream(payload):
                    if chunk:
                        yield chunk
                        # Yield control back to the event loop to prevent buffering
                        await asyncio.sleep(0)
                        
                
            except Exception as e:
                logger.error(f"[FRONTEND AI] Stream error: {str(e)}")
                logger.error(traceback.format_exc())
                error_chunk = f"data: {{\"error\": \"Stream error: {str(e)}\"}}\n\n".encode('utf-8')
                yield error_chunk
                await asyncio.sleep(0)

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
        raise
    except Exception as e:
        logger.error(f"[FRONTEND AI] Setup error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Frontend AI error: {str(e)}"
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
    
    # Generate random seed if none provided
    if completion_request.seed is None:
        completion_request.seed = random.randint(1, 2147483647)
    
    try:
        # Extract BYOK headers if present
        byok_headers = LLMProxyService.extract_byok_headers(dict(request.headers))
        
        # Get user's LLM mode
        llm_mode = UserPreferencesRepository.get_user_llm_mode(user_id)
        
        # No need to estimate tokens - we'll get actual usage from the LLM response
        
        # Credit check will be done after we get actual usage from the response

        # Get appropriate LLM service for the user
        service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
        
        # Prepare payload - use non-streaming to get accurate token usage
        payload = {
            'model': completion_request.model,
            'messages': [msg.dict() for msg in completion_request.messages],
            'temperature': completion_request.temperature,
            'max_tokens': completion_request.max_tokens,
            'stream': False  # Non-streaming to get accurate token usage
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

        # Don't deduct tokens upfront - we'll get actual usage from the response

        def generate():
            actual_prompt_tokens = 0
            actual_completion_tokens = 0
            actual_total_tokens = 0
            request_endpoint = f"{service.base_url}/chat/completions" if hasattr(service, 'base_url') else "unknown"
            
            try:
                # Make non-streaming request to get response and accurate token usage
                response_data = service.chat_completion(payload)  # Non-streaming call
                
                # Extract token usage from response
                if isinstance(response_data, dict) and 'usage' in response_data:
                    usage = response_data['usage']
                    actual_prompt_tokens = usage.get('prompt_tokens', 0)
                    actual_completion_tokens = usage.get('completion_tokens', 0)
                    actual_total_tokens = usage.get('total_tokens', 0)
                    
                    # logger.info(f"Actual token usage - Prompt: {actual_prompt_tokens}, "
                    #           f"Completion: {actual_completion_tokens}, Total: {actual_total_tokens}")
                
                # Check if user has enough credits before proceeding (for member mode)
                if mode == 'member':
                    current_balance = UserRepository.get_user_credit_balance(user_id)
                    if current_balance < actual_total_tokens:
                        raise HTTPException(
                            status_code=status.HTTP_402_PAYMENT_REQUIRED,
                            detail=f'Insufficient credits. Need {actual_total_tokens} credits, have {current_balance}.'
                        )
                
                # Extract content for streaming simulation
                content = ""
                if isinstance(response_data, dict) and 'choices' in response_data and response_data['choices']:
                    choice = response_data['choices'][0]
                    if 'message' in choice and 'content' in choice['message']:
                        content = choice['message']['content']
                
                # Simulate streaming by breaking content into chunks
                import time
                chunk_size = 3  # Characters per chunk
                for i in range(0, len(content), chunk_size):
                    chunk_content = content[i:i+chunk_size]
                    
                    # Create streaming-style response chunk
                    chunk_data = {
                        "id": response_data.get('id', 'chatcmpl-simulated'),
                        "object": "chat.completion.chunk",
                        "created": response_data.get('created', int(time.time())),
                        "model": completion_request.model,
                        "choices": [
                            {
                                "index": 0,
                                "delta": {
                                    "content": chunk_content
                                },
                                "finish_reason": None
                            }
                        ]
                    }
                    
                    chunk_str = f"data: {json.dumps(chunk_data)}\n\n"
                    yield chunk_str.encode('utf-8')
                    
                    # Small delay to simulate streaming
                    time.sleep(0.01)
                
                # Send final chunk with finish_reason
                final_chunk = {
                    "id": response_data.get('id', 'chatcmpl-simulated'),
                    "object": "chat.completion.chunk", 
                    "created": response_data.get('created', int(time.time())),
                    "model": completion_request.model,
                    "choices": [
                        {
                            "index": 0,
                            "delta": {},
                            "finish_reason": "stop"
                        }
                    ]
                }
                yield f"data: {json.dumps(final_chunk)}\n\n".encode('utf-8')
                yield "data: [DONE]\n\n".encode('utf-8')
                
                # Deduct actual tokens used (only for member mode)
                if mode == 'member' and actual_total_tokens > 0:
                    UserRepository.add_credit_transaction(
                        user_id=user_id,
                        transaction_type='usage_total',
                        amount=-actual_total_tokens,
                        description=f"AI chat total tokens for model: {completion_request.model} "
                                  f"(prompt: {actual_prompt_tokens}, completion: {actual_completion_tokens})",
                        related_entity_id=completion_request.model
                    )
                
                # Log the request with actual token usage
                LLMProxyService.log_request(
                    user_id=user_id,
                    endpoint_url=request_endpoint,
                    provider=provider,
                    mode=mode,
                    tokens_sent=actual_prompt_tokens,
                    tokens_received=actual_completion_tokens,
                    start_time=start_time,
                    status="success"
                )
                
            except Exception as e:
                import traceback
                tb = traceback.format_exc()
                logger.error(f"LLM request error: {str(e)}")
                logger.error(f"Full traceback: {tb}")
                print(f"[DEBUG] Exception in generate(): {str(e)}")
                print(f"[DEBUG] Full traceback: {tb}")
                
                # Log the error
                LLMProxyService.log_request(
                    user_id=user_id,
                    endpoint_url=request_endpoint,
                    provider=provider,
                    mode=mode,
                    tokens_sent=0,
                    tokens_received=0,
                    start_time=start_time,
                    status="error",
                    error_message=str(e)
                )
                
                error_chunk = f'data: {{"error": "LLM request error: {str(e)}"}}\n\n'
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
        tb = traceback.format_exc()
        logger.error(f"LLM proxy error: {str(e)}")
        logger.error(traceback.format_exc())
        print(f"[DEBUG] Outer exception in LLM proxy: {str(e)}")
        print(f"[DEBUG] Outer exception traceback: {tb}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )