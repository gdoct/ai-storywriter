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
        # Get conversation history from messages
        messages = state.get("messages", [])
        conversation_history = []
        if messages:
            # Convert messages to conversation history format
            for msg in messages:
                if isinstance(msg, dict):
                    conversation_history.append({
                        "role": msg.get("role", "user"),
                        "content": msg.get("content", "")
                    })
        
        tool_call_dict = {
            "action": "classify_input",
            "parameters": {
                "user_input": user_input, 
                "scenario": scenario,
                "conversation_history": conversation_history
            }
        }
        
        user_id = state.get("user_id", "unknown")
        result = await ScenarioAgentTools.execute_tool(tool_call_dict, user_id, None)
        
        if result.get("status") == "completed":
            # Handle new detailed classification format with multi-operation support
            classification = result.get("classification", {})
            action = result.get("action", classification.get("action", "general_conversation"))
            target = result.get("target", classification.get("target", "general"))
            prompt_text = result.get("prompt", classification.get("prompt", user_input))
            operations = result.get("operations", [])
            is_multi_operation = result.get("is_multi_operation", False)
            
            # Map action to category for backward compatibility
            category = action.replace("_", " ")  # Convert general_conversation back to "general conversation"
            
            state["category"] = category
            state["action"] = action
            state["target"] = target
            state["classified_prompt"] = prompt_text
            state["operations"] = operations
            state["is_multi_operation"] = is_multi_operation
            state["current_operation_index"] = 0
            state["classification_result"] = result
            
            # If multi-operation, update status to show total count
            if is_multi_operation:
                state["streaming_response"] = [f"Processing {len(operations)} operations..."]
            
        else:
            # Classification failed, default to general conversation
            state["category"] = "general conversation"
            state["action"] = "general_conversation"
            state["target"] = "general"
            state["classified_prompt"] = user_input
            state["operations"] = [{"action": "general_conversation", "target": "general", "prompt": user_input}]
            state["is_multi_operation"] = False
            state["current_operation_index"] = 0
            
    except Exception:
        # On any error, default to general conversation
        state["category"] = "general conversation"
        state["action"] = "general_conversation"
        state["target"] = "general"
        state["classified_prompt"] = user_input
        state["operations"] = [{"action": "general_conversation", "target": "general", "prompt": user_input}]
        state["is_multi_operation"] = False
        state["current_operation_index"] = 0
    
    return state