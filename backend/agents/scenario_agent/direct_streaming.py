"""
Direct streaming implementation that mimics the working chat endpoint
but provides agent functionality with minimal buffering
"""
import json
import logging
from typing import Dict, Any, AsyncGenerator
from agents.scenario_agent.graph import create_scenario_agent_graph
from agents.scenario_agent.state import AgentState
from agents.scenario_agent.tools import ScenarioAgentTools
from domain.services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)


async def stream_agent_direct(
    user_input: str,
    scenario: Dict[str, Any],
    user_id: str,
    byok_headers: Dict[str, Any] = None
) -> AsyncGenerator[bytes, None]:
    """
    Direct streaming like chat endpoint but with agent intelligence
    Minimal processing, maximum streaming performance
    """
    try:
        # Quick agent decision - what should we do?
        agent_action = await _quick_classify_and_route(user_input, scenario, user_id, byok_headers)
        
        # Send status message
        status_msg = f"data: {{\"type\":\"status\",\"content\":\"Processing {agent_action}...\",\"streaming\":false}}\n\n"
        yield status_msg.encode('utf-8')
        
        # Get LLM service
        llm_service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
        
        # Build appropriate prompt based on agent decision
        prompt = _build_prompt_for_action(agent_action, user_input, scenario)
        
        # LLM payload
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "model": "default",
            "temperature": 0.7 if agent_action == "chat" else 0.3,
            "stream": True
        }
        
        # Send start streaming message  
        start_msg = f"data: {{\"type\":\"status\",\"content\":\"Streaming response...\",\"streaming\":true}}\n\n"
        yield start_msg.encode('utf-8')
        
        # DIRECT STREAMING - build buffer for proper SSE line processing
        accumulated_content = ""
        chunk_count = 0
        buffer = ""
        
        for chunk in llm_service.chat_completion_stream(payload):
            if chunk:
                chunk_count += 1
                # Convert chunk and add to buffer
                chunk_str = chunk.decode('utf-8') if isinstance(chunk, bytes) else chunk
                buffer += chunk_str
                
                # Process complete lines from buffer
                while '\n' in buffer:
                    line, buffer = buffer.split('\n', 1)
                    line = line.strip()
                    
                    if line.startswith('data: '):
                        data_part = line[6:]
                        if data_part.strip() and data_part.strip() != '[DONE]':
                            try:
                                chunk_data = json.loads(data_part)
                                if 'choices' in chunk_data and len(chunk_data['choices']) > 0:
                                    delta = chunk_data['choices'][0].get('delta', {})
                                    content = delta.get('content', '')
                                    if content:
                                        accumulated_content += content
                                        # Create agent message and yield immediately
                                        agent_msg = {
                                            "type": "chat",
                                            "content": content,
                                            "metadata": {"streaming": True, "token": True}
                                        }
                                        agent_chunk = f"data: {json.dumps(agent_msg)}\n\n"
                                        yield agent_chunk.encode('utf-8')
                            except json.JSONDecodeError:
                                continue  # Skip malformed JSON
        
        logger.info(f"Streaming complete. Total chunks: {chunk_count}, Accumulated content length: {len(accumulated_content)}")
        
        # Post-process if needed (for scenarios updates, etc)
        await _post_process_response(agent_action, accumulated_content, scenario, user_id, byok_headers)
        
        # Send completion
        completion_msg = f"data: {{\"type\":\"status\",\"content\":\"completed\",\"streaming\":false}}\n\n"
        yield completion_msg.encode('utf-8')
        
    except Exception as e:
        logger.error(f"Direct streaming error: {str(e)}")
        error_msg = f"data: {{\"type\":\"status\",\"content\":\"error\",\"error\":\"{str(e)}\"}}\n\n"
        yield error_msg.encode('utf-8')


async def _quick_classify_and_route(user_input: str, scenario: Dict[str, Any], user_id: str, byok_headers: Dict[str, Any]) -> str:
    """Fast classification without complex agent flow"""
    user_lower = user_input.lower()
    
    # Quick keyword-based classification
    if any(word in user_lower for word in ["explain", "tell me about", "describe", "what is", "analyze"]):
        return "explain"
    elif any(word in user_lower for word in ["modify", "change", "update", "add", "remove", "edit"]):
        return "modify"
    elif any(word in user_lower for word in ["create", "make", "generate", "new scenario"]):
        return "create"
    else:
        return "chat"


def _build_prompt_for_action(action: str, user_input: str, scenario: Dict[str, Any]) -> str:
    """Build appropriate prompt based on action"""
    if action == "explain":
        scenario_context = ""
        if scenario:
            scenario_context = f"\n\nScenario: {json.dumps(scenario, indent=2)}"
        
        return f"""You are an expert story analyst. Please explain and analyze the following request about this scenario.

User Question: "{user_input}"{scenario_context}

Provide a detailed, insightful explanation."""

    elif action == "modify":
        return f"""You are a scenario editor. Modify the following scenario based on the user's request and return the complete updated JSON.

Current Scenario: {json.dumps(scenario, indent=2)}

User Request: "{user_input}"

Return the complete modified scenario as valid JSON."""

    elif action == "create":
        return f"""Create a new story scenario based on this request: "{user_input}"

Return a complete scenario in JSON format with title, synopsis, characters, locations, etc."""
        
    else:  # chat
        scenario_context = ""
        if scenario and scenario.get('title'):
            scenario_context = f"\n\nYou're helping with the scenario: {scenario.get('title')}"
            
        return f"""You are a helpful scenario assistant. {scenario_context}

User: "{user_input}"

Respond naturally and helpfully."""


def _transform_chunk_to_agent_format(chunk_str: str) -> str:
    """Transform LLM chunks to agent format with minimal processing"""
    lines = chunk_str.split('\n')
    result_lines = []
    
    for line in lines:
        if line.startswith('data: ') and '"content":' in line and '"delta":{' in line:
            # Transform to agent format
            data_part = line[6:]
            if data_part.strip() and data_part.strip() != '[DONE]':
                try:
                    chunk_data = json.loads(data_part)
                    if 'choices' in chunk_data and len(chunk_data['choices']) > 0:
                        delta = chunk_data['choices'][0].get('delta', {})
                        content = delta.get('content', '')
                        if content:
                            # Create agent-formatted message
                            agent_msg = {
                                "type": "chat",
                                "content": content,
                                "metadata": {"streaming": True, "token": True}
                            }
                            result_lines.append(f"data: {json.dumps(agent_msg)}")
                except:
                    # If parsing fails, skip this line
                    pass
    
    return '\n'.join(result_lines) + ('\n' if result_lines else '')


async def _post_process_response(action: str, accumulated_content: str, scenario: Dict[str, Any], user_id: str, byok_headers: Dict[str, Any]):
    """Post-process response for actions that need it (like scenario updates)"""
    # This runs after streaming is complete, so it doesn't affect real-time performance
    if action == "modify" and accumulated_content:
        try:
            # Try to extract JSON from response for scenario updates
            # This could send a tool call to the frontend later
            pass  # Implementation depends on your needs
        except:
            pass