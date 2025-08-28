import logging
from typing import Dict, Any, AsyncGenerator
from ..state import AgentState, ToolCall
from ..streaming_tools import StreamingScenarioTools

logger = logging.getLogger(__name__)


async def streaming_node(state: AgentState) -> Dict[str, Any]:
    """
    Streaming node that handles all LLM tool calls with real-time streaming
    This replaces the individual tool nodes for streaming operations
    """
    user_input = state.get("user_input", "")
    scenario = state.get("scenario", {})
    category = state.get("category", "general conversation")
    user_id = state.get("user_id", "unknown")
    
    # Determine the appropriate action based on category
    if category == "modification":
        action = "modify_scenario"
        state["streaming_response"] = ["Modifying scenario..."]
    elif category == "details":
        action = "explain_scenario"
        state["streaming_response"] = ["Analyzing scenario details..."]
    elif category == "creation":
        action = "create_scenario"
        state["streaming_response"] = ["Creating new scenario..."]
    elif category == "general conversation":
        action = "generic_chat"
        state["streaming_response"] = ["Having a conversation..."]
    else:
        action = "generic_chat"
        state["streaming_response"] = ["Processing request..."]
    
    # Create appropriate tool call based on action
    if action == "create_scenario":
        # Extract creation info for scenario creation
        user_input_lower = user_input.lower()
        creation_info = {}
        
        if "title" in user_input_lower or "called" in user_input_lower:
            creation_info["has_title"] = True
        elif any(word in user_input_lower for word in ["genre", "setting", "fantasy", "sci-fi", "horror", "romance"]):
            creation_info["has_genre"] = True
        elif any(word in user_input_lower for word in ["character", "protagonist", "hero", "villain"]):
            creation_info["has_characters"] = True
        
        tool_call = ToolCall(
            action=action,
            parameters={"user_input": user_input, "creation_info": creation_info}
        )
    elif action == "generic_chat":
        tool_call = ToolCall(
            action=action,
            parameters={
                "user_input": user_input,
                "scenario": scenario,
                "context": "You are a helpful scenario chatbot assistant. You help users create, modify, and discuss story scenarios. Respond naturally to the user's message while being ready to assist with scenario-related tasks."
            }
        )
    else:
        # For modification and explanation
        tool_call = ToolCall(
            action=action,
            parameters={"user_input": user_input, "scenario": scenario}
        )
    
    # Store the tool call for streaming execution
    state["tool_calls"] = [tool_call.model_dump()]
    state["next_node"] = "supervisor"
    state["streaming_action"] = action  # Flag for streaming execution
    
    return state