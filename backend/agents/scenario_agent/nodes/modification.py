import logging
from typing import Dict, Any
from ..state import AgentState, ToolCall

logger = logging.getLogger(__name__)


async def modification_node(state: AgentState) -> Dict[str, Any]:
    """
    Handle scenario modifications by generating updated scenario JSON
    """
    user_input = state.get("user_input", "")
    scenario = state.get("scenario", {})
    
    # Create tool call for scenario modification
    tool_call = ToolCall(
        action="modify_scenario", 
        parameters={"user_input": user_input, "scenario": scenario}
    )
    
    state["tool_calls"] = [tool_call.model_dump()]
    state["streaming_response"] = ["Modifying scenario based on your request..."]
    state["next_node"] = "supervisor"
    state["streaming_action"] = "modify_scenario"  # Flag for streaming execution
    
    return state