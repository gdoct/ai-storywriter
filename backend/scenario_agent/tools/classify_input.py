import logging
from typing import Dict, Any, Optional
from services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)

async def classify_input(parameters: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """Classify user input into categories like 'update', 'generate_character', etc."""
    user_input = parameters.get("user_input", "")
    
    prompt = f"""Classify this user input into exactly one category. Respond with ONLY the category name:

CATEGORIES:
- "details": User wants explanations, clarifications, information, or summaries about an existing scenario (examples: "explain the plot", "what is the story about", "tell me about the characters", "describe the setting")
- "modification": User wants to change, update, edit, or modify an existing scenario (examples: "change the character", "update the plot", "rewrite this part", "add a new location")
- "creation": User wants to create something entirely new (examples: "create a new scenario", "make a character", "build a story from scratch")
- "general conversation": Everything else that doesn't fit the above (greetings, questions about the system, unrelated topics)

USER INPUT: "{user_input}"

CATEGORY:"""
    
    try:
        # Get LLM service for user
        llm_service, _, _ = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
        
        # Get classification using LLM
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "model": "default",
            "temperature": 0.0
        }
        
        # Use blocking chat completion
        full_response = await llm_service.chat_completion(payload)
        category = full_response.strip().lower()
        
        valid_categories = {"modification", "details", "creation", "general conversation"}

        if category in valid_categories:
            return {"status": "completed", "category": category}
        else:
            # If category is not valid, try to map it to a valid one
            if any(word in category for word in ["modify", "change", "update", "edit", "rewrite", "generate", "add", "remove", "delete"]):
                return {"status": "completed", "category": "modification"}
            elif any(word in category for word in ["explain", "tell", "what", "describe", "clarify", "summary", "detail"]):
                return {"status": "completed", "category": "details"}
            elif any(word in category for word in ["create", "new", "make", "build"]):
                return {"status": "completed", "category": "creation"}
            else:
                return {"status": "completed", "category": "general conversation"}
        
    except Exception as e:
        logger.error(f"Failed to classify input: {str(e)}")
        return {"error": str(e), "status": "failed"}
