import logging
from typing import Dict, Any, Optional
from domain.services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)

async def explain_scenario(parameters: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
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
        llm_service, _, _ = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
        
        # Generate explanation using blocking LLM call
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "model": "default",
            "temperature": 0.3  # Lower temperature for more focused, analytical responses
        }
        
        # Use blocking chat completion
        response = await llm_service.chat_completion(payload)
        
        return {
            "status": "completed",
            "response": response.strip()
        }
        
    except Exception as e:
        logger.error(f"Failed to explain scenario: {str(e)}")
        return {"error": str(e), "status": "failed"}
