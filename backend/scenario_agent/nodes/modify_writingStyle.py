import json
import logging
from typing import Dict, Any
from ..state import AgentState
from services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)


async def modify_writingStyle_node(state: AgentState) -> Dict[str, Any]:
    """
    Specialized node for modifying writing style using focused prompts
    Works with writing style object for precise genre and tone modifications
    """
    user_input = state.get("user_input", "")
    scenario = state.get("scenario", {})
    user_id = state.get("user_id", "unknown")
    classified_prompt = state.get("classified_prompt", user_input)
    
    current_style = scenario.get("writingStyle", {})
    if not current_style:
        current_style = {"genre": "General Fiction", "tone": "Neutral"}
    
    # Get context for style modifications
    title = scenario.get("title", "")
    synopsis = scenario.get("synopsis", "")
    
    try:
        state["streaming_response"] = ["Modifying writing style..."]
        
        style_json = json.dumps(current_style, indent=2)
        
        context_info = ""
        if title:
            context_info += f"\n**Title:** {title}"
        if synopsis:
            context_info += f"\n**Synopsis:** {synopsis}"
        
        prompt = f"""You are a literary style specialist. Modify the writing style based on the user's request.

**CURRENT WRITING STYLE:**
```json
{style_json}
```
{context_info}

**STYLE MODIFICATION REQUEST:** "{classified_prompt}"

**INSTRUCTIONS:**
1. Modify the writing style according to the user's request
2. Ensure the genre and tone work well together
3. Consider how the style fits with the title and synopsis
4. Return ONLY the modified writing style as valid JSON
5. Maintain the same JSON structure with "genre" and "tone" fields

**AVAILABLE GENRES:** Fantasy, Science Fiction, Mystery, Thriller, Romance, Horror, Adventure, Drama, Comedy, Historical Fiction, Contemporary Fiction, Young Adult, Literary Fiction

**TONE OPTIONS:** Dark, Light, Humorous, Serious, Mysterious, Romantic, Epic, Intimate, Suspenseful, Whimsical, Gritty, Optimistic, Melancholic, Action-packed

MODIFIED WRITING STYLE JSON:"""

        # Get LLM service for user
        llm_service, _, _ = LLMProxyService.get_llm_service_for_user(user_id)
        
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "model": "default",
            "temperature": 0.3
        }
        
        # Get writing style modification
        response = await llm_service.chat_completion(payload)
        
        # Parse the modified writing style
        response_clean = response.strip()
        if response_clean.startswith('```json'):
            response_clean = response_clean[7:]
        if response_clean.startswith('```'):
            response_clean = response_clean[3:]
        if response_clean.endswith('```'):
            response_clean = response_clean[:-3]
        response_clean = response_clean.strip()
        
        modified_style = json.loads(response_clean)
        
        # Ensure required fields exist
        if "genre" not in modified_style:
            modified_style["genre"] = current_style.get("genre", "General Fiction")
        if "tone" not in modified_style:
            modified_style["tone"] = current_style.get("tone", "Neutral")
        
        # Update the scenario
        updated_scenario = scenario.copy()
        updated_scenario["writingStyle"] = modified_style
        
        # Update state
        state["scenario"] = updated_scenario
        
        old_genre = current_style.get("genre", "Unknown")
        old_tone = current_style.get("tone", "Unknown")
        new_genre = modified_style.get("genre", "Unknown")
        new_tone = modified_style.get("tone", "Unknown")
        
        state["current_response"] = f"✅ Writing style updated! Genre: {old_genre} → {new_genre}, Tone: {old_tone} → {new_tone}"
        
        # Add follow-up questions
        state["follow_up_questions"] = [
            "How does this new style affect the story's atmosphere?",
            "What narrative techniques work best with this style?",
            "Should we adjust any characters to fit this new tone?"
        ]
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse writing style JSON: {str(e)}")
        state["current_response"] = "I had trouble understanding the writing style modification. Could you try rephrasing your request?"
        
    except Exception as e:
        logger.error(f"Failed to modify writing style: {str(e)}")
        state["current_response"] = f"I encountered an error while modifying the writing style: {str(e)}"
    
    return state