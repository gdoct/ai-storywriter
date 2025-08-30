import logging
from typing import Dict, Any, Optional
from services.llm_proxy_service import LLMProxyService

logger = logging.getLogger(__name__)

async def classify_input(parameters: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """Classify user input into detailed action categories with target and prompt extraction."""
    user_input = parameters.get("user_input", "")
    conversation_history = parameters.get("conversation_history", [])
    scenario = parameters.get("scenario", {})
    
    # Build conversation context for better classification
    context_info = ""
    if conversation_history and len(conversation_history) > 1:
        # Include last few exchanges for context
        recent_history = conversation_history[-6:]  # Last 3 exchanges (user + assistant pairs)
        history_text = []
        for msg in recent_history:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            if content and len(content) < 200:  # Don't include very long messages
                history_text.append(f"{role.title()}: {content}")
        
        if history_text:
            context_info = f"""
**CONVERSATION CONTEXT:**
{chr(10).join(history_text)}

**IMPORTANT:** Use the conversation context to resolve pronouns, references, and implicit requests. For example:
- If discussing "Donald Trump" previously, "add him to the story" means "add Donald Trump as a character"
- If talking about "a dark forest", "make it more mysterious" means "modify the dark forest location"
- Use the context to understand what "it", "him", "her", "that", "this" refer to
"""
    
    prompt = f"""Analyze this user input and classify it into detailed action structures. Use conversation context to resolve references and implicit requests. If multiple operations are requested, return an array of operations. Respond with ONLY valid JSON:
{context_info}

CLASSIFICATION CATEGORIES:
- "details": User wants explanations, clarifications, information, or summaries about existing scenario elements
- "modification": User wants to change, update, edit, or modify existing scenario elements
- "creation": User wants to create something entirely new for the scenario
- "general_conversation": Everything else (greetings, questions about the system, unrelated topics)

TARGET CATEGORIES (for details/modification/creation):
- "scenario": Overall scenario, plot, story structure, or multiple elements
- "character": Specific character(s), personality, backstory, appearance, or role
- "location": Places, settings, environments, or world-building elements
- "backstory": Background lore, history, world context, or setting details
- "storyarc": Plot progression, narrative structure, or story flow
- "writingStyle": Genre, tone, style, or narrative approach
- "notes": Additional notes, reminders, or miscellaneous information
- "general": When target is unclear or multiple elements are involved

SINGLE OPERATION EXAMPLES:
Input: "rewrite the backstory"
Output: {{"operations": [{{"action": "modification", "target": "backstory", "prompt": "rewrite the backstory", "context": {{}}}}]}}

Input: "create an evil character named Dr. Doom"
Output: {{"operations": [{{"action": "creation", "target": "character", "prompt": "create an evil character named Dr. Doom", "context": {{}}}}]}}

MULTIPLE OPERATION EXAMPLES:
Input: "add a dark wizard character and create a mysterious forest location"
Output: {{"operations": [
  {{"action": "creation", "target": "character", "prompt": "add a dark wizard character", "context": {{}}}},
  {{"action": "creation", "target": "location", "prompt": "create a mysterious forest location", "context": {{}}}}
]}}

CONTEXT-AWARE EXAMPLES:
Input: "add him to the story as a character" (after discussing "Donald Trump")
Output: {{"operations": [
  {{"action": "creation", "target": "character", "prompt": "add Donald Trump to the story as a character", "context": {{"referenced_entity": "Donald Trump", "reference_type": "person"}}}}
]}}

Input: "make it more mysterious" (after discussing "the old castle location")
Output: {{"operations": [
  {{"action": "modification", "target": "location", "prompt": "make the old castle location more mysterious", "context": {{"referenced_entity": "the old castle", "reference_type": "location"}}}}
]}}

Input: "change his backstory" (after discussing "the wizard character Gandalf")
Output: {{"operations": [
  {{"action": "modification", "target": "character", "prompt": "change Gandalf the wizard's backstory", "context": {{"referenced_entity": "Gandalf", "reference_type": "character"}}}}
]}}

Input: "create three characters: a knight, a thief, and a mage"
Output: {{"operations": [
  {{"action": "creation", "target": "character", "prompt": "create a knight character", "context": {{}}}},
  {{"action": "creation", "target": "character", "prompt": "create a thief character", "context": {{}}}},
  {{"action": "creation", "target": "character", "prompt": "create a mage character", "context": {{}}}}
]}}

USER INPUT: "{user_input}"

JSON CLASSIFICATION:"""
    
    try:
        # Get LLM service for user
        llm_service, _, _ = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)
        
        # Get classification using LLM
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "model": "default",
            "temperature": 0.1
        }
        
        # Use blocking chat completion
        full_response = await llm_service.chat_completion(payload)
        
        # Parse JSON response
        import json
        try:
            classification = json.loads(full_response.strip())
            
            # Validate required fields
            if not isinstance(classification, dict):
                raise ValueError("Response is not a JSON object")
            
            operations = classification.get("operations", [])
            if not operations:
                raise ValueError("No operations found in classification")
            
            # Validate operations array
            if not isinstance(operations, list):
                raise ValueError("Operations should be an array")
            
            valid_actions = {"details", "modification", "creation", "general_conversation"}
            valid_targets = {"scenario", "character", "location", "backstory", "storyarc", "writingStyle", "notes", "general"}
            
            # Process and validate each operation
            processed_operations = []
            for i, op in enumerate(operations):
                if not isinstance(op, dict):
                    continue
                
                action = op.get("action", "").lower()
                target = op.get("target", "").lower()
                prompt_text = op.get("prompt", f"Operation {i+1}")
                context = op.get("context", {})
                
                # Validate and fix action
                if action not in valid_actions:
                    # Try to infer from keywords in the operation prompt
                    op_lower = prompt_text.lower()
                    if any(word in op_lower for word in ["explain", "tell", "what", "describe", "clarify", "summary", "detail"]):
                        action = "details"
                    elif any(word in op_lower for word in ["modify", "change", "update", "edit", "rewrite", "alter"]):
                        action = "modification"
                    elif any(word in op_lower for word in ["create", "new", "make", "build", "add", "generate"]):
                        action = "creation"
                    else:
                        action = "general_conversation"
                
                # Validate and fix target
                if target not in valid_targets:
                    op_lower = prompt_text.lower()
                    if any(word in op_lower for word in ["character", "person", "protagonist", "antagonist", "hero", "villain"]):
                        target = "character"
                    elif any(word in op_lower for word in ["location", "place", "setting", "environment", "world", "city", "forest"]):
                        target = "location"
                    elif any(word in op_lower for word in ["backstory", "background", "history", "lore", "past", "origin"]):
                        target = "backstory"
                    elif any(word in op_lower for word in ["plot", "story", "arc", "progression", "narrative", "flow"]):
                        target = "storyarc"
                    elif any(word in op_lower for word in ["style", "genre", "tone", "mood", "voice", "writing"]):
                        target = "writingStyle"
                    elif any(word in op_lower for word in ["note", "reminder", "misc", "other"]):
                        target = "notes"
                    else:
                        target = "general"
                
                processed_operations.append({
                    "action": action,
                    "target": target,
                    "prompt": prompt_text,
                    "context": context
                })
            
            if not processed_operations:
                raise ValueError("No valid operations found")
            
            # For backward compatibility, use first operation as primary
            primary_op = processed_operations[0]
            
            return {
                "status": "completed",
                "action": primary_op["action"],
                "target": primary_op["target"], 
                "prompt": primary_op["prompt"],
                "operations": processed_operations,
                "is_multi_operation": len(processed_operations) > 1,
                "classification": {
                    "action": primary_op["action"],
                    "target": primary_op["target"],
                    "prompt": primary_op["prompt"],
                    "operations": processed_operations
                }
            }
            
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse JSON classification, falling back to keyword analysis: {full_response}")
            # Fallback to keyword-based classification
            user_lower = user_input.lower()
            
            # Determine action
            if any(word in user_lower for word in ["explain", "tell", "what", "describe", "clarify", "summary", "detail"]):
                action = "details"
            elif any(word in user_lower for word in ["modify", "change", "update", "edit", "rewrite", "alter"]):
                action = "modification"  
            elif any(word in user_lower for word in ["create", "new", "make", "build", "add", "generate"]):
                action = "creation"
            else:
                action = "general_conversation"
            
            # Determine target
            if any(word in user_lower for word in ["character", "person", "protagonist", "antagonist", "hero", "villain"]):
                target = "character"
            elif any(word in user_lower for word in ["location", "place", "setting", "environment", "world", "city", "forest"]):
                target = "location"
            elif any(word in user_lower for word in ["backstory", "background", "history", "lore", "past", "origin"]):
                target = "backstory"
            elif any(word in user_lower for word in ["plot", "story", "arc", "progression", "narrative", "flow"]):
                target = "storyarc"
            elif any(word in user_lower for word in ["style", "genre", "tone", "mood", "voice", "writing"]):
                target = "writingStyle"
            elif any(word in user_lower for word in ["note", "reminder", "misc", "other"]):
                target = "notes"
            else:
                target = "general"
                
            # Create single operation for fallback
            operation = {
                "action": action,
                "target": target,
                "prompt": user_input,
                "context": {}
            }
            
            return {
                "status": "completed", 
                "action": action,
                "target": target,
                "prompt": user_input,
                "operations": [operation],
                "is_multi_operation": False,
                "classification": {
                    "action": action,
                    "target": target,
                    "prompt": user_input,
                    "operations": [operation]
                }
            }
        
    except Exception as e:
        logger.error(f"Failed to classify input: {str(e)}")
        return {"error": str(e), "status": "failed"}
