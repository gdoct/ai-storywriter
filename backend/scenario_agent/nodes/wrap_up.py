import logging
from typing import Dict, Any
from ..state import AgentState

logger = logging.getLogger(__name__)


async def wrap_up_node(state: AgentState) -> Dict[str, Any]:
    """
    Final node that ends the flow with follow-up questions
    """
    scenario = state.get("scenario", {})
    user_input = state.get("user_input", "")
    
    # Create a helpful response with context
    if scenario:
        scenario_title = scenario.get("title", "your scenario")
        response = f"I'm here to help with {scenario_title}! What would you like to explore next?"
    else:
        response = "I'm ready to help you with your storytelling needs! How can I assist you?"
    
    # Generate contextual follow-up questions
    follow_up_questions = []
    
    if scenario:
        # If we have a scenario, suggest specific actions
        if scenario.get("characters"):
            follow_up_questions.append("Can you explain the main character's motivation?")
            follow_up_questions.append("Add a new character to this story")
        else:
            follow_up_questions.append("Create some characters for this scenario")
            follow_up_questions.append("What genre would work best for this story?")
            
        if scenario.get("locations"):
            follow_up_questions.append("Describe the most important location in detail")
        else:
            follow_up_questions.append("Add some locations to this scenario")
            
        # Always include these scenario-specific options
        if not any(word in user_input.lower() for word in ["modify", "change", "update", "add"]):
            follow_up_questions.append("Modify something in the scenario")
        if not any(word in user_input.lower() for word in ["explain", "tell", "describe"]):
            follow_up_questions.append("Explain the plot in more detail")
    else:
        # If no scenario, suggest getting started
        follow_up_questions = [
            "Create a new scenario from scratch",
            "Help me develop a story idea I have",
        ]
    
    # Limit to 2 follow-up questions and make sure they're unique
    follow_up_questions = list(set(follow_up_questions))[:2]
    
    state["current_response"] = response
    state["follow_up_questions"] = follow_up_questions
    state["streaming_response"] = [response]
    
    return state