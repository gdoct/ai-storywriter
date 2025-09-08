import json
import logging
from typing import Dict, Any
from ..state import AgentState
from domain.services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)


async def modify_title_node(state: AgentState) -> Dict[str, Any]:
    """
    Specialized node for modifying scenario title using focused prompts
    Works with title and synopsis for context-aware title generation
    """
    user_input = state.get("user_input", "")
    scenario = state.get("scenario", {})
    user_id = state.get("user_id", "unknown")
    classified_prompt = state.get("classified_prompt", user_input)
    
    current_title = scenario.get("title", "Untitled Scenario")
    synopsis = scenario.get("synopsis", "")
    genre = scenario.get("writingStyle", {}).get("genre", "")
    
    try:
        state["streaming_response"] = ["Creating new title..."]
        
        prompt = f"""You are a creative writing specialist focused on crafting compelling titles. Create a new title based on the user's request.

**CURRENT TITLE:** "{current_title}"
**SYNOPSIS:** "{synopsis}"
**GENRE:** "{genre}"

**TITLE CHANGE REQUEST:** "{classified_prompt}"

**INSTRUCTIONS:**
1. Create a new title that captures the essence of the story
2. Consider the genre and tone when crafting the title
3. Make it engaging and memorable
4. Keep it concise (typically 1-5 words)
5. Return ONLY the new title text (no quotes, no additional text)

NEW TITLE:"""

        # Get LLM service for user
        llm_service, _, _ = LLMProxyService.get_llm_service_for_user(user_id)
        
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "model": "default",
            "temperature": 0.7
        }
        
        # Get title modification
        response = await llm_service.chat_completion(payload)
        new_title = response.strip()
        
        # Clean up any unwanted formatting
        if new_title.startswith('"') and new_title.endswith('"'):
            new_title = new_title[1:-1]
        new_title = new_title.replace('\n', ' ').strip()
        
        # Update the scenario
        updated_scenario = scenario.copy()
        updated_scenario["title"] = new_title
        
        # Update state
        state["scenario"] = updated_scenario
        state["current_response"] = f"✅ Title has been changed from '{current_title}' to '{new_title}'!"
        
        # Add follow-up questions
        state["follow_up_questions"] = [
            "What does this title suggest about the story?",
            "How does the new title reflect the main themes?",
            "Would you like to adjust the synopsis to match the new title?"
        ]
        
    except Exception as e:
        logger.error(f"Failed to modify title: {str(e)}")
        state["current_response"] = f"I encountered an error while modifying the title: {str(e)}"
    
    return state