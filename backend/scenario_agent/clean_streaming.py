"""
Clean streaming implementation - no envelopes, no complex processing
Just like the working chat endpoint but with basic agent intelligence
"""
import json
import logging
from typing import Dict, Any, AsyncGenerator
from services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)


def stream_agent_clean(
    user_input: str,
    scenario: Dict[str, Any],
    user_id: str,
    byok_headers: Dict[str, Any] = None
):
    """
    Clean streaming - EXACTLY like working chat endpoint but with agent intelligence
    """
    def generate():
        try:
            # Get LLM service
            llm_service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
            
            # Build prompt with basic agent intelligence
            prompt = _build_intelligent_prompt(user_input, scenario)
            
            # LLM payload - EXACTLY like working chat endpoint
            payload = {
                "messages": [{"role": "user", "content": prompt}],
                "model": "default",  # Use same model as chat
                "temperature": 0.7,
                "stream": True  # Explicitly set stream flag like chat endpoint
            }
            
            # Transform LLM chunks to expected agent format
            buffer = ""
            for chunk in llm_service.chat_completion_stream(payload):
                if chunk:
                    # Build buffer for complete line processing
                    chunk_str = chunk.decode('utf-8') if isinstance(chunk, bytes) else chunk
                    buffer += chunk_str
                    
                    # Process complete lines
                    while '\n' in buffer:
                        line, buffer = buffer.split('\n', 1)
                        line = line.strip()
                        
                        if line.startswith('data: '):
                            data_part = line[6:]  # Remove 'data: '
                            if data_part.strip() == '[DONE]':
                                # Send completion message in expected format
                                completion_msg = 'data: {"type":"status","content":"completed","metadata":{"status":"completed"}}\n\n'
                                yield completion_msg.encode('utf-8')
                            elif data_part.strip():
                                try:
                                    # Parse LLM chunk
                                    chunk_data = json.loads(data_part)
                                    if 'choices' in chunk_data and len(chunk_data['choices']) > 0:
                                        delta = chunk_data['choices'][0].get('delta', {})
                                        content = delta.get('content', '')
                                        if content:
                                            # Convert to expected agent format
                                            agent_msg = {
                                                "type": "chat",
                                                "content": content,
                                                "streaming": True,
                                                "metadata": {"streaming": True, "token": True}
                                            }
                                            agent_line = f'data: {json.dumps(agent_msg)}\n\n'
                                            yield agent_line.encode('utf-8')
                                except json.JSONDecodeError:
                                    # Skip invalid JSON
                                    continue
        except Exception as e:
            logger.error(f"Clean streaming error: {str(e)}")
            error_chunk = f'data: {{"error": "Stream error: {str(e)}"}}\n\n'
            yield error_chunk.encode('utf-8')
    
    return generate()


def _build_intelligent_prompt(user_input: str, scenario: Dict[str, Any]) -> str:
    """Build intelligent prompt based on user input and scenario context"""
    
    # Build scenario context
    context = ""
    if scenario:
        if scenario.get('title'):
            context += f"Current scenario: {scenario['title']}\n"
        if scenario.get('synopsis'):
            context += f"Synopsis: {scenario['synopsis']}\n"
        if scenario.get('characters'):
            char_names = [c.get('name', 'Unknown') for c in scenario['characters'][:3]]
            context += f"Main characters: {', '.join(char_names)}\n"
        context += "\n"
    
    # Detect intent and build appropriate prompt
    user_lower = user_input.lower()
    
    if any(word in user_lower for word in ["explain", "tell me about", "describe", "what is", "analyze"]):
        # Analysis/explanation request
        return f"""You are an expert story analyst. {context}User question: "{user_input}"

Provide a detailed, insightful explanation about this aspect of the scenario."""

    elif any(word in user_lower for word in ["modify", "change", "update", "add", "remove", "edit"]):
        # Modification request
        return f"""You are a story editor. {context}User request: "{user_input}"

Explain what changes you would make and why, then provide the updated scenario details."""

    elif any(word in user_lower for word in ["create", "make", "generate", "new"]):
        # Creation request
        return f"""You are a creative story developer. {context}User request: "{user_input}"

Create detailed story elements that fit well with the existing scenario."""
        
    else:
        # General conversation
        scenario_note = f"You're helping with the scenario '{scenario.get('title', 'this story')}'. " if scenario else ""
        return f"""You are a helpful story writing assistant. {scenario_note}{context}

User: "{user_input}"

Respond naturally and helpfully with your knowledge of storytelling and character development."""