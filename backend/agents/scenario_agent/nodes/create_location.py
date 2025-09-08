import json
import logging
from typing import Dict, Any
from ..state import AgentState
from domain.services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)


async def create_location_node(state: AgentState) -> Dict[str, Any]:
    """
    Specialized node for creating new locations using targeted prompts
    Adds locations to the existing scenario for faster, more precise results
    """
    user_input = state.get("user_input", "")
    scenario = state.get("scenario", {})
    user_id = state.get("user_id", "unknown")
    classified_prompt = state.get("classified_prompt", user_input)
    
    existing_locations = scenario.get("locations", [])
    
    # Get scenario context for location creation
    title = scenario.get("title", "")
    synopsis = scenario.get("synopsis", "")
    backstory = scenario.get("backstory", "")
    genre = scenario.get("writingStyle", {}).get("genre", "")
    tone = scenario.get("writingStyle", {}).get("tone", "")
    
    try:
        state["streaming_response"] = ["Creating new location..."]
        
        # Build context information
        context_info = ""
        if title:
            context_info += f"**Scenario Title:** {title}\n"
        if synopsis:
            context_info += f"**Synopsis:** {synopsis}\n"
        if genre:
            context_info += f"**Genre:** {genre}\n"
        if tone:
            context_info += f"**Tone:** {tone}\n"
        if backstory and len(backstory) < 200:
            context_info += f"**World Background:** {backstory}\n"
        
        # Include existing locations for context and avoid conflicts
        existing_names = []
        if existing_locations:
            existing_names = [loc.get("name", f"Location {i+1}") for i, loc in enumerate(existing_locations)]
            context_info += f"**Existing Locations:** {', '.join(existing_names)}\n"
        
        prompt = f"""You are a world-building specialist. Create a new location based on the user's request that fits well into this scenario.

{context_info}

**LOCATION CREATION REQUEST:** "{classified_prompt}"

**INSTRUCTIONS:**
1. Create a location that fits the scenario's genre, tone, and world
2. Ensure the location name doesn't conflict with existing locations
3. Make the location vivid and atmospheric
4. Consider how this location serves the story and characters
5. Return ONLY the new location as valid JSON
6. Do not include an ID field - it will be generated automatically

**REQUIRED LOCATION STRUCTURE:**
```json
{{
  "name": "Location Name",
  "description": "Detailed description of the location's appearance and features",
  "atmosphere": "The mood, feeling, and ambiance of the place",
  "significance": "Why this location is important to the story"
}}
```

NEW LOCATION JSON:"""

        # Get LLM service for user
        llm_service, _, _ = LLMProxyService.get_llm_service_for_user(user_id)
        
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "model": "default",
            "temperature": 0.6
        }
        
        # Get location creation
        response = await llm_service.chat_completion(payload)
        
        # Parse the new location
        response_clean = response.strip()
        if response_clean.startswith('```json'):
            response_clean = response_clean[7:]
        if response_clean.startswith('```'):
            response_clean = response_clean[3:]
        if response_clean.endswith('```'):
            response_clean = response_clean[:-3]
        response_clean = response_clean.strip()
        
        new_location = json.loads(response_clean)
        
        # Generate unique ID for the location
        location_count = len(existing_locations)
        new_location["id"] = f"loc_{user_id}_{location_count}"
        
        # Add the location to the scenario
        updated_scenario = scenario.copy()
        updated_locations = existing_locations.copy()
        updated_locations.append(new_location)
        updated_scenario["locations"] = updated_locations
        
        # Update state
        state["scenario"] = updated_scenario
        location_name = new_location.get("name", "New Location")
        state["current_response"] = f"✅ Location '{location_name}' has been successfully created and added to the scenario!"
        
        # Generate follow-up questions using LLM
        from agents.scenario_agent.utils.followup_generator import generate_followup_questions_for_state
        try:
            follow_up_questions = await generate_followup_questions_for_state(state)
            state["follow_up_questions"] = follow_up_questions
        except Exception as e:
            logger.warning(f"Failed to generate follow-up questions: {e}")
            # Fallback to default questions
            state["follow_up_questions"] = [
                f"What events might happen at {location_name}?",
                f"How do characters feel when they visit {location_name}?",
                f"What secrets might {location_name} hold?"
            ]
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse location JSON: {str(e)}")
        state["current_response"] = "I had trouble understanding the location creation. Could you try rephrasing your request?"
        
    except Exception as e:
        logger.error(f"Failed to create location: {str(e)}")
        state["current_response"] = f"I encountered an error while creating the location: {str(e)}"
    
    return state