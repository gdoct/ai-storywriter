import asyncio
import logging
from typing import Dict, Any, List
from domain.services.llm_proxy_service import LLMProxyService
from infrastructure.database.user_preferences_repository import UserPreferencesRepository

logger = logging.getLogger(__name__)

async def validation_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Validate input and check service availability"""

    try:
        user_prefs_repo = UserPreferencesRepository()
        user_prefs = user_prefs_repo.get_user_preferences(state["user_id"])

        # Validate operation type
        if state["operation_type"] not in ["generate", "modify"]:
            state["validation_error"] = "Invalid operation type. Must be 'generate' or 'modify'"
            return state

        # For modify operations, validate character_id
        if state["operation_type"] == "modify" and not state["character_id"]:
            state["validation_error"] = "Character ID is required for modify operations"
            return state

        # Check multimodal service if image input provided
        if state["image_data"] or state["image_uri"]:
            multimodal_config = user_prefs.get('multimodal_backend', {}) if user_prefs else {}
            if not multimodal_config.get('enabled', False):
                state["validation_error"] = "Multimodal service is required but not configured"
                return state

        # Check image generation service if requested
        if state["generate_image"]:
            image_config = user_prefs.get('image_generation_backend', {}) if user_prefs else {}
            if not image_config.get('enabled', False):
                state["validation_error"] = "Image generation service is required but not configured"
                return state

        state["current_step"] = "validation_complete"
        logger.info("Character agent validation completed successfully")

    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        state["validation_error"] = f"Validation failed: {str(e)}"

    return state

async def multimodal_analysis_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze provided image for character context"""

    try:
        state["current_step"] = "multimodal_analysis"

        # Get multimodal service for user
        llm_service, provider, mode = LLMProxyService.get_llm_service_for_user(state["user_id"])

        prompt = """Analyze this image and describe any character-relevant details you can see:
- Physical appearance (age, gender, hair color, clothing style, etc.)
- Facial expression or mood
- Setting or environmental context
- Any distinctive features or characteristics
- Style or artistic approach

Provide a detailed but concise description focusing on elements that would be useful for character creation or modification."""

        # Create multimodal message
        messages = []
        content_parts = [{"type": "text", "text": prompt}]

        # Add image to message content
        if state["image_data"]:
            # Convert binary data to base64
            import base64
            image_b64 = base64.b64encode(state["image_data"]).decode()
            content_parts.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}
            })
        elif state["image_uri"]:
            content_parts.append({
                "type": "image_url",
                "image_url": {"url": state["image_uri"]}
            })

        messages.append({"role": "user", "content": content_parts})

        # Call LLM service for multimodal analysis
        payload = {
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 500,
            "stream": True
        }
        analysis_result = llm_service.chat_completion_stream(payload)

        # Extract text from streaming result
        result_text = ""
        for chunk in analysis_result:
            if isinstance(chunk, bytes):
                chunk_str = chunk.decode('utf-8')
                if chunk_str.startswith('data: '):
                    data_str = chunk_str[6:].strip()
                    if data_str == '[DONE]':
                        break
                    try:
                        import json
                        chunk_data = json.loads(data_str)
                        if 'choices' in chunk_data and chunk_data['choices']:
                            delta = chunk_data['choices'][0].get('delta', {})
                            if 'content' in delta and delta['content']:
                                result_text += delta['content']
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue

        state["multimodal_analysis"] = result_text.strip()
        state["current_step"] = "multimodal_analysis_complete"
        logger.info("Multimodal analysis completed successfully")

    except Exception as e:
        logger.error(f"Multimodal analysis error: {str(e)}")
        state["multimodal_error"] = f"Image analysis failed: {str(e)}"

    return state

