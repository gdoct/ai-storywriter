"""
Streaming agent router that provides true real-time LLM responses
"""
import json
import logging
from typing import Dict, Any, AsyncGenerator
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from api.middleware.fastapi_auth import get_current_user
from agents.scenario_agent.graph import create_scenario_agent_graph
from agents.scenario_agent.state import AgentState, StreamingMessage
from agents.scenario_agent.tools import ScenarioAgentTools
from agents.scenario_agent.clean_streaming import stream_agent_clean
from domain.services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)

router = APIRouter()


class StreamingAgentRequest(BaseModel):
    """Request model for streaming agent interactions"""
    message: str
    scenario: Dict[str, Any] = {}


@router.post("/scenario/stream")
async def streaming_scenario_agent_endpoint(
    agent_request: StreamingAgentRequest,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Streaming scenario agent endpoint with true real-time responses
    """
    try:
        # Extract BYOK headers
        byok_headers = LLMProxyService.extract_byok_headers(dict(request.headers))
        
        return StreamingResponse(
            stream_agent_clean(
                agent_request.message, 
                agent_request.scenario,
                current_user["id"], 
                byok_headers
            ),
            media_type="text/plain",
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        )
        
    except Exception as e:
        logger.error(f"Streaming agent endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Streaming agent error: {str(e)}")


async def stream_agent_with_realtime_llm(
    user_input: str,
    scenario: Dict[str, Any],
    user_id: str,
    byok_headers: Dict[str, Any] = None
) -> AsyncGenerator[str, None]:
    """
    Stream agent responses with true real-time LLM streaming
    """
    try:
        # Create the agent graph
        agent_graph = create_scenario_agent_graph()
        
        # Initialize state
        initial_state: AgentState = {
            "messages": [{"content": user_input, "scenario": scenario}],
            "scenario": scenario,
            "user_input": user_input,
            "current_response": "",
            "next_node": None,
            "streaming_response": [],
            "tool_calls": [],
            "user_id": user_id
        }
        
        # Process through the agent graph until we reach a streaming tool
        current_state = initial_state
        streaming_tool_call = None
        
        found_streaming_tool = False
        async for step in agent_graph.astream(current_state):
            for node_name, state in step.items():
                # Stream status updates
                streaming_responses = state.get("streaming_response", [])
                for response in streaming_responses:
                    message = StreamingMessage(
                        type="status",
                        content=response,
                        metadata={"node": node_name}
                    )
                    yield f"data: {message.model_dump_json()}\n\n"
                
                # Look for streaming tool calls
                tool_calls = state.get("tool_calls", [])
                if tool_calls and state.get("streaming_action"):
                    streaming_tool_call = tool_calls[0]
                    found_streaming_tool = True
                    break
                    
                # Handle non-streaming tool calls (like classification)
                for tool_call in tool_calls:
                    if tool_call.get("action") == "classify_input":
                        # Execute classification immediately
                        result = await ScenarioAgentTools.execute_tool(tool_call, user_id, byok_headers)
                        if result.get("status") == "completed":
                            state["category"] = result.get("category", "general conversation")
                            state["classification_result"] = result
                
                # Stream final responses
                current_response = state.get("current_response")
                if current_response:
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
                
                current_state = state
            
            # If we found a streaming tool call, break and handle it
            if found_streaming_tool:
                break
        
        # Execute the streaming tool call if we found one
        if streaming_tool_call:
            action = streaming_tool_call.get("action", "unknown")
            
            # Send tool start message
            start_message = StreamingMessage(
                type="status",
                content=f"Starting {action}...",
                metadata={"tool_call": streaming_tool_call, "status": "executing"}
            )
            yield f"data: {start_message.model_dump_json()}\n\n"
            
            # Stream the LLM response in real-time
            async for stream_message in StreamingScenarioTools.stream_tool_response(
                streaming_tool_call, user_id, byok_headers
            ):
                # Convert streaming tool messages to StreamingMessage format
                if stream_message["type"] == "chat":
                    message = StreamingMessage(
                        type="chat",
                        content=stream_message["content"],
                        metadata={
                            "streaming": stream_message.get("streaming", False),
                            "action": stream_message.get("action"),
                            "token": True  # Mark as individual token
                        }
                    )
                    yield f"data: {message.model_dump_json()}\n\n"
                    
                elif stream_message["type"] == "tool_result":
                    # Handle tool results (like updated scenarios)
                    if "updated_scenario" in stream_message:
                        # Send scenario update to frontend
                        client_tool_call = {
                            "action": "update_scenario",
                            "parameters": {"updated_scenario": stream_message["updated_scenario"]}
                        }
                        tool_message = StreamingMessage(
                            type="tool_call",
                            content="Updating scenario",
                            metadata={"tool_call": client_tool_call, "status": "completed"}
                        )
                        yield f"data: {tool_message.model_dump_json()}\n\n"
                        
                        # Send success message
                        success_message = StreamingMessage(
                            type="chat",
                            content="✅ **Scenario Updated Successfully!** The scenario editor has been updated with your changes!",
                            metadata={"final": True, "tool_result": True}
                        )
                        yield f"data: {success_message.model_dump_json()}\n\n"
                        
                    elif "scenario" in stream_message:
                        # Handle new scenario creation
                        client_tool_call = {
                            "action": "create_scenario", 
                            "parameters": {"scenario": stream_message["scenario"]}
                        }
                        tool_message = StreamingMessage(
                            type="tool_call",
                            content="Creating new scenario",
                            metadata={"tool_call": client_tool_call, "status": "completed"}
                        )
                        yield f"data: {tool_message.model_dump_json()}\n\n"
                        
                        # Send success message
                        success_message = StreamingMessage(
                            type="chat",
                            content="✅ **New Scenario Created!** Your scenario has been created and is ready to use!",
                            metadata={"final": True, "tool_result": True}
                        )
                        yield f"data: {success_message.model_dump_json()}\n\n"
                
                elif stream_message["type"] == "error":
                    error_message = StreamingMessage(
                        type="status",
                        content=f"Error: {stream_message['content']}",
                        metadata={"error": True, "action": stream_message.get("action")}
                    )
                    yield f"data: {error_message.model_dump_json()}\n\n"
                
                elif stream_message["type"] == "completion":
                    # Tool completed successfully
                    completion_message = StreamingMessage(
                        type="status", 
                        content=f"Completed {stream_message.get('action')}",
                        metadata={"status": "completed", "action": stream_message.get("action")}
                    )
                    yield f"data: {completion_message.model_dump_json()}\n\n"
        
        # Send final completion message
        completion_message = StreamingMessage(
            type="status",
            content="completed",
            metadata={"status": "completed"}
        )
        yield f"data: {completion_message.model_dump_json()}\n\n"
        
    except Exception as e:
        logger.error(f"Real-time streaming error: {str(e)}")
        error_message = StreamingMessage(
            type="status",
            content="error",
            metadata={"error": str(e)}
        )
        yield f"data: {error_message.model_dump_json()}\n\n"


@router.get("/scenario/stream/health")
async def streaming_agent_health_check():
    """Health check for the streaming agent system"""
    try:
        # Test that we can create the agent graph and streaming tools
        create_scenario_agent_graph()
        return {"status": "healthy", "agent": "streaming_scenario_agent", "features": ["real_time_streaming"]}
    except Exception as e:
        logger.error(f"Streaming agent health check failed: {str(e)}")
        return {"status": "unhealthy", "error": str(e)}