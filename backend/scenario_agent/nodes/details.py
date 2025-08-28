import logging
from typing import Dict, Any
from ..state import AgentState, ToolCall

logger = logging.getLogger(__name__)


async def details_node(state: AgentState) -> Dict[str, Any]:
    """
    Provide explanations, clarifications and summaries about the scenario
    """
    user_input = state.get("user_input", "")
    scenario = state.get("scenario", {})
    
    # Create tool call for scenario explanation
    tool_call = ToolCall(
        action="explain_scenario",
        parameters={"user_input": user_input, "scenario": scenario}
    )
    
    state["tool_calls"] = [tool_call.model_dump()]
    state["streaming_response"] = ["Analyzing scenario details..."]
    state["next_node"] = "supervisor"
    state["streaming_action"] = "explain_scenario"  # Flag for streaming execution
    
    return state