async def character_generation_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Generate new character with progressive field streaming"""

    try:
        state["current_step"] = "character_generation"

        # Define character fields to generate
        character_fields = ["name", "age", "gender", "appearance", "personality", "background"]

        # Get LLM service for user
        llm_service, provider, mode = LLMProxyService.get_llm_service_for_user(state["user_id"])

        for field_name in character_fields:
            try:
                # Generate field prompt
                prompt = _build_field_prompt(
                    field_name,
                    state["scenario"],
                    state.get("multimodal_analysis", ""),
                    is_generation=True
                )

                # Generate field value using streaming completion
                messages = [{"role": "user", "content": prompt}]
                payload = {
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 200,
                    "stream": True
                }
                completion_result = llm_service.chat_completion_stream(payload)

                # Extract text from streaming result and send incremental updates
                field_value = ""
                for chunk in completion_result:
                    if isinstance(chunk, bytes):
                        chunk_str = chunk.decode('utf-8')
                        if chunk_str.startswith('data: '):
                            data_str = chunk_str[6:].strip()
                            if data_str == '[DONE]':
                                break
                            try:
                                import json
                                chunk_data = json.loads(data_str)
                                if 'choices' in chunk_data and chunk_data['choices']:
                                    delta = chunk_data['choices'][0].get('delta', {})
                                    if 'content' in delta and delta['content']:
                                        field_value += delta['content']

                                        # Send incremental streaming update
                                        incremental_field_data = {
                                            "field_name": field_name,
                                            "value": field_value,
                                            "status": "streaming"
                                        }
                                        incremental_streaming_event = {
                                            "event_type": "field_update",
                                            "field": incremental_field_data,
                                            "character_id": state.get("character_id", f"generated_{len(state['character_fields'])}")
                                        }
                                        state["streaming_events"].append(incremental_streaming_event)

                            except (json.JSONDecodeError, KeyError, IndexError):
                                continue

                # Add to character fields
                field_data = {
                    "field_name": field_name,
                    "value": field_value.strip(),
                    "status": "completed"
                }
                state["character_fields"].append(field_data)
                state["completed_fields"].append(field_name)

                # Add streaming event
                streaming_event = {
                    "event_type": "field_update",
                    "field": field_data,
                    "character_id": state.get("character_id", f"generated_{len(state['character_fields'])}")
                }
                state["streaming_events"].append(streaming_event)

                logger.info(f"Generated character field: {field_name}")

            except Exception as e:
                logger.error(f"Failed to generate field {field_name}: {str(e)}")
                field_data = {
                    "field_name": field_name,
                    "value": None,
                    "status": "error",
                    "error": str(e)
                }
                state["character_fields"].append(field_data)

                streaming_event = {
                    "event_type": "field_update",
                    "field": field_data,
                    "character_id": state.get("character_id", f"generated_{len(state['character_fields'])}")
                }
                state["streaming_events"].append(streaming_event)

        state["current_step"] = "character_generation_complete"
        logger.info("Character generation completed")

    except Exception as e:
        logger.error(f"Character generation error: {str(e)}")
        state["character_error"] = f"Character generation failed: {str(e)}"

    return state

async def character_modification_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Modify existing character fields"""

    try:
        state["current_step"] = "character_modification"

        # Get LLM service for user
        llm_service, provider, mode = LLMProxyService.get_llm_service_for_user(state["user_id"])

        for field_name in state["fields_to_modify"]:
            try:
                # Generate field prompt for modification
                prompt = _build_field_prompt(
                    field_name,
                    state["scenario"],
                    state.get("multimodal_analysis", ""),
                    is_generation=False
                )

                # Generate modified field value using streaming completion
                messages = [{"role": "user", "content": prompt}]
                payload = {
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 200,
                    "stream": True
                }
                completion_result = llm_service.chat_completion_stream(payload)

                # Extract text from streaming result and send incremental updates
                field_value = ""
                for chunk in completion_result:
                    if isinstance(chunk, bytes):
                        chunk_str = chunk.decode('utf-8')
                        if chunk_str.startswith('data: '):
                            data_str = chunk_str[6:].strip()
                            if data_str == '[DONE]':
                                break
                            try:
                                import json
                                chunk_data = json.loads(data_str)
                                if 'choices' in chunk_data and chunk_data['choices']:
                                    delta = chunk_data['choices'][0].get('delta', {})
                                    if 'content' in delta and delta['content']:
                                        field_value += delta['content']

                                        # Send incremental streaming update
                                        incremental_field_data = {
                                            "field_name": field_name,
                                            "value": field_value,
                                            "status": "streaming"
                                        }
                                        incremental_streaming_event = {
                                            "event_type": "field_update",
                                            "field": incremental_field_data,
                                            "character_id": state["character_id"]
                                        }
                                        state["streaming_events"].append(incremental_streaming_event)

                            except (json.JSONDecodeError, KeyError, IndexError):
                                continue

                # Add to character fields
                field_data = {
                    "field_name": field_name,
                    "value": field_value.strip(),
                    "status": "completed"
                }
                state["character_fields"].append(field_data)
                state["completed_fields"].append(field_name)

                # Add streaming event
                streaming_event = {
                    "event_type": "field_update",
                    "field": field_data,
                    "character_id": state["character_id"]
                }
                state["streaming_events"].append(streaming_event)

                logger.info(f"Modified character field: {field_name}")

            except Exception as e:
                logger.error(f"Failed to modify field {field_name}: {str(e)}")
                field_data = {
                    "field_name": field_name,
                    "value": None,
                    "status": "error",
                    "error": str(e)
                }
                state["character_fields"].append(field_data)

                streaming_event = {
                    "event_type": "field_update",
                    "field": field_data,
                    "character_id": state["character_id"]
                }
                state["streaming_events"].append(streaming_event)

        state["current_step"] = "character_modification_complete"
        logger.info("Character modification completed")

    except Exception as e:
        logger.error(f"Character modification error: {str(e)}")
        state["character_error"] = f"Character modification failed: {str(e)}"

    return state

