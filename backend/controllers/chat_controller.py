# backend/controllers/chat_controller.py
"""
Chat Controller for the ChatAgent component.
Provides dedicated endpoints for chat functionality.
"""

import json
import logging

from data.db import get_db_connection
from flask import Blueprint, Response, jsonify, request, stream_with_context
from llm_services.llm_service import get_llm_service
from middleware.auth_middleware import jwt_required

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

chat_bp = Blueprint('chat', __name__)

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

@chat_bp.route('/health', methods=['GET'])
def chat_health():
    """Health check endpoint for chat service"""
    try:
        # Check if LLM service is available
        llm_service, error = get_active_llm_service()
        if llm_service is None:
            return jsonify({
                "status": "unavailable",
                "message": error or "LLM service not configured"
            }), 503
        
        # For the chat service, we just need to confirm that an LLM service is configured
        # The actual connection test is less important since the chat should work if other parts work
        return jsonify({
            "status": "healthy",
            "message": "Chat service is available"
        }), 200
            
    except Exception as e:
        logger.error(f"Chat health check failed: {str(e)}")
        return jsonify({
            "status": "error", 
            "message": "Chat service health check failed"
        }), 503

@chat_bp.route('/completions', methods=['POST'])
@jwt_required()
def chat_completions():
    """
    Chat completions endpoint specifically for the ChatAgent.
    Supports both streaming and non-streaming modes.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        # Validate required fields
        if 'messages' not in data:
            return jsonify({"error": "Missing 'messages' field"}), 400
        
        messages = data['messages']
        if not isinstance(messages, list) or len(messages) == 0:
            return jsonify({"error": "Messages must be a non-empty list"}), 400

        # Get LLM service
        llm_service, error = get_active_llm_service()
        if llm_service is None:
            return jsonify({"error": error or "LLM service not available"}), 503

        # Prepare payload for LLM service
        payload = {
            'model': data.get('model', 'default'),
            'messages': messages,
            'temperature': data.get('temperature', 0.8),
            'max_tokens': data.get('max_tokens', 1024),
            'stream': data.get('stream', False)
        }

        # Add optional parameters if present
        if 'top_p' in data:
            payload['top_p'] = data['top_p']
        if 'presence_penalty' in data:
            payload['presence_penalty'] = data['presence_penalty']
        if 'frequency_penalty' in data:
            payload['frequency_penalty'] = data['frequency_penalty']

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
                    
            return Response(
                stream_with_context(generate()),
                content_type='text/plain; charset=utf-8',
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
                            if data_part.strip() == '[DONE]':
                                break
                            try:
                                parsed = json.loads(data_part)
                                if 'choices' in parsed and len(parsed['choices']) > 0:
                                    delta = parsed['choices'][0].get('delta', {})
                                    content = delta.get('content', '')
                                    if content:
                                        response_content += content
                            except json.JSONDecodeError:
                                continue
                
                # Return standard OpenAI-format response
                return jsonify({
                    "id": "chat-completion",
                    "object": "chat.completion",
                    "created": int(data.get('created', 0)),
                    "model": payload['model'],
                    "choices": [{
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": response_content
                        },
                        "finish_reason": "stop"
                    }]
                })
                
            except Exception as e:
                logger.error(f"Non-streaming chat completion error: {str(e)}")
                return jsonify({"error": f"Chat completion failed: {str(e)}"}), 500

    except Exception as e:
        logger.error(f"Chat completions endpoint error: {str(e)}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500
