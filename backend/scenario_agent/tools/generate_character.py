import json
import logging
from typing import Dict, Any, Optional
from services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)

async def generate_character(parameters: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """Generate a new character based on user input"""
    user_input = parameters.get("user_input", "")
    scenario = parameters.get("scenario", {})
    
    prompt = f"""
    Create a new character for this scenario based on the user's request: "{user_input}"
    
    Current scenario context: {json.dumps(scenario, indent=2)}
    
    Generate a character that fits the scenario's genre, setting, and style.
    
    Response format (JSON):
    {{
        "name": "Character Name",
        "backstory": "Character background and history",
        "personality": "Character personality traits",
        "appearance": "Physical description",
        "role": "Character's role in the story"
    }}
    """
    
    try:
        # Get LLM service for user
        llm_service, _, _ = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
        
        # Generate character using LLM
        response = await llm_service.chat_completion({
            "messages": [{"role": "user", "content": prompt}],
            "model": "default",
            "temperature": 0.8
        })
        
        # Parse the character data
        character_data = json.loads(response.strip())
        
        # Add unique ID for the character
        character_data["id"] = f"char_{user_id}_{len(scenario.get('characters', []))}"
        
        return {
            "status": "completed",
            "character": character_data
        }
        
    except Exception as e:
        logger.error(f"Failed to generate character: {str(e)}")
        return {"error": str(e), "status": "failed"}