async def image_generation_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Generate character portrait image"""

    try:
        state["current_step"] = "image_generation"

        # Build image generation prompt
        prompt = _build_image_prompt(state["scenario"], state["character_fields"])

        # For now, create a placeholder image URI
        # In production, this would integrate with the image generation service
        placeholder_image_uri = f"https://placeholder.image/character_{state.get('character_id', 'unknown')}.jpg"

        state["generated_image_uri"] = placeholder_image_uri

        # Add streaming event
        streaming_event = {
            "event_type": "image_generated",
            "image_uri": placeholder_image_uri,
            "character_id": state.get("character_id")
        }
        state["streaming_events"].append(streaming_event)

        state["current_step"] = "image_generation_complete"
        logger.info("Character image generation completed (placeholder)")

    except Exception as e:
        logger.error(f"Image generation error: {str(e)}")
        state["image_generation_error"] = f"Image generation failed: {str(e)}"

    return state

def _build_field_prompt(
    field_name: str,
    scenario: Dict[str, Any],
    image_analysis: str,
    is_generation: bool = True
) -> str:
    """Build context-aware prompt for character field generation/modification"""

    field_prompts = {
        "name": "Generate an appropriate character name that fits the scenario context and genre.",
        "age": "Determine a suitable age for this character based on the scenario context.",
        "gender": "Specify the character's gender identity.",
        "appearance": "Describe the character's physical appearance in vivid detail.",
        "personality": "Define the character's personality traits, quirks, and behavioral characteristics.",
        "background": "Create a compelling background story that explains the character's history and motivations."
    }

    # Build scenario context
    context_parts = []
    if scenario.get('title'):
        context_parts.append(f"Scenario: {scenario['title']}")
    if scenario.get('genre'):
        context_parts.append(f"Genre: {scenario['genre']}")
    if scenario.get('setting'):
        context_parts.append(f"Setting: {scenario['setting']}")
    if scenario.get('description'):
        context_parts.append(f"Description: {scenario['description'][:200]}...")

    scenario_context = "\n".join(context_parts)

    # Add image analysis if available
    image_context = f"\nImage analysis: {image_analysis}\n" if image_analysis else ""

    # Choose action verb
    action = "Modify the existing" if not is_generation else "Create a new"

    prompt = f"""{action} {field_name} for a character in this scenario.

{scenario_context}{image_context}

{field_prompts.get(field_name, f'Generate the {field_name} for this character.')}

Provide only the {field_name} content without additional formatting or explanations."""

    return prompt

def _build_image_prompt(scenario: Dict[str, Any], character_fields: List[Dict[str, Any]]) -> str:
    """Build prompt for character image generation"""

    prompt_parts = ["Character portrait:"]

    # Add scenario context
    if scenario.get('genre'):
        prompt_parts.append(f"Genre: {scenario['genre']}")
    if scenario.get('setting'):
        prompt_parts.append(f"Setting: {scenario['setting']}")

    # Add character details from generated fields
    character_details = {}
    for field in character_fields:
        if field.get("status") == "completed" and field.get("value"):
            character_details[field["field_name"]] = field["value"]

    # Add appearance details
    if character_details.get("appearance"):
        prompt_parts.append(f"Appearance: {character_details['appearance']}")
    if character_details.get("age"):
        prompt_parts.append(f"Age: {character_details['age']}")
    if character_details.get("gender"):
        prompt_parts.append(f"Gender: {character_details['gender']}")

    # Add styling instructions
    prompt_parts.append("High quality character portrait, detailed digital artwork, professional illustration style")

    return " ".join(prompt_parts)