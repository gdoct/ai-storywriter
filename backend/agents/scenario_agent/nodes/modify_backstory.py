import json
import logging
from typing import Dict, Any
from ..state import AgentState
from domain.services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)


async def modify_backstory_node(state: AgentState) -> Dict[str, Any]:
    """
    Specialized node for modifying backstory using focused prompts
    Works directly with backstory text for faster, more precise results
    """
    user_input = state.get("user_input", "")
    scenario = state.get("scenario", {})
    user_id = state.get("user_id", "unknown")
    classified_prompt = state.get("classified_prompt", user_input)
    
    current_backstory = scenario.get("backstory", "")
    if not current_backstory:
        current_backstory = "No backstory has been established yet."
    
    try:
        state["streaming_response"] = ["Modifying backstory..."]
        
        prompt = f"""You are a world-building and lore specialist. Modify the backstory based on the user's request.

**CURRENT BACKSTORY:**
"{current_backstory}"

**MODIFICATION REQUEST:** "{classified_prompt}"

**INSTRUCTIONS:**
1. Modify the backstory according to the user's request
2. Maintain consistency with the overall story world
3. Keep the tone and style consistent with existing content
4. If adding new elements, integrate them seamlessly
5. Return ONLY the modified backstory text (no JSON, no additional formatting)
6. The response should be a coherent narrative suitable for a story scenario

MODIFIED BACKSTORY:"""

        # Get LLM service for user
        llm_service, _, _ = LLMProxyService.get_llm_service_for_user(user_id)
        
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "model": "default",
            "temperature": 0.4
        }
        
        # Get backstory modification
        response = await llm_service.chat_completion(payload)
        modified_backstory = response.strip()
        
        # Clean up any unwanted formatting
        if modified_backstory.startswith('"') and modified_backstory.endswith('"'):
            modified_backstory = modified_backstory[1:-1]
        
        # Update the scenario
        updated_scenario = scenario.copy()
        updated_scenario["backstory"] = modified_backstory
        
        # Update state
        state["scenario"] = updated_scenario
        state["current_response"] = "✅ Backstory has been successfully modified!"
        
        # Add follow-up questions
        state["follow_up_questions"] = [
            "How does this backstory affect the main characters?",
            "What are the key historical events in this world?",
            "Tell me more about the world's culture and society"
        ]
        
    except Exception as e:
        logger.error(f"Failed to modify backstory: {str(e)}")
        state["current_response"] = f"I encountered an error while modifying the backstory: {str(e)}"
    
    return state