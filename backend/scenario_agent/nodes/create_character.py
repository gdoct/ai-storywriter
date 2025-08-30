import json
import logging
from typing import Dict, Any
from ..state import AgentState
from services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)


async def create_character_node(state: AgentState) -> Dict[str, Any]:
    """
    Specialized node for creating new characters using targeted prompts
    Adds characters to the existing scenario for faster, more precise results
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
    
    existing_characters = scenario.get("characters", [])
    
    # Get scenario context for character creation
    title = scenario.get("title", "")
    synopsis = scenario.get("synopsis", "")
    backstory = scenario.get("backstory", "")
    genre = scenario.get("writingStyle", {}).get("genre", "")
    
    try:
        state["streaming_response"] = ["Creating new character..."]
        
        # Build context information
        context_info = ""
        if title:
            context_info += f"**Scenario Title:** {title}\n"
        if synopsis:
            context_info += f"**Synopsis:** {synopsis}\n"
        if genre:
            context_info += f"**Genre:** {genre}\n"
        if backstory and len(backstory) < 200:
            context_info += f"**World Background:** {backstory}\n"
        
        # Include existing characters for context and avoid conflicts
        existing_names = []
        if existing_characters:
            existing_names = [char.get("name", f"Character {i+1}") for i, char in enumerate(existing_characters)]
            context_info += f"**Existing Characters:** {', '.join(existing_names)}\n"
        
        # Add conversation context if available
        if operation_context.get("referenced_entity") and operation_context.get("reference_type") == "person":
            context_info += f"**Referenced Person:** {operation_context['referenced_entity']}\n"
            context_info += f"Note: The user wants to add {operation_context['referenced_entity']} as a character in this scenario.\n"
        
        prompt = f"""You are a character creation specialist. Create a new character based on the user's request that fits well into this scenario.

{context_info}

**CHARACTER CREATION REQUEST:** "{classified_prompt}"

**INSTRUCTIONS:**
1. Create a character that fits the scenario's genre, tone, and world
2. Ensure the character name doesn't conflict with existing characters
3. Make the character compelling and well-developed
4. Consider how this character relates to the existing story elements
5. Return ONLY the new character as valid JSON
6. Do not include an ID field - it will be generated automatically

**REQUIRED CHARACTER STRUCTURE:**
```json
{{
  "name": "Character Name",
  "backstory": "Detailed character background and history",
  "personality": "Character traits, motivations, and quirks",
  "appearance": "Physical description and notable features",
  "role": "Character's role or function in the story"
}}
```

NEW CHARACTER JSON:"""

        # Get LLM service for user
        llm_service, _, _ = LLMProxyService.get_llm_service_for_user(user_id)
        
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "model": "default",
            "temperature": 0.6
        }
        
        # Get character creation
        response = await llm_service.chat_completion(payload)
        
        # Parse the new character
        response_clean = response.strip()
        if response_clean.startswith('```json'):
            response_clean = response_clean[7:]
        if response_clean.startswith('```'):
            response_clean = response_clean[3:]
        if response_clean.endswith('```'):
            response_clean = response_clean[:-3]
        response_clean = response_clean.strip()
        
        new_character = json.loads(response_clean)
        
        # Generate unique ID for the character
        character_count = len(existing_characters)
        new_character["id"] = f"char_{user_id}_{character_count}"
        
        # Add the character to the scenario
        updated_scenario = scenario.copy()
        updated_characters = existing_characters.copy()
        updated_characters.append(new_character)
        updated_scenario["characters"] = updated_characters
        
        # Update state
        state["scenario"] = updated_scenario
        character_name = new_character.get("name", "New Character")
        state["current_response"] = f"✅ Character '{character_name}' has been successfully created and added to the scenario!"
        
        # Generate follow-up questions using LLM
        from scenario_agent.utils.followup_generator import generate_followup_questions_for_state
        try:
            follow_up_questions = await generate_followup_questions_for_state(state)
            state["follow_up_questions"] = follow_up_questions
        except Exception as e:
            logger.warning(f"Failed to generate follow-up questions: {e}")
            # Fallback to default questions
            state["follow_up_questions"] = [
                f"Tell me more about {character_name}'s motivations",
                f"How does {character_name} interact with other characters?",
                f"What role will {character_name} play in the story?"
            ]
        
        # Check if we should return to multi-operation handler
        if state.get("return_to_multi_operation", False):
            state["next_node"] = "advance_multi_operation"
        else:
            state["next_node"] = "supervisor"
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse character JSON: {str(e)}")
        state["current_response"] = "I had trouble understanding the character creation. Could you try rephrasing your request?"
        
    except Exception as e:
        logger.error(f"Failed to create character: {str(e)}")
        state["current_response"] = f"I encountered an error while creating the character: {str(e)}"
    
    return state