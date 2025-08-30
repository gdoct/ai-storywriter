"""Utility for generating follow-up questions using the LLM."""
import logging
from typing import Dict, Any, List
from scenario_agent.tools import ScenarioAgentTools

logger = logging.getLogger(__name__)

async def generate_followup_questions_for_state(state: Dict[str, Any]) -> List[str]:
    """
    Generate follow-up questions based on the current state using the LLM.
    
    Args:
        state: AgentState containing user_input, scenario, action, target, etc.
    
    Returns:
        List of 3 follow-up questions
    """
    user_input = state.get("user_input", "")
    scenario = state.get("scenario", {})
    action = state.get("action", "general_conversation")
    target = state.get("target", "general")
    classified_prompt = state.get("classified_prompt", user_input)
    user_id = state.get("user_id", "unknown")
    
    try:
        tool_call = {
            "action": "generate_followup_questions",
            "parameters": {
                "user_input": user_input,
                "scenario": scenario,
                "action": action,
                "target": target,
                "classified_prompt": classified_prompt
            }
        }
        
        result = await ScenarioAgentTools.execute_tool(tool_call, user_id)
        
        if result.get("status") == "completed":
            return result.get("follow_up_questions", [])
        else:
            logger.warning(f"Follow-up generation failed: {result.get('error', 'Unknown error')}")
            return _get_generic_fallback_questions()
            
    except Exception as e:
        logger.error(f"Error generating follow-up questions: {str(e)}")
        return _get_generic_fallback_questions()


def _get_generic_fallback_questions() -> List[str]:
    """Fallback questions when generation fails completely."""
    return [
        "What else would you like to explore?",
        "How can I help develop this further?",
        "What aspect interests you most?"
    ]