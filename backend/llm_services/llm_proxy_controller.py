import datetime
import json
import threading
import traceback

import tiktoken  # Added
from data.db import get_db_connection
from data.repositories import UserRepository  # Added
from flask import (Blueprint, Response, jsonify, make_response, request,
                   stream_with_context)
from flask_jwt_extended import get_jwt_identity, jwt_required  # Added
from llm_services.llm_service import get_llm_service

llm_proxy = Blueprint('llm_proxy', __name__)

# Create a global lock. This object will be shared across all requests
# handled by this single server process.
ai_lock = threading.Lock()

# FIXED_CREDIT_COST_PER_CALL = 1 # Removed, will calculate dynamically

# Helper function to count tokens
def count_tokens(text, model_name="gpt-3.5-turbo"):
    try:
        encoding = tiktoken.encoding_for_model(model_name)
    except KeyError:
        # Fallback for models not directly supported by tiktoken's model registry
        encoding = tiktoken.get_encoding("cl100k_base")
    return len(encoding.encode(text))

def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# NEW: Endpoint for the client to poll the AI's status.
@llm_proxy.route('/proxy/llm/v1/status', methods=['GET', 'OPTIONS'])
def proxy_status():
    """
    Checks if the AI service is currently busy processing a request.
    This is non-blocking and returns the status immediately.
    """
    if request.method == 'OPTIONS':
        return add_cors_headers(make_response('', 204))

    # The .locked() method returns True if the lock is held, False otherwise.
    is_busy = ai_lock.locked()
    
    # Return a simple JSON object indicating the busy state.
    response = make_response(jsonify({'busy': is_busy}), 200)
    return add_cors_headers(response)

# Proxy /proxy/llm/v1/models to the active backend (no changes needed here)
@llm_proxy.route('/proxy/llm/v1/models', methods=['GET', 'OPTIONS'])
def proxy_models():
    if request.method == 'OPTIONS':
        return add_cors_headers(make_response('', 204))
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM settings WHERE is_active=1 ORDER BY updated_at DESC LIMIT 1')
    row = c.fetchone()
    conn.close()
    if not row:
        return jsonify({'error': 'No active LLM backend configured'}), 400
    backend_type = row['backend_type']
    config = json.loads(row['config_json']) if row['config_json'] else {}
    try:
        service = get_llm_service(backend_type, config)
        models = service.get_models()
        resp = jsonify({'data': [{'id': m} for m in models]})
        return add_cors_headers(resp)
    except Exception as e:
        
        now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{now}] LLM proxy error - Backend: {backend_type}, Error: {str(e)}")
        print(traceback.format_exc())
        resp = jsonify({'error': str(e)})
        return add_cors_headers(resp), 502

