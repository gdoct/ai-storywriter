import json
import logging
from typing import Dict, Any, Optional
from services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)

async def generate_location(parameters: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """Generate a new location based on user input"""
    user_input = parameters.get("user_input", "")
    scenario = parameters.get("scenario", {})
    
    prompt = f"""
    Create a new location for this scenario based on the user's request: "{user_input}"
    
    Current scenario context: {json.dumps(scenario, indent=2)}
    
    Generate a location that fits the scenario's genre, setting, and style.
    
    Response format (JSON):
    {{
        "name": "Location Name",
        "description": "Detailed description of the location",
        "atmosphere": "The mood and feeling of this place",
        "significance": "Why this location is important to the story"
    }}
    """
    
    try:
        # Get LLM service for user
        llm_service, _, _ = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
        
        # Generate location using LLM
        response = await llm_service.chat_completion({
            "messages": [{"role": "user", "content": prompt}],
            "model": "default",
            "temperature": 0.8
        })
        
        # Parse the location data
        location_data = json.loads(response.strip())
        
        # Add unique ID for the location
        location_data["id"] = f"loc_{user_id}_{len(scenario.get('locations', []))}"
        
        return {
            "status": "completed",
            "location": location_data
        }
        
    except Exception as e:
        logger.error(f"Failed to generate location: {str(e)}")
        return {"error": str(e), "status": "failed"}
