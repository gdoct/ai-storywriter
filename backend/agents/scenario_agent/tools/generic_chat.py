import logging
from typing import Dict, Any, Optional
from domain.services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)

async def generic_chat(parameters: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """Handle general conversation with scenario context"""
    user_input = parameters.get("user_input", "")
    scenario = parameters.get("scenario", {})
    context = parameters.get("context", "You are a helpful assistant.")
    
    # Build conversational prompt with scenario context
    if scenario:
        scenario_context = f"\nCurrent scenario context:\nTitle: {scenario.get('title', 'Untitled')}\nSynopsis: {scenario.get('synopsis', 'No synopsis')}"
    else:
        scenario_context = "\nNo current scenario is loaded."
    
    prompt = f"""
{context}

{scenario_context}

User message: "{user_input}"

Please respond naturally and helpfully. If the user wants to work with scenarios, guide them appropriately. If they're just chatting, engage naturally while staying in your role as a scenario assistant.
        """
    
    try:
        # Get LLM service for user
        llm_service, _, _ = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
        
        # Generate response using blocking LLM call
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "model": "default",
            "temperature": 0.7
        }
        
        # Use blocking chat completion
        response = await llm_service.chat_completion(payload)
        
        return {
            "status": "completed",
            "response": response.strip()
        }
        
    except Exception as e:
        logger.error(f"Failed to generate chat response: {str(e)}")
        return {"error": str(e), "status": "failed"}
