import json
import logging
from typing import Dict, Any
from ..state import AgentState
from domain.services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)


async def modify_character_node(state: AgentState) -> Dict[str, Any]:
    """
    Specialized node for modifying character details using targeted prompts
    Works with individual character data for faster, more precise results
    """
    user_input = state.get("user_input", "")
    scenario = state.get("scenario", {})
    user_id = state.get("user_id", "unknown")
    classified_prompt = state.get("classified_prompt", user_input)
    
    # Get context from current operation if in multi-operation mode
    operations = state.get("operations", [])
    current_index = state.get("current_operation_index", 0)
    operation_context = {}
    if operations and current_index < len(operations):
        operation_context = operations[current_index].get("context", {})
    
    characters = scenario.get("characters", [])
    if not characters:
        # No characters to modify, fallback to generic response
        state["current_response"] = "There are no characters in this scenario to modify. Would you like to create a new character instead?"
        return state
    
    # Determine which character to modify
    target_character = None
    character_index = -1
    
    # First, check if context provides a specific character reference
    if operation_context.get("referenced_entity") and operation_context.get("reference_type") == "character":
        referenced_name = operation_context["referenced_entity"].lower()
        for i, char in enumerate(characters):
            char_name = char.get("name", "").lower()
            if char_name and referenced_name in char_name:
                target_character = char
                character_index = i
                break
    
    # If no context match, try to identify specific character from user input
    if target_character is None:
        user_lower = classified_prompt.lower()
        for i, char in enumerate(characters):
            char_name = char.get("name", "").lower()
            if char_name and char_name in user_lower:
                target_character = char
                character_index = i
                break
    
    # If no specific character identified, use the first one or ask for clarification
    if target_character is None:
        if len(characters) == 1:
            target_character = characters[0]
            character_index = 0
        else:
            # Multiple characters, ask for clarification
            char_names = [char.get("name", f"Character {i+1}") for i, char in enumerate(characters)]
            state["current_response"] = f"Which character would you like to modify? Available characters: {', '.join(char_names)}"
            return state
    
    try:
        state["streaming_response"] = [f"Modifying character '{target_character.get('name', 'Character')}'..."]
        
        # Build focused character modification prompt
        character_json = json.dumps(target_character, indent=2)
        
        prompt = f"""You are a character development specialist. Modify this character based on the user's request.

**CURRENT CHARACTER:**
```json
{character_json}
```

**MODIFICATION REQUEST:** "{classified_prompt}"

**INSTRUCTIONS:**
1. Modify ONLY the aspects mentioned in the user's request
2. Keep all other character properties unchanged
3. Ensure consistency with the character's existing traits
4. Return ONLY the modified character as valid JSON
5. Maintain the same JSON structure and property names

**REQUIRED CHARACTER STRUCTURE:**
```json
{{
  "id": "existing_id",
  "name": "Character Name",
  "backstory": "Character background",
  "personality": "Character traits",
  "appearance": "Physical description",
  "role": "Character's role"
}}
```

MODIFIED CHARACTER JSON:"""

        # Get LLM service for user
        llm_service, _, _ = LLMProxyService.get_llm_service_for_user(user_id)
        
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "model": "default",
            "temperature": 0.3
        }
        
        # Get character modification
        response = await llm_service.chat_completion(payload)
        
        # Parse the modified character
        response_clean = response.strip()
        if response_clean.startswith('```json'):
            response_clean = response_clean[7:]
        if response_clean.startswith('```'):
            response_clean = response_clean[3:]
        if response_clean.endswith('```'):
            response_clean = response_clean[:-3]
        response_clean = response_clean.strip()
        
        modified_character = json.loads(response_clean)
        
        # Ensure the character keeps its original ID and any missing properties
        if "id" not in modified_character and "id" in target_character:
            modified_character["id"] = target_character["id"]
        
        # Update the character in the scenario
        updated_scenario = scenario.copy()
        updated_characters = characters.copy()
        updated_characters[character_index] = modified_character
        updated_scenario["characters"] = updated_characters
        
        # Update state
        state["scenario"] = updated_scenario
        state["current_response"] = f"✅ Character '{modified_character.get('name', 'Character')}' has been successfully modified!"
        
        # Generate follow-up questions using LLM
        from agents.scenario_agent.utils.followup_generator import generate_followup_questions_for_state
        try:
            follow_up_questions = await generate_followup_questions_for_state(state)
            state["follow_up_questions"] = follow_up_questions
        except Exception as e:
            logger.warning(f"Failed to generate follow-up questions: {e}")
            # Fallback to default questions
            state["follow_up_questions"] = [
                f"Tell me more about {modified_character.get('name', 'this character')}",
                "How does this character interact with others?",
                "What motivates this character?"
            ]
        
        # Check if we should return to multi-operation handler
        if state.get("return_to_multi_operation", False):
            state["next_node"] = "advance_multi_operation"
        else:
            state["next_node"] = "supervisor"
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse character JSON: {str(e)}")
        state["current_response"] = "I had trouble understanding the character modification. Could you try rephrasing your request?"
        
    except Exception as e:
        logger.error(f"Failed to modify character: {str(e)}")
        state["current_response"] = f"I encountered an error while modifying the character: {str(e)}"
    
    return state