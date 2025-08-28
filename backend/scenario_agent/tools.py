"""
Tool execution logic for the scenario agent
"""
import json
import logging
from typing import Dict, Any, Optional
from services.llm_proxy_service import LLMProxyService
from data.repositories import ScenarioRepository

logger = logging.getLogger(__name__)


class ScenarioAgentTools:
    """Tools for executing scenario operations"""
    
    @staticmethod
    async def execute_tool(tool_call: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Execute a tool call and return the result
        """
        action = tool_call.get("action")
        parameters = tool_call.get("parameters", {})
        
        try:
            if action == "classify_input":
                return await ScenarioAgentTools._classify_input(parameters, user_id, byok_headers)
            elif action == "update_scenario":
                return await ScenarioAgentTools._update_scenario(parameters, user_id, byok_headers)
            elif action == "generate_character":
                return await ScenarioAgentTools._generate_character(parameters, user_id, byok_headers)
            elif action == "generate_location":
                return await ScenarioAgentTools._generate_location(parameters, user_id, byok_headers)
            elif action == "rewrite_scenario":
                return await ScenarioAgentTools._rewrite_scenario(parameters, user_id, byok_headers)
            elif action == "create_scenario":
                return await ScenarioAgentTools._create_scenario(parameters, user_id, byok_headers)
            elif action == "generic_chat":
                return await ScenarioAgentTools._generic_chat(parameters, user_id, byok_headers)
            elif action == "explain_scenario":
                return await ScenarioAgentTools._explain_scenario(parameters, user_id, byok_headers)
            elif action == "modify_scenario":
                return await ScenarioAgentTools._modify_scenario(parameters, user_id, byok_headers)
            else:
                return {"error": f"Unknown action: {action}", "status": "failed"}
                
        except Exception as e:
            logger.error(f"Tool execution failed for action {action}: {str(e)}")
            return {"error": str(e), "status": "failed"}
    
    @staticmethod
    async def _update_scenario(parameters: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
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
            llm_service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
            
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
    
    @staticmethod
    async def _generate_character(parameters: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Generate a new character based on user input"""
        user_input = parameters.get("user_input", "")
        scenario = parameters.get("scenario", {})
        
        prompt = f"""
        Create a new character for this scenario based on the user's request: "{user_input}"
        
        Current scenario context: {json.dumps(scenario, indent=2)}
        
        Generate a character that fits the scenario's genre, setting, and style.
        
        Response format (JSON):
        {{
            "name": "Character Name",
            "backstory": "Character background and history",
            "personality": "Character personality traits",
            "appearance": "Physical description",
            "role": "Character's role in the story"
        }}
        """
        
        try:
            # Get LLM service for user
            llm_service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
            
            # Generate character using LLM
            response = await llm_service.chat_completion({
                "messages": [{"role": "user", "content": prompt}],
                "model": "default",
                "temperature": 0.8
            })
            
            # Parse the character data
            character_data = json.loads(response.strip())
            
            # Add unique ID for the character
            character_data["id"] = f"char_{user_id}_{len(scenario.get('characters', []))}"
            
            return {
                "status": "completed",
                "character": character_data
            }
            
        except Exception as e:
            logger.error(f"Failed to generate character: {str(e)}")
            return {"error": str(e), "status": "failed"}
    
    @staticmethod
    async def _classify_input(parameters: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
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
            llm_service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
            
            # Get classification using LLM (streaming method)
            payload = {
                "messages": [{"role": "user", "content": prompt}],
                "model": "default",
                "temperature": 0.0
            }
            
            # Use blocking chat completion
            full_response = llm_service.chat_completion(payload)
            category = full_response.strip().lower()
            
            # modification, details, creation, or general conversation
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

    @staticmethod
    async def _generate_location(parameters: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Generate a new location based on user input"""
        user_input = parameters.get("user_input", "")
        scenario = parameters.get("scenario", {})
        
        prompt = f"""
        Create a new location for this scenario based on the user's request: "{user_input}"
        
        Current scenario context: {json.dumps(scenario, indent=2)}
        
        Generate a location that fits the scenario's genre, setting, and style.
        
        Response format (JSON):
        {{
            "name": "Location Name",
            "description": "Detailed description of the location",
            "atmosphere": "The mood and feeling of this place",
            "significance": "Why this location is important to the story"
        }}
        """
        
        try:
            # Get LLM service for user
            llm_service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
            
            # Generate location using LLM
            response = await llm_service.chat_completion({
                "messages": [{"role": "user", "content": prompt}],
                "model": "default",
                "temperature": 0.8
            })
            
            # Parse the location data
            location_data = json.loads(response.strip())
            
            # Add unique ID for the location
            location_data["id"] = f"loc_{user_id}_{len(scenario.get('locations', []))}"
            
            return {
                "status": "completed",
                "location": location_data
            }
            
        except Exception as e:
            logger.error(f"Failed to generate location: {str(e)}")
            return {"error": str(e), "status": "failed"}
    
    @staticmethod 
    async def _rewrite_scenario(parameters: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
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
            llm_service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
            
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
    
    @staticmethod
    async def _create_scenario(parameters: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
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
            llm_service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
            
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
    
    @staticmethod
    async def _generic_chat(parameters: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
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
            llm_service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
            
            # Generate response using blocking LLM call
            payload = {
                "messages": [{"role": "user", "content": prompt}],
                "model": "default",
                "temperature": 0.7
            }
            
            # Use blocking chat completion
            response = llm_service.chat_completion(payload)
            
            return {
                "status": "completed",
                "response": response.strip()
            }
            
        except Exception as e:
            logger.error(f"Failed to generate chat response: {str(e)}")
            return {"error": str(e), "status": "failed"}
    
    @staticmethod
    async def _explain_scenario(parameters: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Explain scenario details and answer user questions as an expert story analyst"""
        user_input = parameters.get("user_input", "")
        scenario = parameters.get("scenario", {})
        
        # Build comprehensive scenario context
        scenario_details = []
        if scenario.get("title"):
            scenario_details.append(f"**Title:** {scenario['title']}")
        if scenario.get("synopsis"):
            scenario_details.append(f"**Synopsis:** {scenario['synopsis']}")
        if scenario.get("backstory"):
            scenario_details.append(f"**Backstory:** {scenario['backstory']}")
        if scenario.get("storyarc"):
            scenario_details.append(f"**Story Arc:** {scenario['storyarc']}")
        if scenario.get("writingStyle"):
            style = scenario["writingStyle"]
            if isinstance(style, dict):
                genre = style.get("genre", "")
                tone = style.get("tone", "")
                style_text = f"Genre: {genre}, Tone: {tone}" if genre or tone else ""
                if style_text:
                    scenario_details.append(f"**Writing Style:** {style_text}")
        
        # Add characters if present
        if scenario.get("characters"):
            chars = scenario["characters"]
            if isinstance(chars, list) and chars:
                char_summaries = []
                for char in chars[:5]:  # Limit to first 5 characters
                    if isinstance(char, dict):
                        name = char.get("name", "Unnamed")
                        role = char.get("role", "")
                        personality = char.get("personality", "")
                        char_info = f"{name}"
                        if role:
                            char_info += f" ({role})"
                        if personality:
                            char_info += f" - {personality[:100]}..."
                        char_summaries.append(char_info)
                if char_summaries:
                    scenario_details.append(f"**Characters:** {'; '.join(char_summaries)}")
        
        # Add locations if present
        if scenario.get("locations"):
            locs = scenario["locations"]
            if isinstance(locs, list) and locs:
                loc_summaries = []
                for loc in locs[:3]:  # Limit to first 3 locations
                    if isinstance(loc, dict):
                        name = loc.get("name", "Unnamed")
                        desc = loc.get("description", "")
                        loc_info = name
                        if desc:
                            loc_info += f" - {desc[:80]}..."
                        loc_summaries.append(loc_info)
                if loc_summaries:
                    scenario_details.append(f"**Locations:** {'; '.join(loc_summaries)}")
        
        scenario_context = "\n".join(scenario_details) if scenario_details else "No scenario details available."
        
        prompt = f"""You are an expert story analyst and scenario consultant. You have deep expertise in storytelling, character development, plot structure, and narrative techniques.

**SCENARIO DETAILS:**
{scenario_context}

**USER QUESTION:** "{user_input}"

Please provide a detailed, insightful explanation that addresses the user's question about this scenario. Use your expertise to:

- Analyze the story elements thoroughly
- Explain how different components work together
- Identify strengths, potential issues, or opportunities
- Provide specific examples from the scenario
- Offer constructive insights and suggestions when relevant
- Be comprehensive yet clear and engaging

Focus specifically on what the user is asking about, but feel free to connect it to other relevant aspects of the scenario."""

        try:
            # Get LLM service for user
            llm_service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
            
            # Generate explanation using blocking LLM call
            payload = {
                "messages": [{"role": "user", "content": prompt}],
                "model": "default",
                "temperature": 0.3  # Lower temperature for more focused, analytical responses
            }
            
            # Use blocking chat completion
            response = llm_service.chat_completion(payload)
            
            return {
                "status": "completed",
                "response": response.strip()
            }
            
        except Exception as e:
            logger.error(f"Failed to explain scenario: {str(e)}")
            return {"error": str(e), "status": "failed"}
    
    @staticmethod
    async def _modify_scenario(parameters: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
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
            llm_service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
            
            # Generate modified scenario using blocking LLM call
            payload = {
                "messages": [{"role": "user", "content": prompt}],
                "model": "default", 
                "temperature": 0.2  # Lower temperature for more consistent JSON generation
            }
            
            # Use blocking chat completion
            full_response = llm_service.chat_completion(payload)
            
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