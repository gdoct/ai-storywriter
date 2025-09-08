import json
import logging
from typing import Dict, Any, Optional
from domain.services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)

async def create_scenario(parameters: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """Create a new scenario based on user input"""
    user_input = parameters.get("user_input", "")
    creation_info = parameters.get("creation_info", {})
    
    prompt = f"""
    Create a complete new scenario based on the user's request: "{user_input}"
    
    Creation context: {json.dumps(creation_info, indent=2)}
    
    Generate a full scenario including all necessary components.
    
    Response format (JSON):
    {{
        "title": "Scenario Title",
        "synopsis": "Brief scenario summary", 
        "writingStyle": {{
            "genre": "fantasy/sci-fi/mystery/etc",
            "tone": "description of tone"
        }},
        "characters": [
            {{
                "name": "Character Name",
                "backstory": "Character background",
                "personality": "Character traits",
                "role": "Character's role"
            }}
        ],
        "locations": [
            {{
                "name": "Location Name",
                "description": "Location description"
            }}
        ],
        "backstory": "World/setting background",
        "storyarc": "Main story progression",
        "notes": "Additional notes"
    }}
    """
    
    try:
        # Get LLM service for user
        llm_service, _, _ = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
        
        # Generate new scenario using LLM
        response = await llm_service.chat_completion({
            "messages": [{"role": "user", "content": prompt}],
            "model": "default",
            "temperature": 0.8
        })
        
        # Parse the scenario data
        scenario_data = json.loads(response.strip())
        
        # Add IDs to characters and locations
        for i, char in enumerate(scenario_data.get("characters", [])):
            char["id"] = f"char_{user_id}_{i}"
            
        for i, loc in enumerate(scenario_data.get("locations", [])):
            loc["id"] = f"loc_{user_id}_{i}"
        
        return {
            "status": "completed",
            "scenario": scenario_data
        }
        
    except Exception as e:
        logger.error(f"Failed to create scenario: {str(e)}")
        return {"error": str(e), "status": "failed"}
