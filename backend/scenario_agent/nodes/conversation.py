import logging
from typing import Dict, Any
from ..state import AgentState, ToolCall

logger = logging.getLogger(__name__)


async def conversation_node(state: AgentState) -> Dict[str, Any]:
    """
    Handle general conversation using LLM with scenario context
    """
    user_input = state.get("user_input", "")
    scenario = state.get("scenario", {})
    
    # Create tool call for generic chat
    tool_call = ToolCall(
        action="generic_chat",
        parameters={
            "user_input": user_input, 
            "scenario": scenario,
            "context": "You are a helpful scenario chatbot assistant. You help users create, modify, and discuss story scenarios. Respond naturally to the user's message while being ready to assist with scenario-related tasks."
        }
    )
    
    state["tool_calls"] = [tool_call.model_dump()]
    state["streaming_response"] = ["Having a conversation..."]
    state["next_node"] = "supervisor"
    state["streaming_action"] = "generic_chat"  # Flag for streaming execution
    
    return state