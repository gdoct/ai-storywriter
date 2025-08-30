"""
Streaming-first tools for scenario agent that provide true real-time LLM responses
"""
import json
import logging
from typing import Dict, Any, Optional, AsyncGenerator
from services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)


class StreamingScenarioTools:
    """Streaming tools that provide real-time LLM responses without buffering"""
    
    @staticmethod
    async def stream_tool_response(
        tool_call: Dict[str, Any], 
        user_id: str, 
        byok_headers: Optional[Dict[str, str]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream tool responses in real-time without buffering
        Returns streaming messages in consistent format
        """
        action = tool_call.get("action")
        parameters = tool_call.get("parameters", {})
        
        try:
            # Get LLM service for user
            llm_service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
            
            # Build prompt and payload based on action
            if action == "explain_scenario":
                prompt = StreamingScenarioTools._build_explain_prompt(parameters)
                temperature = 0.3
            elif action == "generic_chat":
                prompt = StreamingScenarioTools._build_chat_prompt(parameters)
                temperature = 0.7
            elif action == "modify_scenario":
                prompt = StreamingScenarioTools._build_modify_prompt(parameters)
                temperature = 0.2
            elif action == "create_scenario":
                prompt = StreamingScenarioTools._build_create_prompt(parameters)
                temperature = 0.8
            else:
                yield {
                    "type": "error",
                    "content": f"Unsupported streaming action: {action}",
                    "streaming": False
                }
                return
            
            payload = {
                "messages": [{"role": "user", "content": prompt}],
                "model": "default",
                "temperature": temperature
            }
            
            # Start streaming status
            yield {
                "type": "status", 
                "content": f"Starting {action}...",
                "streaming": True,
                "action": action
            }
            
            # Direct streaming with minimal processing - just like the working chat endpoint
            accumulated_response = ""
            
            for chunk in llm_service.chat_completion_stream(payload):
                if chunk:
                    # Convert chunk to string
                    chunk_str = chunk.decode('utf-8') if isinstance(chunk, bytes) else chunk
                    
                    # Look for SSE data lines and extract content immediately
                    if 'data: {' in chunk_str:
                        # Quick extraction without full line processing
                        lines = chunk_str.split('\n')
                        for line in lines:
                            if line.startswith('data: '):
                                data_part = line[6:]
                                if data_part.strip() and data_part.strip() != '[DONE]':
                                    try:
                                        chunk_data = json.loads(data_part)
                                        if 'choices' in chunk_data and len(chunk_data['choices']) > 0:
                                            delta = chunk_data['choices'][0].get('delta', {})
                                            content = delta.get('content', '')
                                            if content:
                                                accumulated_response += content
                                                # Yield immediately - no buffering
                                                yield {
                                                    "type": "chat",
                                                    "content": content,
                                                    "streaming": True,
                                                    "action": action
                                                }
                                    except (json.JSONDecodeError, KeyError):
                                        continue
            
            # Post-process based on action type
            if action == "modify_scenario":
                # Try to parse the accumulated response as JSON for scenario updates
                try:
                    # Clean JSON response
                    json_text = accumulated_response.strip()
                    if json_text.startswith('```json'):
                        json_text = json_text[7:]
                    if json_text.startswith('```'):
                        json_text = json_text[3:]
                    if json_text.endswith('```'):
                        json_text = json_text[:-3]
                    json_text = json_text.strip()
                    
                    updated_scenario = json.loads(json_text)
                    
                    # Yield tool completion with updated scenario
                    yield {
                        "type": "tool_result",
                        "action": action,
                        "updated_scenario": updated_scenario,
                        "streaming": False
                    }
                    
                except json.JSONDecodeError:
                    yield {
                        "type": "error",
                        "content": "Failed to parse scenario JSON from LLM response",
                        "streaming": False,
                        "action": action
                    }
                    
            elif action == "create_scenario":
                # Similar JSON parsing for scenario creation
                try:
                    json_text = accumulated_response.strip()
                    if json_text.startswith('```json'):
                        json_text = json_text[7:]
                    if json_text.startswith('```'):
                        json_text = json_text[3:]
                    if json_text.endswith('```'):
                        json_text = json_text[:-3]
                    json_text = json_text.strip()
                    
                    scenario_data = json.loads(json_text)
                    
                    # Add IDs to characters and locations
                    for i, char in enumerate(scenario_data.get("characters", [])):
                        char["id"] = f"char_{user_id}_{i}"
                    for i, loc in enumerate(scenario_data.get("locations", [])):
                        loc["id"] = f"loc_{user_id}_{i}"
                    
                    yield {
                        "type": "tool_result",
                        "action": action,
                        "scenario": scenario_data,
                        "streaming": False
                    }
                    
                except json.JSONDecodeError:
                    yield {
                        "type": "error",
                        "content": "Failed to parse scenario JSON from LLM response", 
                        "streaming": False,
                        "action": action
                    }
            else:
                # For chat and explain, just signal completion
                yield {
                    "type": "completion",
                    "action": action,
                    "full_response": accumulated_response,
                    "streaming": False
                }
                
        except Exception as e:
            logger.error(f"Streaming tool error for {action}: {str(e)}")
            yield {
                "type": "error",
                "content": str(e),
                "streaming": False,
                "action": action
            }
    
    @staticmethod
    def _build_explain_prompt(parameters: Dict[str, Any]) -> str:
        """Build prompt for explain_scenario tool with enhanced targeting"""
        user_input = parameters.get("user_input", "")
        scenario = parameters.get("scenario", {})
        target = parameters.get("target", "general")
        focus = parameters.get("focus", "")
        
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
                for char in chars[:5]:
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
                for loc in locs[:3]:
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
        
        # Add target-specific focus guidance
        focus_guidance = ""
        if target == "character":
            focus_guidance = "\n\n**PRIMARY FOCUS:** Character analysis - personality, development, motivations, relationships, and role in the story."
        elif target == "location":
            focus_guidance = "\n\n**PRIMARY FOCUS:** Location analysis - atmosphere, significance, world-building, and impact on the narrative."
        elif target == "backstory":
            focus_guidance = "\n\n**PRIMARY FOCUS:** Background and lore analysis - world history, context, and foundational elements."
        elif target == "storyarc":
            focus_guidance = "\n\n**PRIMARY FOCUS:** Plot and structure analysis - narrative progression, pacing, conflicts, and story flow."
        elif target == "writingStyle":
            focus_guidance = "\n\n**PRIMARY FOCUS:** Style and tone analysis - genre conventions, narrative voice, and stylistic elements."
        
        return f"""You are an expert story analyst and scenario consultant specializing in {target} analysis. You have deep expertise in storytelling, character development, plot structure, and narrative techniques.

**SCENARIO DETAILS:**
{scenario_context}

**USER QUESTION:** "{user_input}"
**ANALYSIS TARGET:** {target}{focus_guidance}

Please provide a detailed, insightful explanation that addresses the user's question about this scenario. Use your expertise to:

- Analyze the {target} elements thoroughly with special attention
- Explain how the {target} components work with other story elements  
- Identify strengths, potential issues, or opportunities in the {target} area
- Provide specific examples from the scenario
- Offer constructive insights and suggestions when relevant
- Be comprehensive yet clear and engaging

Focus primarily on the {target} aspects while connecting to other relevant scenario elements when helpful."""

    @staticmethod
    def _build_chat_prompt(parameters: Dict[str, Any]) -> str:
        """Build prompt for generic_chat tool with enhanced targeting"""
        user_input = parameters.get("user_input", "")
        scenario = parameters.get("scenario", {})
        context = parameters.get("context", "You are a helpful assistant.")
        target = parameters.get("target", "general")
        
        # Build conversational prompt with scenario context
        if scenario:
            scenario_context = f"\nCurrent scenario context:\nTitle: {scenario.get('title', 'Untitled')}\nSynopsis: {scenario.get('synopsis', 'No synopsis')}"
        else:
            scenario_context = "\nNo current scenario is loaded."
        
        # Add target-specific context if not general
        target_context = ""
        if target != "general":
            target_context = f"\nConversation focus: {target} elements"
        
        return f"""
{context}{target_context}

{scenario_context}

User message: "{user_input}"

Please respond naturally and helpfully. If the user wants to work with scenarios, guide them appropriately with attention to {target} aspects. If they're just chatting, engage naturally while staying in your role as a scenario assistant.
"""

    @staticmethod
    def _build_modify_prompt(parameters: Dict[str, Any]) -> str:
        """Build prompt for modify_scenario tool with enhanced targeting"""
        user_input = parameters.get("user_input", "")
        scenario = parameters.get("scenario", {})
        target = parameters.get("target", "general")
        focus = parameters.get("focus", "")
        
        scenario_json = json.dumps(scenario, indent=2)
        
        # Add target-specific guidance
        target_guidance = ""
        if target == "character":
            target_guidance = "\n\n**FOCUS:** Pay special attention to character-related modifications. Ensure character changes maintain consistency with their established personality and role in the story."
        elif target == "location":
            target_guidance = "\n\n**FOCUS:** Pay special attention to location-related modifications. Ensure location changes enhance the story's atmosphere and are logically integrated."
        elif target == "backstory":
            target_guidance = "\n\n**FOCUS:** Pay special attention to backstory modifications. Ensure changes to the world history and background are consistent and enhance the overall narrative."
        elif target == "storyarc":
            target_guidance = "\n\n**FOCUS:** Pay special attention to story progression modifications. Ensure plot changes maintain narrative coherence and logical flow."
        elif target == "writingStyle":
            target_guidance = "\n\n**FOCUS:** Pay special attention to writing style modifications. Ensure genre and tone changes are consistent throughout all scenario elements."
        
        return f"""You are a professional story consultant and scenario modifier. Your task is to modify the given scenario based on the user's request and return a complete, valid JSON scenario.

**CURRENT SCENARIO:**
```json
{scenario_json}
```

**USER MODIFICATION REQUEST:** "{user_input}"
**TARGET AREA:** {target}{target_guidance}

**INSTRUCTIONS:**
1. Carefully analyze the user's request to understand what changes they want
2. Focus primarily on the {target} aspects while maintaining overall story coherence
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

    @staticmethod  
    def _build_create_prompt(parameters: Dict[str, Any]) -> str:
        """Build prompt for create_scenario tool with enhanced targeting"""
        user_input = parameters.get("user_input", "")
        creation_info = parameters.get("creation_info", {})
        target = parameters.get("target", "scenario")
        
        # Customize prompt based on target
        if target == "character":
            return f"""
Create a new character based on the user's request: "{user_input}"

This character will be added to an existing scenario. Focus on creating a well-developed character with:

Response format (JSON):
{{
    "title": "Existing Scenario Title (keep current)",
    "synopsis": "Existing synopsis (keep current)", 
    "writingStyle": {{
        "genre": "existing genre",
        "tone": "existing tone"
    }},
    "characters": [
        {{
            "name": "New Character Name",
            "backstory": "Detailed character background",
            "personality": "Character traits and motivations",
            "appearance": "Physical description",
            "role": "Character's role in the story"
        }}
    ],
    "locations": [],
    "backstory": "Existing backstory (keep current)",
    "storyarc": "Existing story arc (keep current)",
    "notes": "Added new character as requested"
}}
"""
        elif target == "location":
            return f"""
Create a new location based on the user's request: "{user_input}"

This location will be added to an existing scenario. Focus on creating a vivid, atmospheric location with:

Response format (JSON):
{{
    "title": "Existing Scenario Title (keep current)",
    "synopsis": "Existing synopsis (keep current)", 
    "writingStyle": {{
        "genre": "existing genre",
        "tone": "existing tone"
    }},
    "characters": [],
    "locations": [
        {{
            "name": "New Location Name",
            "description": "Detailed location description",
            "atmosphere": "Mood and feeling of the place",
            "significance": "Importance to the story"
        }}
    ],
    "backstory": "Existing backstory (keep current)",
    "storyarc": "Existing story arc (keep current)",
    "notes": "Added new location as requested"
}}
"""
        else:
            # Default full scenario creation
            focus_hint = ""
            if creation_info.get("focus") == "character_creation":
                focus_hint = "\n\nPay special attention to creating compelling, well-developed characters."
            elif creation_info.get("focus") == "location_creation":
                focus_hint = "\n\nPay special attention to creating vivid, atmospheric locations."
                
            return f"""
Create a complete new scenario based on the user's request: "{user_input}"

Creation context: {json.dumps(creation_info, indent=2)}{focus_hint}

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
            "appearance": "Physical description",
            "role": "Character's role"
        }}
    ],
    "locations": [
        {{
            "name": "Location Name",
            "description": "Location description",
            "atmosphere": "Mood and feeling",
            "significance": "Story importance"
        }}
    ],
    "backstory": "World/setting background",
    "storyarc": "Main story progression",
    "notes": "Additional notes"
}}
"""