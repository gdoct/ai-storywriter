import json
import logging
from typing import Dict, Any, AsyncGenerator
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from middleware.fastapi_auth import get_current_user
from scenario_agent.graph import create_scenario_agent_graph
from scenario_agent.state import AgentState, StreamingMessage
from scenario_agent.tools import ScenarioAgentTools
from services.llm_proxy_service import LLMProxyService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


async def stream_llm_tool(tool_call: Dict[str, Any], user_id: str, byok_headers: Dict[str, Any], node_name: str) -> Dict[str, Any]:
    """
    Stream LLM tool responses directly to the client
    """
    from services.llm_proxy_service import LLMProxyService
    import json
    
    action = tool_call.get("action")
    parameters = tool_call.get("parameters", {})
    
    # Get the appropriate prompt based on the tool
    if action == "explain_scenario":
        prompt = build_explain_prompt(parameters)
        temperature = 0.3
    elif action == "generic_chat":
        prompt = build_chat_prompt(parameters)
        temperature = 0.7
    else:
        return {"error": f"Unsupported streaming tool: {action}", "status": "failed"}
    
    try:
        # Get LLM service and stream the response
        llm_service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
        
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "model": "default",
            "temperature": temperature
        }
        
        # This is a generator function, but we need to yield from the parent
        # So we'll return a special status to indicate streaming is handled externally
        return {"status": "streaming", "payload": payload, "llm_service": llm_service}
        
    except Exception as e:
        logger.error(f"Failed to setup streaming for {action}: {str(e)}")
        return {"error": str(e), "status": "failed"}


def build_explain_prompt(parameters: Dict[str, Any]) -> str:
    """Build prompt for explain_scenario tool"""
    user_input = parameters.get("user_input", "")
    scenario = parameters.get("scenario", {})
    
    # Build comprehensive scenario context
    scenario_details = []
    if scenario.get("title"):
        scenario_details.append(f"**Title:** {scenario['title']}")
    if scenario.get("synopsis"):
        scenario_details.append(f"**Synopsis:** {scenario['synopsis']}")
    if scenario.get("backstory"):
        scenario_details.append(f"**Backstory:** {scenario['backstory']}")
    if scenario.get("storyarc"):
        scenario_details.append(f"**Story Arc:** {scenario['storyarc']}")
        
    scenario_context = "\n".join(scenario_details) if scenario_details else "No scenario details available."
    
    return f"""You are an expert story analyst and scenario consultant. You have deep expertise in storytelling, character development, plot structure, and narrative techniques.

**SCENARIO DETAILS:**
{scenario_context}

**USER QUESTION:** "{user_input}"

Please provide a detailed, insightful explanation that addresses the user's question about this scenario. Use your expertise to:

- Analyze the story elements thoroughly
- Explain how different components work together
- Identify strengths, potential issues, or opportunities
- Provide specific examples from the scenario
- Offer constructive insights and suggestions when relevant
- Be comprehensive yet clear and engaging

Focus specifically on what the user is asking about, but feel free to connect it to other relevant aspects of the scenario."""


def build_chat_prompt(parameters: Dict[str, Any]) -> str:
    """Build prompt for generic_chat tool"""
    user_input = parameters.get("user_input", "")
    scenario = parameters.get("scenario", {})
    context = parameters.get("context", "You are a helpful assistant.")
    
    # Build conversational prompt with scenario context
    if scenario:
        scenario_context = f"\nCurrent scenario context:\nTitle: {scenario.get('title', 'Untitled')}\nSynopsis: {scenario.get('synopsis', 'No synopsis')}"
    else:
        scenario_context = "\nNo current scenario is loaded."
    
    return f"""
{context}

{scenario_context}

User message: "{user_input}"

Please respond naturally and helpfully. If the user wants to work with scenarios, guide them appropriately. If they're just chatting, engage naturally while staying in your role as a scenario assistant.
"""


class AgentRequest(BaseModel):
    """Request model for agent interactions"""
    message: str
    scenario: Dict[str, Any] = None
    stream: bool = True


