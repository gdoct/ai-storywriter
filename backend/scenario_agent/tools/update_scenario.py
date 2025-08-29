import json
import logging
from typing import Dict, Any, Optional
from services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)

async def update_scenario(parameters: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """Update scenario with new information from user input"""
    user_input = parameters.get("user_input", "")
    scenario = parameters.get("scenario", {})
    
    # Use LLM to determine what needs to be updated
    prompt = f"""
    The user wants to update their scenario with this request: "{user_input}"
    
    Current scenario: {json.dumps(scenario, indent=2)}
    
    Please provide the updated scenario fields that should be changed based on the user's request.
    Only include the fields that need to be modified.
    
    Response format (JSON):
    {{
        "title": "new title if requested",
        "synopsis": "new synopsis if requested", 
        "notes": "updated notes if requested"
    }}
    """
    
    try:
        # Get LLM service for user
        llm_service, _, _ = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
        
        # Generate the updates using LLM
        response = await llm_service.chat_completion({
            "messages": [{"role": "user", "content": prompt}],
            "model": "default",
            "temperature": 0.7
        })
        
        # Parse the LLM response to get updates
        updates = json.loads(response.strip())
        
        # Apply updates to scenario
        updated_scenario = scenario.copy()
        updated_scenario.update(updates)
        
        return {
            "status": "completed",
            "updated_scenario": updated_scenario,
            "changes": updates
        }
        
    except Exception as e:
        logger.error(f"Failed to update scenario: {str(e)}")
        return {"error": str(e), "status": "failed"}