# Proxy /proxy/llm/v1/chat/completions with locking mechanism
@llm_proxy.route('/proxy/llm/v1/chat/completions', methods=['POST', 'OPTIONS'])
@jwt_required() # Added
def proxy_chat_completions():
    if request.method == 'OPTIONS':
        return add_cors_headers(make_response('', 204))

    if not ai_lock.acquire(blocking=False):
        error_payload = {'error': 'AI is currently processing another request. Please try again shortly.'}
        response = make_response(jsonify(error_payload), 429)
        return add_cors_headers(response)

    try:
        # User and Credit Check
        username = get_jwt_identity()
        user = UserRepository.get_user_by_username(username)

        if not user:
            return add_cors_headers(make_response(jsonify({'error': 'User not found or not authorized for this action.'}), 403))
        
        user_id = user['id']
        
        # Estimate request tokens for initial check
        payload = request.get_json() or {}
        request_text_parts = []
        for message in payload.get('messages', []):
            if isinstance(message.get('content'), str):
                request_text_parts.append(message['content'])
        request_text = " ".join(request_text_parts)
        model_requested = payload.get('model', 'gpt-3.5-turbo') # Default to a common model for token estimation
        estimated_request_tokens = count_tokens(request_text, model_requested)

        current_balance = UserRepository.get_user_credit_balance(user_id)

        # Check if balance can cover at least the request tokens (minimum cost)
        if current_balance < estimated_request_tokens:
            return add_cors_headers(make_response(jsonify({'error': f'Insufficient credits. Estimated {estimated_request_tokens} credits needed for request, you have {current_balance}.'}), 402))

        # Proceed with LLM call
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('SELECT * FROM settings WHERE is_active=1 ORDER BY updated_at DESC LIMIT 1')
        row = c.fetchone()
        conn.close()
        if not row:
            return jsonify({'error': 'No active LLM backend configured'}), 400
        
        backend_type = row['backend_type']
        config = json.loads(row['config_json']) if row['config_json'] else {}
        
        service = get_llm_service(backend_type, config)
        payload['stream'] = True

        # Deduct initial estimated request tokens
        # We will add another transaction for response tokens later
        UserRepository.add_credit_transaction(
            user_id=user_id,
            transaction_type='usage_request',
            amount=-estimated_request_tokens, # Negative amount for deduction
            description=f"AI chat request tokens for model: {model_requested}",
            related_entity_id=model_requested # Store model for potential re-costing or analytics
        )
        
        # Update balance for streaming logic if needed, or rely on next check for response tokens
        # current_balance -= estimated_request_tokens 

        def generate():
            total_response_tokens = 0
            accumulated_content = []
            try:
                for chunk in service.chat_completion_stream(payload): # Changed chunk_str to chunk
                    chunk_str = chunk.decode('utf-8') # Decode bytes to string
                    # Assuming chunk_str is a string representation of the JSON event
                    # e.g., "data: {...}\\n\\n"
                    if chunk_str.startswith("data:"):
                        try:
                            content_str = chunk_str[len("data:"):].strip() # Added .strip()
                            if content_str == "[DONE]":
                                yield "data: [DONE]\\n\\n" # Ensure DONE is also properly formatted for SSE
                                continue
                            
                            try:
                                chunk_json = json.loads(content_str)
                            except json.JSONDecodeError:
                                chunk_json = None

                            delta_content = None
                            if isinstance(chunk_json, dict) and chunk_json.get('choices') and len(chunk_json['choices']) > 0:
                                delta = chunk_json['choices'][0].get('delta')
                                if delta:
                                    delta_content = delta.get('content')
                            
                            if delta_content:
                                accumulated_content.append(delta_content)
                                # Optional: Deduct tokens per chunk if desired, but can be costly.
                                # chunk_tokens = count_tokens(delta_content, model_requested)
                                # UserRepository.add_credit_transaction(user_id, 'usage_stream_chunk', -chunk_tokens, ...)
                                # total_response_tokens += chunk_tokens
                        except json.JSONDecodeError:
                            # Handle cases where a chunk might not be perfect JSON (e.g. just a string part)
                            # This part needs to be robust based on actual stream format
                            pass # Or log error, count raw chunk string if applicable
                    yield chunk # Yield the original chunk (binary) to the client
            finally:
                # After stream finishes (or breaks), calculate and deduct response tokens
                final_response_text = "".join(accumulated_content)
                total_response_tokens = count_tokens(final_response_text, model_requested)
                
                if total_response_tokens > 0:
                    UserRepository.add_credit_transaction(
                        user_id=user_id,
                        transaction_type='usage_response',
                        amount=-total_response_tokens,
                        description=f"AI chat response tokens for model: {model_requested}",
                        related_entity_id=model_requested
                    )
                # Optional: Add a final transaction for total cost if needed for easier auditing
                # total_cost = estimated_request_tokens + total_response_tokens
                # UserRepository.add_credit_transaction(user_id, 'usage_total', -total_cost, ...)

        resp = Response(stream_with_context(generate()), content_type='text/event-stream')
        return add_cors_headers(resp)

    except Exception as e:
        now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{now}] LLM proxy error - Backend: {backend_type}, Error: {str(e)}")
        print(traceback.format_exc())
        resp = jsonify({'error': str(e), 'backend_type': backend_type})
        return add_cors_headers(resp), 502

    finally:
        # Release the lock so the next request can proceed.
        if ai_lock.locked(): # Check if the lock is actually held by the current thread/context
            ai_lock.release()