import json
import logging
from typing import Dict, Any, Optional
from domain.services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)

async def rewrite_scenario(parameters: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """Rewrite parts of the scenario based on user input"""
    user_input = parameters.get("user_input", "")
    scenario = parameters.get("scenario", {})
    
    prompt = f"""
    The user wants to rewrite part of their scenario with this request: "{user_input}"
    
    Current scenario: {json.dumps(scenario, indent=2)}
    
    Please rewrite the relevant parts of the scenario based on the user's request.
    Maintain the overall structure and style while incorporating the changes.
    
    Response format (JSON):
    {{
        "title": "rewritten title if needed",
        "synopsis": "rewritten synopsis if needed",
        "backstory": "rewritten backstory if needed",
        "storyarc": "rewritten story arc if needed"
    }}
    """
    
    try:
        # Get LLM service for user
        llm_service, _, _ = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
        
        # Generate rewrites using LLM
        response = await llm_service.chat_completion({
            "messages": [{"role": "user", "content": prompt}],
            "model": "default", 
            "temperature": 0.7
        })
        
        # Parse the rewritten content
        rewrites = json.loads(response.strip())
        
        # Apply rewrites to scenario
        updated_scenario = scenario.copy()
        updated_scenario.update(rewrites)
        
        return {
            "status": "completed",
            "updated_scenario": updated_scenario,
            "changes": rewrites
        }
        
    except Exception as e:
        logger.error(f"Failed to rewrite scenario: {str(e)}")
        return {"error": str(e), "status": "failed"}
