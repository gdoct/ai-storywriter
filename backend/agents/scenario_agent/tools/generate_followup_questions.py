import logging
from typing import Dict, Any, Optional, List
from domain.services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)

async def generate_followup_questions(parameters: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """Generate three follow-up questions based on the current prompt and classification."""
    user_input = parameters.get("user_input", "")
    scenario = parameters.get("scenario", {})
    action = parameters.get("action", "general_conversation")
    target = parameters.get("target", "general")
    classified_prompt = parameters.get("classified_prompt", user_input)
    
    # Build scenario context
    scenario_context = ""
    if scenario:
        if scenario.get("title"):
            scenario_context += f"Scenario: {scenario['title']}\n"
        if scenario.get("synopsis"):
            scenario_context += f"Synopsis: {scenario['synopsis']}\n"
        if scenario.get("characters"):
            char_names = [char.get("name", "Unnamed") for char in scenario.get("characters", [])]
            scenario_context += f"Characters: {', '.join(char_names)}\n"
        if scenario.get("locations"):
            loc_names = [loc.get("name", "Unnamed") for loc in scenario.get("locations", [])]
            scenario_context += f"Locations: {', '.join(loc_names)}\n"
    
    # Create prompt based on action and target
    prompt = f"""You are a storytelling assistant generating follow-up questions to help users explore their scenario further.

**CURRENT SCENARIO:**
{scenario_context if scenario_context else "No scenario loaded yet."}

**USER'S RECENT ACTION:**
- Type: {action.replace('_', ' ').title()}
- Target: {target.title()}
- Request: "{classified_prompt}"

**INSTRUCTIONS:**
Generate exactly 3 engaging follow-up questions that:
1. Build on what the user just did
2. Explore related aspects of their scenario
3. Encourage deeper storytelling and creativity
4. Are specific and actionable
5. Vary in scope (immediate, broader, creative)

**GUIDELINES BY ACTION TYPE:**
- **Creation**: Ask about relationships, motivations, or expanding on what was created
- **Modification**: Ask about impact, consequences, or related elements to modify
- **Details**: Ask about unexplored aspects, deeper meaning, or connections
- **General**: Ask about scenario development, character arcs, or world-building

**FORMAT:** Return ONLY a JSON array of exactly 3 questions, no other text:
["Question 1", "Question 2", "Question 3"]

**EXAMPLES:**
For character creation: ["How does this character connect with existing ones?", "What drives this character's main goals?", "What secrets might this character be hiding?"]
For location modification: ["How do other characters react to this change?", "What new stories could happen here now?", "What was this place like before the change?"]

FOLLOW-UP QUESTIONS:"""

    try:
        # Get LLM service for user
        llm_service, _, _ = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
        
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "model": "default",
            "temperature": 0.7
        }
        
        # Get follow-up questions from LLM
        response = await llm_service.chat_completion(payload)
        
        # Parse JSON response
        import json
        try:
            response_clean = response.strip()
            if response_clean.startswith('```json'):
                response_clean = response_clean[7:]
            if response_clean.startswith('```'):
                response_clean = response_clean[3:]
            if response_clean.endswith('```'):
                response_clean = response_clean[:-3]
            response_clean = response_clean.strip()
            
            questions = json.loads(response_clean)
            
            # Validate that we got a list of questions
            if not isinstance(questions, list):
                raise ValueError("Response is not a list")
            
            if len(questions) != 3:
                logger.warning(f"Expected 3 questions, got {len(questions)}")
                # Pad or trim to exactly 3 questions
                if len(questions) < 3:
                    questions.extend(["What else would you like to explore?"] * (3 - len(questions)))
                else:
                    questions = questions[:3]
            
            # Ensure all questions are strings
            questions = [str(q).strip() for q in questions if q and str(q).strip()]
            
            return {
                "status": "completed",
                "follow_up_questions": questions
            }
            
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse follow-up questions JSON: {response[:100]}...")
            # Fallback to generic questions based on action/target
            return _generate_fallback_questions(action, target, scenario)
        
    except Exception as e:
        logger.error(f"Failed to generate follow-up questions: {str(e)}")
        return _generate_fallback_questions(action, target, scenario)


def _generate_fallback_questions(action: str, target: str, scenario: Dict[str, Any]) -> Dict[str, Any]:
    """Generate fallback questions when LLM generation fails."""
    questions = []
    
    # Base questions by action type
    if action == "creation":
        if target == "character":
            questions = [
                "What motivates this new character?",
                "How do they interact with existing characters?",
                "What role will they play in the story?"
            ]
        elif target == "location":
            questions = [
                "What important events might happen here?",
                "Who frequents this location?",
                "What secrets does this place hold?"
            ]
        else:
            questions = [
                "What else would you like to add?",
                "How does this fit into the bigger picture?",
                "What should happen next?"
            ]
    elif action == "modification":
        questions = [
            "How does this change affect other elements?",
            "What are the consequences of this modification?",
            "What else might need to be updated?"
        ]
    elif action == "details":
        questions = [
            "What other aspects would you like to explore?",
            "How does this connect to the broader story?",
            "What questions does this raise?"
        ]
    else:
        # General conversation
        if scenario.get("characters"):
            questions.append("Tell me about the main character")
        else:
            questions.append("Create some characters for this scenario")
            
        if scenario.get("locations"):
            questions.append("Describe an important location")
        else:
            questions.append("Add some locations to the scenario")
            
        questions.append("What should happen in this story?")
    
    # Ensure we have exactly 3 questions
    while len(questions) < 3:
        questions.append("What would you like to explore next?")
    
    return {
        "status": "completed",
        "follow_up_questions": questions[:3]
    }