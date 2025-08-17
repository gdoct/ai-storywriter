import json
import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import StreamingResponse
from models.chat import ChatCompletionRequest, ChatCompletionResponse, HealthResponse
from data.db import get_db_connection
from llm_services.llm_service import get_llm_service
from middleware.fastapi_auth import get_current_user

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

def get_active_llm_service():
    """Get the currently active LLM service configuration"""
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('SELECT * FROM settings WHERE is_active=1 ORDER BY updated_at DESC LIMIT 1')
        row = c.fetchone()
        conn.close()
        
        if not row:
            return None, "No active LLM backend configured"
        
        backend_type = row['backend_type']
        config = json.loads(row['config_json']) if row['config_json'] else {}
        
        service = get_llm_service(backend_type, config)
        return service, None
        
    except Exception as e:
        logger.error(f"Failed to get LLM service: {str(e)}")
        return None, str(e)

@router.get("/health", response_model=HealthResponse)
async def chat_health():
    """Health check endpoint for chat service"""
    try:
        # Check if LLM service is available
        llm_service, error = get_active_llm_service()
        if llm_service is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=error or "LLM service not configured"
            )
        
        return HealthResponse(
            status="healthy",
            message="Chat service is available"
        )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chat service health check failed"
        )

@router.post("/completions")
async def chat_completions(
    request: ChatCompletionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Chat completions endpoint specifically for the ChatAgent.
    Supports both streaming and non-streaming modes.
    """
    try:
        # Get LLM service
        llm_service, error = get_active_llm_service()
        if llm_service is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=error or "LLM service not available"
            )

        # Prepare payload for LLM service
        payload = {
            'model': request.model,
            'messages': [msg.dict() for msg in request.messages],
            'temperature': request.temperature,
            'max_tokens': request.max_tokens,
            'stream': request.stream
        }

        # Add optional parameters if present
        if request.top_p is not None:
            payload['top_p'] = request.top_p
        if request.presence_penalty is not None:
            payload['presence_penalty'] = request.presence_penalty
        if request.frequency_penalty is not None:
            payload['frequency_penalty'] = request.frequency_penalty

        logger.info(f"Chat completion request - Model: {payload['model']}, Stream: {payload['stream']}")

        if payload['stream']:
            # Streaming response
            def generate():
                try:
                    for chunk in llm_service.chat_completion_stream(payload):
                        if chunk:
                            yield chunk
                except Exception as e:
                    logger.error(f"Streaming chat completion error: {str(e)}")
                    error_chunk = f'data: {{"error": "Stream error: {str(e)}"}}\n\n'
                    yield error_chunk.encode('utf-8')
                    
            return StreamingResponse(
                generate(),
                media_type='text/plain',
                headers={
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'X-Accel-Buffering': 'no'  # Disable nginx buffering
                }
            )
        else:
            # Non-streaming response
            try:
                # For non-streaming, we need to collect all chunks
                response_content = ""
                for chunk in llm_service.chat_completion_stream(payload):
                    if chunk:
                        # Decode chunk and extract content
                        chunk_str = chunk.decode('utf-8') if isinstance(chunk, bytes) else chunk
                        if chunk_str.startswith('data: '):
                            data_part = chunk_str[6:]  # Remove 'data: ' prefix
                            if data_part.strip() and data_part.strip() != '[DONE]':
                                try:
                                    chunk_data = json.loads(data_part)
                                    if 'choices' in chunk_data and len(chunk_data['choices']) > 0:
                                        delta = chunk_data['choices'][0].get('delta', {})
                                        if 'content' in delta:
                                            response_content += delta['content']
                                except json.JSONDecodeError:
                                    continue

                # Create non-streaming response format
                response = {
                    "choices": [{
                        "message": {
                            "role": "assistant",
                            "content": response_content
                        },
                        "finish_reason": "stop",
                        "index": 0
                    }],
                    "model": payload['model'],
                    "usage": {
                        "prompt_tokens": 0,  # Could be calculated if needed
                        "completion_tokens": len(response_content.split()),
                        "total_tokens": len(response_content.split())
                    }
                }
                
                return response
                
            except Exception as e:
                logger.error(f"Non-streaming chat completion error: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Chat completion failed: {str(e)}"
                )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat completion request failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Request processing failed: {str(e)}"
        )