class AgentResponse(BaseModel):
    """Response model for non-streaming agent interactions"""
    response: str
    scenario: Dict[str, Any] = None
    tool_calls: list = None


@router.post("/scenario")
async def scenario_agent_endpoint(
    agent_request: AgentRequest,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Scenario agent endpoint that handles conversational interactions for scenario management
    """
    try:
        # Create the agent graph
        agent_graph = create_scenario_agent_graph()
        
        # Initialize state
        initial_state: AgentState = {
            "messages": [{"content": agent_request.message, "scenario": agent_request.scenario}],
            "scenario": agent_request.scenario,
            "user_input": agent_request.message,
            "current_response": "",
            "next_node": None,
            "streaming_response": [],
            "tool_calls": [],
            "user_id": current_user["id"]
        }
        
        if agent_request.stream:
            # Stream the agent's responses
            # Extract BYOK headers if present
            byok_headers = LLMProxyService.extract_byok_headers(dict(request.headers))
            
            return StreamingResponse(
                stream_agent_response(agent_graph, initial_state, current_user["id"], byok_headers),
                media_type="text/plain"
            )
        else:
            # Non-streaming response
            final_state = None
            async for state in agent_graph.astream(initial_state):
                final_state = state
            
            if not final_state:
                raise HTTPException(status_code=500, detail="Failed to get agent response")
            
            # Get the last node's state
            last_node_state = list(final_state.values())[-1]
            
            return AgentResponse(
                response=last_node_state.get("current_response", ""),
                scenario=last_node_state.get("scenario"),
                tool_calls=last_node_state.get("tool_calls", [])
            )
    
    except Exception as e:
        logger.error(f"Agent endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


async def stream_agent_response(
    agent_graph, 
    initial_state: AgentState, 
    user_id: str,
    byok_headers: Dict[str, Any] = None
) -> AsyncGenerator[str, None]:
    """
    Stream agent responses as Server-Sent Events
    """
    try:
        # For now, let's keep the existing LangGraph approach since streaming is working
        # but with smaller chunks from the LLM services
        
        # Track scenario changes for client-side updates
        previous_scenario = initial_state.get("scenario")
        
        async for step in agent_graph.astream(initial_state):
            # step is a dict with node_name -> state
            for node_name, state in step.items():
                # Stream any response content as status updates
                streaming_responses = state.get("streaming_response", [])
                for response in streaming_responses:
                    message = StreamingMessage(
                        type="status",
                        content=response,
                        metadata={"node": node_name}
                    )
                    yield f"data: {message.model_dump_json()}\n\n"
                
                # Stream and execute tool calls
                tool_calls = state.get("tool_calls", [])
                for tool_call in tool_calls:
                    # Stream the tool call start as status
                    message = StreamingMessage(
                        type="status",
                        content=f"Executing {tool_call.get('action', 'unknown action')}",
                        metadata={"tool_call": tool_call, "status": "executing"}
                    )
                    yield f"data: {message.model_dump_json()}\n\n"
                    
                    # Execute the tool
                    try:
                        # Check if this is a client-side tool call
                        if tool_call.get("action") == "update_scenario":
                            # Client-side tool - don't execute on backend, just stream it
                            tool_result = {"status": "client_side", "action": "update_scenario"}
                        elif tool_call.get("action") in ["explain_scenario", "generic_chat"]:
                            # Handle streaming LLM tools
                            stream_setup = await stream_llm_tool(tool_call, user_id, byok_headers, node_name)
                            
                            if stream_setup.get("status") == "streaming":
                                # Execute streaming directly here
                                payload = stream_setup["payload"]
                                llm_service = stream_setup["llm_service"]
                                streamed_response = ""
                                
                                # Stream the LLM response with simple envelope format
                                buffer = ""
                                for chunk in llm_service.chat_completion_stream(payload):
                                    if chunk:
                                        # Add chunk to buffer
                                        chunk_str = chunk.decode('utf-8') if isinstance(chunk, bytes) else chunk
                                        buffer += chunk_str
                                        
                                        # Process complete lines in buffer
                                        while '\n' in buffer:
                                            line, buffer = buffer.split('\n', 1)
                                            line = line.strip()
                                            
                                            if line.startswith('data: '):
                                                data_part = line[6:]  # Remove 'data: ' prefix
                                                if data_part.strip() and data_part.strip() != '[DONE]':
                                                    try:
                                                        chunk_data = json.loads(data_part)
                                                        if 'choices' in chunk_data and len(chunk_data['choices']) > 0:
                                                            delta = chunk_data['choices'][0].get('delta', {})
                                                            content = delta.get('content', '')
                                                            if content:
                                                                streamed_response += content
                                                                # Send simple envelope with just the content
                                                                envelope = {
                                                                    "type": "chat",
                                                                    "content": content,
                                                                    "node": node_name,
                                                                    "streaming": True
                                                                }
                                                                yield f"data: {json.dumps(envelope)}\n\n"
                                                    except json.JSONDecodeError as e:
                                                        logger.warning(f"Failed to parse LLM chunk JSON: {data_part[:50]}...")
                                                    except Exception as e:
                                                        logger.warning(f"Error processing LLM chunk: {str(e)}")
                                
                                # Mark as completed after streaming
                                tool_result = {"status": "completed", "response": streamed_response, "streamed": True}
                            else:
                                tool_result = stream_setup
                            
                        else:
                            # Backend tool - execute normally
                            tool_result = await ScenarioAgentTools.execute_tool(tool_call, user_id, byok_headers)
                        
                        # Handle different types of tool results
                        if tool_call.get("action") == "generic_chat" and tool_result.get("status") == "completed" and not tool_result.get("streamed"):
                            # For non-streaming generic_chat, stream the response as chat message
                            chat_response = tool_result.get("response", "")
                            if chat_response:
                                chat_message = StreamingMessage(
                                    type="chat",
                                    content=chat_response,
                                    metadata={"node": node_name, "tool_result": True}
                                )
                                yield f"data: {chat_message.model_dump_json()}\n\n"
                        elif tool_call.get("action") == "update_scenario" and tool_result.get("status") == "client_side":
                            # Stream client-side tool call for frontend to handle
                            client_tool_message = StreamingMessage(
                                type="tool_call",
                                content=f"Updating scenario",
                                metadata={"tool_call": tool_call, "status": "completed"}
                            )
                            yield f"data: {client_tool_message.model_dump_json()}\n\n"
                        
                        # Stream the tool completion as status (only for backend tools)
                        if tool_result.get("status") != "client_side":
                            result_message = StreamingMessage(
                                type="status",
                                content=f"Completed {tool_call.get('action', 'action')}",
                                metadata={"tool_call": tool_call, "result": tool_result, "status": "completed"}
                            )
                            yield f"data: {result_message.model_dump_json()}\n\n"
                        
                        # If the tool updated the scenario, update the agent state
                        if "updated_scenario" in tool_result:
                            # This would update the scenario in the state for subsequent nodes
                            state["scenario"] = tool_result["updated_scenario"]
                        elif "scenario" in tool_result:
                            # New scenario created, update the agent state
                            state["scenario"] = tool_result["scenario"]
                        
                        # If this was a classification tool, store the result for routing
                        if tool_call.get("action") == "classify_input" and tool_result.get("status") == "completed":
                            state["classification_result"] = tool_result
                            state["category"] = tool_result.get("category", "general conversation")
                            
                        # Stream the updated information
                        if tool_result.get("status") == "completed":
                            if "character" in tool_result:
                                info_message = StreamingMessage(
                                    type="status",
                                    content=f"Generated new character: {tool_result['character'].get('name', 'Unnamed')}",
                                    metadata={"node": node_name, "tool_result": True}
                                )
                                yield f"data: {info_message.model_dump_json()}\n\n"
                            elif "location" in tool_result:
                                info_message = StreamingMessage(
                                    type="status", 
                                    content=f"Generated new location: {tool_result['location'].get('name', 'Unnamed')}",
                                    metadata={"node": node_name, "tool_result": True}
                                )
                                yield f"data: {info_message.model_dump_json()}\n\n"
                            elif "scenario" in tool_result:
                                # Handle new scenario creation (create_scenario tool)
                                scenario_title = tool_result["scenario"].get("title", "New Scenario")
                                chat_message = StreamingMessage(
                                    type="chat",
                                    content=f"✅ New scenario '{scenario_title}' has been created successfully!",
                                    metadata={"node": node_name, "tool_result": True}
                                )
                                yield f"data: {chat_message.model_dump_json()}\n\n"
                                
                                # Create client-side tool call for frontend scenario creation
                                client_tool_call = {
                                    "action": "create_scenario",
                                    "parameters": {"scenario": tool_result["scenario"]}
                                }
                                client_tool_message = StreamingMessage(
                                    type="tool_call",
                                    content="Creating new scenario",
                                    metadata={"tool_call": client_tool_call, "status": "completed"}
                                )
                                yield f"data: {client_tool_message.model_dump_json()}\n\n"
                            elif "updated_scenario" in tool_result:
                                # Stream the success message as a chat message
                                changes_summary = tool_result.get("changes_summary", "Scenario updated successfully.")
                                chat_message = StreamingMessage(
                                    type="chat",
                                    content=changes_summary,
                                    metadata={"node": node_name, "tool_result": True}
                                )
                                yield f"data: {chat_message.model_dump_json()}\n\n"
                                
                                # Create client-side tool call for frontend scenario update
                                client_tool_call = {
                                    "action": "update_scenario",
                                    "parameters": {"updated_scenario": tool_result["updated_scenario"]}
                                }
                                client_tool_message = StreamingMessage(
                                    type="tool_call",
                                    content="Updating scenario",
                                    metadata={"tool_call": client_tool_call, "status": "completed"}
                                )
                                yield f"data: {client_tool_message.model_dump_json()}\n\n"
                                
                    except Exception as e:
                        # Stream tool execution error as status
                        error_message = StreamingMessage(
                            type="status",
                            content=f"Failed to execute {tool_call.get('action', 'action')}: {str(e)}",
                            metadata={"tool_call": tool_call, "error": str(e), "status": "failed"}
                        )
                        yield f"data: {error_message.model_dump_json()}\n\n"
                
                # Stream current response if available as chat
                current_response = state.get("current_response")
                if current_response:
                    # Include follow-up questions in metadata if available
                    metadata = {"node": node_name, "final": True}
                    follow_up_questions = state.get("follow_up_questions")
                    if follow_up_questions:
                        metadata["follow_up_questions"] = follow_up_questions
                    
                    message = StreamingMessage(
                        type="chat",
                        content=current_response,
                        metadata=metadata
                    )
                    yield f"data: {message.model_dump_json()}\n\n"
                
                # Check if scenario was updated by this node (for specialized nodes like modify_character)
                current_scenario = state.get("scenario")
                if current_scenario and current_scenario != previous_scenario:
                    # Scenario was updated, send client-side tool call to update frontend
                    client_tool_call = {
                        "action": "update_scenario",
                        "parameters": {"updated_scenario": current_scenario}
                    }
                    client_tool_message = StreamingMessage(
                        type="tool_call",
                        content="Updating scenario",
                        metadata={"tool_call": client_tool_call, "status": "completed"}
                    )
                    yield f"data: {client_tool_message.model_dump_json()}\n\n"
                    
                    # Update previous_scenario for next iteration
                    previous_scenario = current_scenario
        
        # Send completion message
        completion_message = StreamingMessage(
            type="status",
            content="completed",
            metadata={"status": "completed"}
        )
        yield f"data: {completion_message.model_dump_json()}\n\n"
        
    except Exception as e:
        logger.error(f"Streaming error: {str(e)}")
        error_message = StreamingMessage(
            type="status",
            content="error",
            metadata={"error": str(e)}
        )
        yield f"data: {error_message.model_dump_json()}\n\n"


@router.get("/scenario/health")
async def agent_health_check():
    """Health check for the agent system"""
    try:
        # Test that we can create the agent graph
        create_scenario_agent_graph()
        return {"status": "healthy", "agent": "scenario_agent"}
    except Exception as e:
        logger.error(f"Agent health check failed: {str(e)}")
        return {"status": "unhealthy", "error": str(e)}