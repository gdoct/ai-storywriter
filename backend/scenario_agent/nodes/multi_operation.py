import logging
from typing import Dict, Any
from ..state import AgentState

logger = logging.getLogger(__name__)


async def multi_operation_node(state: AgentState) -> Dict[str, Any]:
    """
    Handle sequential execution of multiple operations
    Routes to appropriate specialized nodes and manages operation flow
    """
    operations = state.get("operations", [])
    current_index = state.get("current_operation_index", 0)
    is_multi = state.get("is_multi_operation", False)
    
    if not operations or current_index >= len(operations):
        # No more operations, wrap up
        state["next_node"] = "supervisor"
        if is_multi:
            state["current_response"] = "✅ All operations completed successfully!"
        return state
    
    # Get current operation
    current_operation = operations[current_index]
    action = current_operation.get("action", "general_conversation")
    target = current_operation.get("target", "general")
    prompt = current_operation.get("prompt", "")
    
    # Update state with current operation details for specialized nodes
    state["action"] = action
    state["target"] = target
    state["classified_prompt"] = prompt
    
    # Set status for multi-operation progress
    if is_multi:
        total_ops = len(operations)
        state["streaming_response"] = [f"Operation {current_index + 1}/{total_ops}: {prompt}"]
    
    # Route to appropriate specialized node based on action and target
    if action == "modification":
        if target == "character":
            state["next_node"] = "modify_character"
        elif target == "location":
            state["next_node"] = "modify_location"
        elif target == "backstory":
            state["next_node"] = "modify_backstory"
        elif target == "storyarc":
            state["next_node"] = "modify_storyarc"
        elif target == "writingStyle":
            state["next_node"] = "modify_writingStyle"
        elif target == "scenario" and "title" in prompt.lower():
            state["next_node"] = "modify_title"
        else:
            # Fallback to general modification
            state["next_node"] = "modification"
            
    elif action == "creation":
        if target == "character":
            state["next_node"] = "create_character"
        elif target == "location":
            state["next_node"] = "create_location"
        elif target == "backstory":
            state["next_node"] = "create_backstory"
        else:
            # Fallback to full scenario creation
            state["next_node"] = "creation"
            
    elif action == "details":
        state["next_node"] = "details"
        
    else:
        # General conversation or unknown
        state["next_node"] = "conversation"
    
    # Mark that we should return to multi-operation handler after completing this operation
    state["return_to_multi_operation"] = True
    
    return state


async def advance_multi_operation_node(state: AgentState) -> Dict[str, Any]:
    """
    Advance to the next operation in a multi-operation sequence
    Called after completing an individual operation
    """
    operations = state.get("operations", [])
    current_index = state.get("current_operation_index", 0)
    is_multi = state.get("is_multi_operation", False)
    
    if not is_multi:
        # Not a multi-operation, just continue to supervisor
        state["next_node"] = "supervisor"
        return state
    
    # Increment operation index
    next_index = current_index + 1
    state["current_operation_index"] = next_index
    
    if next_index >= len(operations):
        # All operations completed
        state["current_response"] = "✅ All operations completed successfully!"
        state["next_node"] = "supervisor"
        
        # Collect all follow-up questions from completed operations if any were set
        all_follow_ups = []
        if state.get("follow_up_questions"):
            all_follow_ups.extend(state["follow_up_questions"])
        
        # Add some general multi-operation follow-ups
        if len(operations) > 1:
            all_follow_ups.extend([
                "What other changes would you like to make?",
                "How do these changes work together?", 
                "Tell me more about the updated scenario"
            ])
        
        if all_follow_ups:
            state["follow_up_questions"] = all_follow_ups[:5]  # Limit to 5
        
    else:
        # More operations to process
        state["next_node"] = "multi_operation"
    
    # Clear the return flag
    state["return_to_multi_operation"] = False
    
    return state