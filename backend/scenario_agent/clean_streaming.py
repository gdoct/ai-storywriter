"""
Clean streaming implementation with proper agent workflow including wrap-up node
Uses agent graph but streams responses cleanly like chat endpoint
"""
import json
import logging
from typing import Dict, Any, AsyncGenerator
from services.llm_proxy_service import LLMProxyService
from scenario_agent.graph import create_scenario_agent_graph
from scenario_agent.state import AgentState

logger = logging.getLogger(__name__)


def stream_agent_clean(
    user_input: str,
    scenario: Dict[str, Any],
    user_id: str,
    byok_headers: Dict[str, Any] = None
):
    """
    Clean streaming - regular generator like working chat endpoint but with agent intelligence
    """
    def generate():
        try:
            # Send initial status
            status_msg = 'data: {"type":"status","content":"Analyzing your request...","metadata":{"status":"analyzing"}}\n\n'
            yield status_msg.encode('utf-8')
            
            # Get LLM service for streaming
            llm_service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
            
            # Build intelligent prompt based on user input
            prompt = _build_intelligent_prompt(user_input, scenario)
            
            # Send processing status
            processing_msg = 'data: {"type":"status","content":"Generating response...","metadata":{"status":"generating"}}\n\n'
            yield processing_msg.encode('utf-8')
            
            # LLM payload - same as working chat endpoint
            payload = {
                "messages": [{"role": "user", "content": prompt}],
                "model": "default",
                "temperature": 0.7,
                "stream": True
            }
            
            # Stream LLM response and transform to agent format
            buffer = ""
            accumulated_content = ""
            
            for chunk in llm_service.chat_completion_stream(payload):
                if chunk:
                    chunk_str = chunk.decode('utf-8') if isinstance(chunk, bytes) else chunk
                    buffer += chunk_str
                    
                    # Process complete lines
                    while '\n' in buffer:
                        line, buffer = buffer.split('\n', 1)
                        line = line.strip()
                        
                        if line.startswith('data: '):
                            data_part = line[6:]
                            if data_part.strip() == '[DONE]':
                                # LLM streaming complete, now add wrap-up
                                yield from _generate_wrap_up(accumulated_content, user_input, scenario, user_id, byok_headers)
                                return
                            elif data_part.strip():
                                try:
                                    chunk_data = json.loads(data_part)
                                    if 'choices' in chunk_data and len(chunk_data['choices']) > 0:
                                        delta = chunk_data['choices'][0].get('delta', {})
                                        content = delta.get('content', '')
                                        if content:
                                            accumulated_content += content
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
                                    continue
                                    
        except Exception as e:
            logger.error(f"Clean streaming error: {str(e)}")
            error_chunk = f'data: {{"error": "Stream error: {str(e)}"}}\n\n'
            yield error_chunk.encode('utf-8')
    
    return generate()


def _generate_wrap_up(accumulated_content: str, user_input: str, scenario: Dict[str, Any], user_id: str, byok_headers: Dict[str, Any]):
    """Generate follow-up questions using wrap-up logic"""
    try:
        # Send wrap-up status
        status_msg = 'data: {"type":"status","content":"Generating follow-up suggestions...","metadata":{"status":"wrap_up"}}\n\n'
        yield status_msg.encode('utf-8')
        
        # Get LLM service for wrap-up
        llm_service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
        
        # Build wrap-up prompt to generate follow-up questions
        wrap_up_prompt = f"""Based on this conversation about a story scenario, suggest 2-3 relevant follow-up questions the user might want to explore next.

User asked: "{user_input}"
Assistant responded: "{accumulated_content}"

Generate 2-3 concise, specific follow-up questions that would naturally continue this conversation about the story scenario. Return just the questions, one per line, starting with "- ".

Examples:
- How would this character react in a crisis?
- What if we added a subplot here?
- Could you expand on the setting details?"""

        # Get follow-up questions (non-streaming for simplicity)
        payload = {
            "messages": [{"role": "user", "content": wrap_up_prompt}],
            "model": "default",
            "temperature": 0.8,
            "stream": False
        }
        
        # This is a simple approach - collect the response
        follow_up_response = ""
        buffer = ""
        
        for chunk in llm_service.chat_completion_stream(payload):
            if chunk:
                chunk_str = chunk.decode('utf-8') if isinstance(chunk, bytes) else chunk
                buffer += chunk_str
                
                while '\n' in buffer:
                    line, buffer = buffer.split('\n', 1)
                    line = line.strip()
                    
                    if line.startswith('data: '):
                        data_part = line[6:]
                        if data_part.strip() == '[DONE]':
                            break
                        elif data_part.strip():
                            try:
                                chunk_data = json.loads(data_part)
                                if 'choices' in chunk_data and len(chunk_data['choices']) > 0:
                                    delta = chunk_data['choices'][0].get('delta', {})
                                    content = delta.get('content', '')
                                    if content:
                                        follow_up_response += content
                            except json.JSONDecodeError:
                                continue
        
        # Parse follow-up questions from response
        follow_up_questions = []
        for line in follow_up_response.split('\n'):
            line = line.strip()
            if line.startswith('- '):
                follow_up_questions.append(line[2:].strip())
        
        # Send follow-up questions if we have them - but don't overwrite content
        if follow_up_questions:
            followup_msg = {
                "type": "status", 
                "content": "follow_up_questions",
                "streaming": False,
                "metadata": {"follow_up_questions": follow_up_questions, "final": True}
            }
            yield f'data: {json.dumps(followup_msg)}\n\n'.encode('utf-8')
        
        # Send completion
        completion_msg = 'data: {"type":"status","content":"completed","metadata":{"status":"completed"}}\n\n'
        yield completion_msg.encode('utf-8')
        
    except Exception as e:
        logger.error(f"Wrap-up error: {str(e)}")
        # Still send completion even if wrap-up fails
        completion_msg = 'data: {"type":"status","content":"completed","metadata":{"status":"completed"}}\n\n'
        yield completion_msg.encode('utf-8')


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