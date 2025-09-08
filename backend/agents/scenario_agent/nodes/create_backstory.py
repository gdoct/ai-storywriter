import json
import logging
from typing import Dict, Any
from ..state import AgentState
from domain.services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)


async def create_backstory_node(state: AgentState) -> Dict[str, Any]:
    """
    Specialized node for creating/enhancing backstory using targeted prompts
    Adds to or creates backstory elements for the scenario
    """
    user_input = state.get("user_input", "")
    scenario = state.get("scenario", {})
    user_id = state.get("user_id", "unknown")
    classified_prompt = state.get("classified_prompt", user_input)
    
    existing_backstory = scenario.get("backstory", "")
    
    # Get scenario context for backstory creation
    title = scenario.get("title", "")
    synopsis = scenario.get("synopsis", "")
    genre = scenario.get("writingStyle", {}).get("genre", "")
    tone = scenario.get("writingStyle", {}).get("tone", "")
    
    try:
        state["streaming_response"] = ["Creating backstory elements..."]
        
        # Build context information
        context_info = ""
        if title:
            context_info += f"**Scenario Title:** {title}\n"
        if synopsis:
            context_info += f"**Synopsis:** {synopsis}\n"
        if genre:
            context_info += f"**Genre:** {genre}\n"
        if tone:
            context_info += f"**Tone:** {tone}\n"
        
        # Determine if we're adding to existing backstory or creating new
        if existing_backstory:
            context_info += f"**Existing Backstory:** {existing_backstory}\n"
            instruction_type = "enhance and expand"
            action_word = "enhanced"
        else:
            instruction_type = "create"
            action_word = "created"
        
        prompt = f"""You are a world-building and lore specialist. {instruction_type.title()} backstory elements based on the user's request.

{context_info}

**BACKSTORY REQUEST:** "{classified_prompt}"

**INSTRUCTIONS:**
1. {instruction_type.title()} backstory that fits the scenario's genre and tone
2. {"Integrate seamlessly with existing backstory elements" if existing_backstory else "Create rich, compelling world history and context"}
3. Ensure consistency with the title and synopsis
4. Make the backstory engaging and relevant to the story
5. Return ONLY the {"enhanced" if existing_backstory else "new"} backstory text (no JSON, no additional formatting)
6. The response should be a coherent narrative suitable for a story scenario

{"ENHANCED" if existing_backstory else "NEW"} BACKSTORY:"""

        # Get LLM service for user
        llm_service, _, _ = LLMProxyService.get_llm_service_for_user(user_id)
        
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "model": "default",
            "temperature": 0.5
        }
        
        # Get backstory creation/enhancement
        response = await llm_service.chat_completion(payload)
        new_backstory = response.strip()
        
        # Clean up any unwanted formatting
        if new_backstory.startswith('"') and new_backstory.endswith('"'):
            new_backstory = new_backstory[1:-1]
        
        # Update the scenario
        updated_scenario = scenario.copy()
        updated_scenario["backstory"] = new_backstory
        
        # Update state
        state["scenario"] = updated_scenario
        state["current_response"] = f"✅ Backstory has been successfully {action_word}!"
        
        # Add follow-up questions
        state["follow_up_questions"] = [
            "How does this backstory influence the current events?",
            "What ancient secrets or mysteries exist in this world?",
            "How do the characters connect to this history?"
        ]
        
    except Exception as e:
        logger.error(f"Failed to create backstory: {str(e)}")
        state["current_response"] = f"I encountered an error while creating the backstory: {str(e)}"
    
    return state