import json
import logging
from typing import Dict, Any
from ..state import AgentState
from services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)


async def modify_storyarc_node(state: AgentState) -> Dict[str, Any]:
    """
    Specialized node for modifying story arc using focused prompts
    Works directly with story arc text for faster, more precise results
    """
    user_input = state.get("user_input", "")
    scenario = state.get("scenario", {})
    user_id = state.get("user_id", "unknown")
    classified_prompt = state.get("classified_prompt", user_input)
    
    current_storyarc = scenario.get("storyarc", "")
    if not current_storyarc:
        current_storyarc = "No story arc has been established yet."
    
    # Get related context for better modifications
    title = scenario.get("title", "")
    synopsis = scenario.get("synopsis", "")
    backstory = scenario.get("backstory", "")
    
    try:
        state["streaming_response"] = ["Modifying story arc..."]
        
        context_info = ""
        if title:
            context_info += f"\n**Title:** {title}"
        if synopsis:
            context_info += f"\n**Synopsis:** {synopsis}"
        if backstory and len(backstory) < 300:  # Include backstory if not too long
            context_info += f"\n**Backstory:** {backstory}"
        
        prompt = f"""You are a narrative structure specialist. Modify the story arc based on the user's request.

**CURRENT STORY ARC:**
"{current_storyarc}"
{context_info}

**MODIFICATION REQUEST:** "{classified_prompt}"

**INSTRUCTIONS:**
1. Modify the story arc according to the user's request
2. Ensure the progression is logical and engaging
3. Maintain consistency with the title, synopsis, and backstory
4. Keep the narrative flow coherent
5. Return ONLY the modified story arc text (no JSON, no additional formatting)
6. The response should be a clear narrative progression suitable for a story scenario

MODIFIED STORY ARC:"""

        # Get LLM service for user
        llm_service, _, _ = LLMProxyService.get_llm_service_for_user(user_id)
        
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "model": "default",
            "temperature": 0.4
        }
        
        # Get story arc modification
        response = await llm_service.chat_completion(payload)
        modified_storyarc = response.strip()
        
        # Clean up any unwanted formatting
        if modified_storyarc.startswith('"') and modified_storyarc.endswith('"'):
            modified_storyarc = modified_storyarc[1:-1]
        
        # Update the scenario
        updated_scenario = scenario.copy()
        updated_scenario["storyarc"] = modified_storyarc
        
        # Update state
        state["scenario"] = updated_scenario
        state["current_response"] = "✅ Story arc has been successfully modified!"
        
        # Add follow-up questions
        state["follow_up_questions"] = [
            "What are the key turning points in this story?",
            "How do the characters develop throughout this arc?",
            "What conflicts drive this narrative forward?"
        ]
        
    except Exception as e:
        logger.error(f"Failed to modify story arc: {str(e)}")
        state["current_response"] = f"I encountered an error while modifying the story arc: {str(e)}"
    
    return state