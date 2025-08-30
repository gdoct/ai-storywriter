import json
import logging
from typing import Dict, Any, List, Optional
from ..state import AgentState
from services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)


async def modify_location_node(state: AgentState) -> Dict[str, Any]:
    """
    Specialized node for modifying location details using targeted prompts
    Works with individual location data for faster, more precise results
    """
    user_input = state.get("user_input", "")
    scenario = state.get("scenario", {})
    user_id = state.get("user_id", "unknown")
    classified_prompt = state.get("classified_prompt", user_input)
    
    locations = scenario.get("locations", [])
    if not locations:
        # No locations to modify, fallback to generic response
        state["current_response"] = "There are no locations in this scenario to modify. Would you like to create a new location instead?"
        return state
    
    # Determine which location to modify
    target_location = None
    location_index = -1
    
    # Try to identify specific location from user input
    user_lower = classified_prompt.lower()
    for i, loc in enumerate(locations):
        loc_name = loc.get("name", "").lower()
        if loc_name and loc_name in user_lower:
            target_location = loc
            location_index = i
            break
    
    # If no specific location identified, use the first one or ask for clarification
    if target_location is None:
        if len(locations) == 1:
            target_location = locations[0]
            location_index = 0
        else:
            # Multiple locations, ask for clarification
            loc_names = [loc.get("name", f"Location {i+1}") for i, loc in enumerate(locations)]
            state["current_response"] = f"Which location would you like to modify? Available locations: {', '.join(loc_names)}"
            return state
    
    try:
        state["streaming_response"] = [f"Modifying location '{target_location.get('name', 'Location')}'..."]
        
        # Build focused location modification prompt
        location_json = json.dumps(target_location, indent=2)
        
        prompt = f"""You are a world-building specialist. Modify this location based on the user's request.

**CURRENT LOCATION:**
```json
{location_json}
```

**MODIFICATION REQUEST:** "{classified_prompt}"

**INSTRUCTIONS:**
1. Modify ONLY the aspects mentioned in the user's request
2. Keep all other location properties unchanged
3. Ensure the location fits well within the story world
4. Return ONLY the modified location as valid JSON
5. Maintain the same JSON structure and property names

**REQUIRED LOCATION STRUCTURE:**
```json
{{
  "id": "existing_id",
  "name": "Location Name",
  "description": "Detailed location description",
  "atmosphere": "Mood and feeling of the place",
  "significance": "Importance to the story"
}}
```

MODIFIED LOCATION JSON:"""

        # Get LLM service for user
        llm_service, _, _ = LLMProxyService.get_llm_service_for_user(user_id)
        
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "model": "default",
            "temperature": 0.3
        }
        
        # Get location modification
        response = await llm_service.chat_completion(payload)
        
        # Parse the modified location
        response_clean = response.strip()
        if response_clean.startswith('```json'):
            response_clean = response_clean[7:]
        if response_clean.startswith('```'):
            response_clean = response_clean[3:]
        if response_clean.endswith('```'):
            response_clean = response_clean[:-3]
        response_clean = response_clean.strip()
        
        modified_location = json.loads(response_clean)
        
        # Ensure the location keeps its original ID and any missing properties
        if "id" not in modified_location and "id" in target_location:
            modified_location["id"] = target_location["id"]
        
        # Update the location in the scenario
        updated_scenario = scenario.copy()
        updated_locations = locations.copy()
        updated_locations[location_index] = modified_location
        updated_scenario["locations"] = updated_locations
        
        # Update state
        state["scenario"] = updated_scenario
        state["current_response"] = f"✅ Location '{modified_location.get('name', 'Location')}' has been successfully modified!"
        
        # Add follow-up questions
        state["follow_up_questions"] = [
            f"Describe the atmosphere of {modified_location.get('name', 'this location')}",
            "What events might happen at this location?",
            "How do characters interact with this environment?"
        ]
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse location JSON: {str(e)}")
        state["current_response"] = "I had trouble understanding the location modification. Could you try rephrasing your request?"
        
    except Exception as e:
        logger.error(f"Failed to modify location: {str(e)}")
        state["current_response"] = f"I encountered an error while modifying the location: {str(e)}"        
        # Check if we should return to multi-operation handler
        if state.get("return_to_multi_operation", False):
            state["next_node"] = "advance_multi_operation"
        else:
            state["next_node"] = "supervisor"
        

    
    return state