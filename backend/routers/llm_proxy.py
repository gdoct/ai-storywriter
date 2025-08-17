import datetime
import json
import threading
import traceback
import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.responses import StreamingResponse, JSONResponse
from models.llm import (
    LLMCompletionRequest, LLMModelsResponse, LLMModel, 
    LLMStatusResponse, LLMErrorResponse
)
from data.db import get_db_connection
from data.repositories import UserRepository
from llm_services.llm_service import get_llm_service
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
async def proxy_models():
    """
    Get available models from the active LLM backend
    """
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('SELECT * FROM settings WHERE is_active=1 ORDER BY updated_at DESC LIMIT 1')
        row = c.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active LLM backend configured"
            )
        
        backend_type = row['backend_type']
        config = json.loads(row['config_json']) if row['config_json'] else {}
        
        service = get_llm_service(backend_type, config)
        models = service.get_models()
        
        return LLMModelsResponse(
            data=[LLMModel(id=model) for model in models]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        logger.error(f"[{now}] LLM proxy error - Backend: {backend_type}, Error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e)
        )

@router.post("/proxy/llm/v1/chat/completions")
async def proxy_chat_completions(
    request: LLMCompletionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Proxy chat completions with credit system and locking mechanism
    """
    # Try to acquire the lock (non-blocking)
    if not ai_lock.acquire(blocking=False):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="AI is currently processing another request. Please try again shortly."
        )

    try:
        user_id = current_user['id']
        
        # Estimate request tokens for initial check
        request_text_parts = []
        for message in request.messages:
            if isinstance(message.content, str):
                request_text_parts.append(message.content)
        
        request_text = " ".join(request_text_parts)
        estimated_request_tokens = count_tokens(request_text, request.model)

        current_balance = UserRepository.get_user_credit_balance(user_id)

        # Check if balance can cover at least the request tokens (minimum cost)
        if current_balance < estimated_request_tokens:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f'Insufficient credits. Estimated {estimated_request_tokens} credits needed for request, you have {current_balance}.'
            )

        # Get LLM service
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('SELECT * FROM settings WHERE is_active=1 ORDER BY updated_at DESC LIMIT 1')
        row = c.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active LLM backend configured"
            )
        
        backend_type = row['backend_type']
        config = json.loads(row['config_json']) if row['config_json'] else {}
        
        service = get_llm_service(backend_type, config)
        
        # Prepare payload
        payload = {
            'model': request.model,
            'messages': [msg.dict() for msg in request.messages],
            'temperature': request.temperature,
            'max_tokens': request.max_tokens,
            'stream': True  # Force streaming for better control
        }

        # Add optional parameters
        if request.top_p is not None:
            payload['top_p'] = request.top_p
        if request.presence_penalty is not None:
            payload['presence_penalty'] = request.presence_penalty
        if request.frequency_penalty is not None:
            payload['frequency_penalty'] = request.frequency_penalty

        # Deduct initial estimated request tokens
        UserRepository.add_credit_transaction(
            user_id=user_id,
            transaction_type='usage_request',
            amount=-estimated_request_tokens,
            description=f"AI chat request tokens for model: {request.model}",
            related_entity_id=request.model
        )

        def generate():
            total_response_tokens = 0
            accumulated_content = []
            
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
                
                # After streaming is complete, calculate response tokens and deduct
                if accumulated_content:
                    response_text = ''.join(accumulated_content)
                    total_response_tokens = count_tokens(response_text, request.model)
                    
                    # Deduct response tokens
                    UserRepository.add_credit_transaction(
                        user_id=user_id,
                        transaction_type='usage_response',
                        amount=-total_response_tokens,
                        description=f"AI chat response tokens for model: {request.model}",
                        related_entity_id=request.model
                    )
                
            except Exception as e:
                logger.error(f"Streaming error: {str(e)}")
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