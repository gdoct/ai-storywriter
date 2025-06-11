import json
import threading
import traceback

from data.db import get_db_connection
from flask import (Blueprint, Response, jsonify, make_response, request,
                   stream_with_context)
from llm_services.llm_service import get_llm_service

llm_proxy = Blueprint('llm_proxy', __name__)

# Create a global lock. This object will be shared across all requests
# handled by this single server process.
ai_lock = threading.Lock()

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
        resp = jsonify({'error': str(e)})
        return add_cors_headers(resp), 502

# Proxy /proxy/llm/v1/chat/completions with locking mechanism
@llm_proxy.route('/proxy/llm/v1/chat/completions', methods=['POST', 'OPTIONS'])
def proxy_chat_completions():
    if request.method == 'OPTIONS':
        return add_cors_headers(make_response('', 204))

    if not ai_lock.acquire(blocking=False):
        error_payload = {'error': 'AI is currently processing another request. Please try again shortly.'}
        response = make_response(jsonify(error_payload), 429)
        return add_cors_headers(response)

    try:
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
        payload = request.get_json() or {}
        payload['stream'] = True

        def generate():
            for chunk in service.chat_completion_stream(payload):
                yield chunk

        resp = Response(stream_with_context(generate()), content_type='text/event-stream')
        return add_cors_headers(resp)

    except Exception as e:
        print(f"LLM proxy error - Backend: {backend_type}, Error: {str(e)}")
        print(traceback.format_exc())
        resp = jsonify({'error': str(e), 'backend_type': backend_type})
        return add_cors_headers(resp), 502

    finally:
        # Release the lock so the next request can proceed.
        ai_lock.release()