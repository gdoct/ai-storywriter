import requests
from flask import Blueprint, Response, request, stream_with_context

LMSTUDIO_BASE_URL = 'http://192.168.32.1:1234/v1'

lmstudio_proxy = Blueprint('lmstudio_proxy', __name__)

@lmstudio_proxy.route('/proxy/lmstudio/v1/models', methods=['GET'])
def proxy_models():
    lmstudio_url = f"{LMSTUDIO_BASE_URL}/models"
    try:
        resp = requests.get(lmstudio_url, timeout=10)
        return (resp.content, resp.status_code, resp.headers.items())
    except Exception as e:
        return {"error": str(e)}, 502

@lmstudio_proxy.route('/proxy/lmstudio/v1/chat/completions', methods=['POST'])
def proxy_chat_completions():
    lmstudio_url = f"{LMSTUDIO_BASE_URL}/chat/completions"
    headers = {k: v for k, v in request.headers if k.lower() != 'host'}
    try:
        # Stream the response for real-time updates
        def generate():
            with requests.post(lmstudio_url, headers=headers, data=request.data, stream=True, timeout=60) as r:
                for chunk in r.iter_content(chunk_size=4096):
                    if chunk:
                        yield chunk
        return Response(stream_with_context(generate()), content_type='application/json')
    except Exception as e:
        return {"error": str(e)}, 502
