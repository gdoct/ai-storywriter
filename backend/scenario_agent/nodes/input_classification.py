import logging
from typing import Dict, Any
from ..state import AgentState

logger = logging.getLogger(__name__)


async def input_classification_node(state: AgentState) -> Dict[str, Any]:
    """
    Classify the user's input and route to appropriate specialized node.
    This should be the first step in agent processing.
    """
    user_input = state.get("user_input", "")
    scenario = state.get("scenario", {})

    # Check if we already have a category (to prevent re-classification)
    if state.get("category"):
        return state

    # For classification, we need the result immediately for routing
    # so we execute the tool directly here
    from scenario_agent.tools import ScenarioAgentTools
    
    state["streaming_response"] = ["Analyzing your request..."]
    
    try:
        tool_call_dict = {
            "action": "classify_input",
            "parameters": {"user_input": user_input, "scenario": scenario}
        }
        
        user_id = state.get("user_id", "unknown")
        result = await ScenarioAgentTools.execute_tool(tool_call_dict, user_id, None)
        
        if result.get("status") == "completed":
            category = result.get("category", "general conversation")
            state["category"] = category
            state["classification_result"] = result
        else:
            # Classification failed, default to general conversation
            state["category"] = "general conversation"
            
    except Exception:
        # On any error, default to general conversation
        state["category"] = "general conversation"
    
    return state