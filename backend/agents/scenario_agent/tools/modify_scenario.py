import json
import logging
from typing import Dict, Any, Optional
from domain.services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)

async def modify_scenario(parameters: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """Modify scenario based on user input and return updated scenario JSON"""
    user_input = parameters.get("user_input", "")
    scenario = parameters.get("scenario", {})
    
    # Create the modification prompt
    scenario_json = json.dumps(scenario, indent=2)
    
    prompt = f"""You are a professional story consultant and scenario modifier. Your task is to modify the given scenario based on the user's request and return a complete, valid JSON scenario.

**CURRENT SCENARIO:**
```json
{scenario_json}
```

**USER MODIFICATION REQUEST:** "{user_input}"

**INSTRUCTIONS:**
1. Carefully analyze the user's request to understand what changes they want
2. Modify the scenario appropriately while maintaining story coherence
3. If adding characters, give them proper names, backstories, personalities, and roles
4. If adding locations, provide detailed descriptions and significance
5. If changing plot elements, ensure they fit logically with existing elements
6. Maintain the same JSON structure as the input
7. Return ONLY the complete modified scenario as valid JSON
8. Do not include any explanatory text outside the JSON

**REQUIRED JSON STRUCTURE:**
```json
{{
  "title": "string",
  "synopsis": "string", 
  "backstory": "string",
  "storyarc": "string",
  "writingStyle": {{
    "genre": "string",
    "tone": "string"
  }},
  "characters": [
    {{
      "id": "string",
      "name": "string",
      "backstory": "string",
      "personality": "string",
      "appearance": "string",
      "role": "string"
    }}
  ],
  "locations": [
    {{
      "id": "string", 
      "name": "string",
      "description": "string",
      "atmosphere": "string",
      "significance": "string"
    }}
  ],
  "notes": "string"
}}
```

Return the complete modified scenario JSON:"""

    try:
        # Get LLM service for user
        llm_service, _, _ = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
        
        # Generate modified scenario using blocking LLM call
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "model": "default", 
            "temperature": 0.2  # Lower temperature for more consistent JSON generation
        }
        
        # Use blocking chat completion
        full_response = await llm_service.chat_completion(payload)
        
        # Try to parse the response as JSON
        try:
            # Clean up the response - remove any markdown formatting
            json_text = full_response.strip()
            if json_text.startswith('```json'):
                json_text = json_text[7:]
            if json_text.startswith('```'):
                json_text = json_text[3:]
            if json_text.endswith('```'):
                json_text = json_text[:-3]
            json_text = json_text.strip()
            
            updated_scenario = json.loads(json_text)
            
            # Generate a summary of changes made
            changes_summary = f"✅ **Scenario Updated Successfully!**\n\nI've modified your scenario based on: '{user_input}'\n\n"
            
            # Try to identify specific changes
            change_details = []
            if scenario.get("title") != updated_scenario.get("title"):
                change_details.append(f"📝 Updated title to '{updated_scenario.get('title')}'")
            if scenario.get("synopsis") != updated_scenario.get("synopsis"):
                change_details.append("📖 Updated synopsis")
            if len(updated_scenario.get("characters", [])) > len(scenario.get("characters", [])):
                new_chars = len(updated_scenario.get('characters', [])) - len(scenario.get('characters', []))
                change_details.append(f"👥 Added {new_chars} new character(s)")
            if len(updated_scenario.get("locations", [])) > len(scenario.get("locations", [])):
                new_locs = len(updated_scenario.get('locations', [])) - len(scenario.get('locations', []))
                change_details.append(f"🏞️ Added {new_locs} new location(s)")
            
            if change_details:
                changes_summary += "**Changes Made:**\n" + "\n".join([f"• {detail}" for detail in change_details])
            else:
                changes_summary += "**Changes Made:**\n• Updated scenario content based on your request"
            
            changes_summary += "\n\nThe scenario editor has been updated with your changes!"
            
            return {
                "status": "completed",
                "updated_scenario": updated_scenario,
                "changes_summary": changes_summary
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse modified scenario JSON: {str(e)}")
            return {"error": f"Failed to generate valid scenario JSON: {str(e)}", "status": "failed"}
            
    except Exception as e:
        logger.error(f"Failed to modify scenario: {str(e)}")
        return {"error": str(e), "status": "failed"}
