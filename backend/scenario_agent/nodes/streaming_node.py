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
    is_multi_operation = state.get("is_multi_operation", False)
    
    # Check if this is a multi-operation request
    if is_multi_operation:
        state["next_node"] = "multi_operation"
        return state
    
    # Use enhanced classification data if available
    action_type = state.get("action", category.replace(" ", "_"))
    target = state.get("target", "general")
    classified_prompt = state.get("classified_prompt", user_input)
    
    # Determine the appropriate action and route to specialized nodes for modifications
    if action_type == "modification":
        # Route to specialized modification nodes for better performance
        if target == "character":
            state["next_node"] = "modify_character"
            return state
        elif target == "location":
            state["next_node"] = "modify_location"
            return state
        elif target == "backstory":
            state["next_node"] = "modify_backstory"
            return state
        elif target == "storyarc":
            state["next_node"] = "modify_storyarc"
            return state
        elif target == "writingStyle":
            state["next_node"] = "modify_writingStyle"
            return state
        elif target == "scenario" and "title" in classified_prompt.lower():
            # Special case for title modifications
            state["next_node"] = "modify_title"
            return state
        else:
            # Fallback to general modification
            action = "modify_scenario"
            state["streaming_response"] = ["Modifying scenario..."]
    elif action_type == "details":
        action = "explain_scenario"
        if target == "character":
            state["streaming_response"] = ["Analyzing character details..."]
        elif target == "location":
            state["streaming_response"] = ["Examining location elements..."]
        elif target == "backstory":
            state["streaming_response"] = ["Exploring backstory details..."]
        elif target == "storyarc":
            state["streaming_response"] = ["Analyzing story structure..."]
        elif target == "writingStyle":
            state["streaming_response"] = ["Examining writing style..."]
        else:
            state["streaming_response"] = ["Analyzing scenario details..."]
    elif action_type == "creation":
        # Route to specialized creation nodes for better performance
        if target == "character":
            state["next_node"] = "create_character"
            return state
        elif target == "location":
            state["next_node"] = "create_location"
            return state
        elif target == "backstory":
            state["next_node"] = "create_backstory"
            return state
        else:
            # Fallback to full scenario creation
            action = "create_scenario"
            state["streaming_response"] = ["Creating new scenario..."]
    elif action_type == "general_conversation":
        action = "generic_chat"
        state["streaming_response"] = ["Having a conversation..."]
    else:
        action = "generic_chat"
        state["streaming_response"] = ["Processing request..."]
    
    # Create appropriate tool call based on action with enhanced context
    if action == "create_scenario":
        # Extract creation info for scenario creation with enhanced targeting
        creation_info = {
            "target": target,
            "action_type": action_type
        }
        
        # Add specific hints based on target
        if target == "character":
            creation_info["focus"] = "character_creation"
        elif target == "location":
            creation_info["focus"] = "location_creation"
        else:
            # Analyze user input for creation hints (legacy support)
            user_input_lower = classified_prompt.lower()
            if "title" in user_input_lower or "called" in user_input_lower:
                creation_info["has_title"] = True
            elif any(word in user_input_lower for word in ["genre", "setting", "fantasy", "sci-fi", "horror", "romance"]):
                creation_info["has_genre"] = True
            elif any(word in user_input_lower for word in ["character", "protagonist", "hero", "villain"]):
                creation_info["has_characters"] = True
        
        tool_call = ToolCall(
            action=action,
            parameters={
                "user_input": classified_prompt,
                "creation_info": creation_info,
                "target": target
            }
        )
    elif action == "generic_chat":
        tool_call = ToolCall(
            action=action,
            parameters={
                "user_input": classified_prompt,
                "scenario": scenario,
                "context": f"You are a helpful scenario chatbot assistant focused on {target} elements. You help users create, modify, and discuss story scenarios. Respond naturally to the user's message while being ready to assist with scenario-related tasks.",
                "target": target
            }
        )
    else:
        # For modification and explanation with enhanced context
        tool_call = ToolCall(
            action=action,
            parameters={
                "user_input": classified_prompt,
                "scenario": scenario,
                "target": target,
                "focus": f"{action_type}_{target}"
            }
        )
    
    # Store the tool call for streaming execution
    state["tool_calls"] = [tool_call.model_dump()]
    state["next_node"] = "supervisor"
    state["streaming_action"] = action  # Flag for streaming execution
    
    return state