import json

from db import get_db_connection
from flask import (Blueprint, Response, jsonify, make_response, request,
                   stream_with_context)
from llm_service import get_llm_service

llm_proxy = Blueprint('llm_proxy', __name__)

def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# Proxy /proxy/llm/v1/models to the active backend
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

# Proxy /proxy/llm/v1/chat/completions to the active backend with streaming
@llm_proxy.route('/proxy/llm/v1/chat/completions', methods=['POST', 'OPTIONS'])
def proxy_chat_completions():
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
        payload = request.get_json() or {}
        # Force stream: True for all LLM backends
        payload['stream'] = True

        def generate():
            for chunk in service.chat_completion_stream(payload):
                yield chunk

        resp = Response(stream_with_context(generate()), content_type='text/event-stream')
        return add_cors_headers(resp)
    except Exception as e:
        import traceback

        # Only log failed requests
        print(f"LLM proxy error - Backend: {backend_type}, Error: {str(e)}")
        print(traceback.format_exc())
        resp = jsonify({'error': str(e), 'backend_type': backend_type})
        return add_cors_headers(resp), 502
