import json

from db import get_db_connection
from flask import Blueprint, jsonify, request
from llm_service import get_llm_service

settings_controller = Blueprint('settings_controller', __name__)

# Helper: get current settings (for now, just the first active row)
def get_current_settings():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM settings WHERE is_active=1 ORDER BY id DESC LIMIT 1')
    row = c.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

@settings_controller.route('/api/settings/llm', methods=['GET'])
def get_llm_settings():
    settings = get_current_settings()
    if settings:
        settings['config'] = json.loads(settings['config_json']) if settings['config_json'] else {}
    return jsonify(settings or {'backend_type': None})

@settings_controller.route('/api/settings/llm', methods=['POST'])
def save_llm_settings():
    data = request.get_json()
    backend_type = data.get('backend_type')
    config = data.get('config', {})
    default_model = data.get('default_model')
    user_id = data.get('user_id')  # For now, can be None
    config_json = json.dumps(config)
    conn = get_db_connection()
    c = conn.cursor()
    # Deactivate previous
    c.execute('UPDATE settings SET is_active=0 WHERE is_active=1')
    c.execute('''INSERT INTO settings (user_id, backend_type, config_json, is_active) VALUES (?, ?, ?, 1)''',
              (user_id, backend_type, config_json))
    conn.commit()
    conn.close()
    return jsonify({'backend_type': backend_type, 'config': config, 'default_model': default_model})

@settings_controller.route('/api/settings/llm/test', methods=['POST'])
def test_llm_connection():
    data = request.get_json()
    backend_type = data.get('backend_type')
    config = data.get('config', {})
    try:
        service = get_llm_service(backend_type, config)
        result = service.test_connection()
        return jsonify(result)
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)})

@settings_controller.route('/api/settings/llm/models', methods=['GET'])
def get_llm_models():
    settings = get_current_settings()
    if not settings:
        return jsonify({'models': []})
    config = json.loads(settings['config_json']) if settings['config_json'] else {}
    backend_type = settings['backend_type']
    try:
        service = get_llm_service(backend_type, config)
        models = service.get_models()
        return jsonify({'models': models})
    except Exception as e:
        return jsonify({'models': [], 'error': str(e)})
        
@settings_controller.route('/api/settings/llm/status', methods=['GET'])
def get_llm_status():
    settings = get_current_settings()
    if not settings:
        return jsonify({'status': 'not_configured', 'backend_type': None})
    
    config = json.loads(settings['config_json']) if settings['config_json'] else {}
    backend_type = settings['backend_type']
    
    try:
        service = get_llm_service(backend_type, config)
        result = service.test_connection()
        # Add backend type to the response
        result['backend_type'] = backend_type
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'status': 'error',
            'backend_type': backend_type,
            'error': str(e)
        })
