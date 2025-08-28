import logging
from typing import Dict, Any
from ..state import AgentState

logger = logging.getLogger(__name__)


async def supervisor_node(state: AgentState) -> Dict[str, Any]:
    """
    Supervisor node that manages workflow and handles scenario initialization.
    Classification and routing is now handled by input_classification_node.
    """
    user_input = state.get("user_input", "")
    scenario = state.get("scenario")
    
    
    # Store scenario in state if provided at start
    if not scenario and state.get("messages"):
        # Check if scenario is provided in the initial message
        first_message = state["messages"][0]
        if first_message.get("scenario"):
            scenario = first_message["scenario"]
            state["scenario"] = scenario
    
    # If no classification has been done yet, route to classification
    if "category" not in state:
        state["next_node"] = "input_classification"
        state["streaming_response"] = ["Initializing request processing..."]
        return state
    
    # If we have classification results, the routing was already handled
    # by input_classification_node, so we can proceed with the flow
    category = state.get("category", "general conversation")
    state["streaming_response"] = [f"Processing {category} request..."]
    
    return state