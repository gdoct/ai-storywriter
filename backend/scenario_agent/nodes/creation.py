import logging
from typing import Dict, Any
from ..state import AgentState, ToolCall

logger = logging.getLogger(__name__)


async def creation_node(state: AgentState) -> Dict[str, Any]:
    """
    Create new scenarios based on user input
    """
    user_input = state.get("user_input", "")
    
    # Extract information from user input
    user_input_lower = user_input.lower()
    
    creation_info = {}
    
    # Check for title/synopsis
    if "title" in user_input_lower or "called" in user_input_lower:
        state["streaming_response"] = ["using user-provided title or synopsis for new scenario.."]
        creation_info["has_title"] = True
        
    # Check for genre/setting
    elif any(word in user_input_lower for word in ["genre", "setting", "fantasy", "sci-fi", "horror", "romance"]):
        state["streaming_response"] = ["using user-provided genre or setting for new scenario.."]
        creation_info["has_genre"] = True
        
    # Check for characters
    elif any(word in user_input_lower for word in ["character", "protagonist", "hero", "villain"]):
        state["streaming_response"] = ["using user-provided characters for new scenario.."]
        creation_info["has_characters"] = True
        
    else:
        state["streaming_response"] = ["creating new scenario.."]
    
    # Create tool call for scenario creation
    tool_call = ToolCall(
        action="create_scenario",
        parameters={"user_input": user_input, "creation_info": creation_info}
    )
    state["tool_calls"] = [tool_call.model_dump()]
    state["next_node"] = "supervisor"
    state["streaming_action"] = "create_scenario"  # Flag for streaming execution
    
    return state