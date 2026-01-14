import asyncio
import json
import logging
from typing import Dict, Any, List, Optional, AsyncGenerator
from agents.character_agent.character_graph import CharacterAgentGraph
from domain.models.character_agent import (
    CharacterGenerationRequest,
    CharacterModificationRequest,
    CharacterField,
    CharacterStreamingEvent,
    CharacterAgentError
)
from infrastructure.database.llm_repository import LLMRepository
from infrastructure.database.user_preferences_repository import UserPreferencesRepository

logger = logging.getLogger(__name__)

class CharacterAgentService:
    """Service for character generation and modification with streaming"""

    def __init__(
        self,
        llm_repository: LLMRepository,
        user_preferences_repository: UserPreferencesRepository
    ):
        self.llm_repository = llm_repository
        self.user_preferences_repository = user_preferences_repository
        self.character_graph = CharacterAgentGraph()

    async def validate_services(self, user_id: str, needs_multimodal: bool = False, needs_image_gen: bool = False) -> None:
        """Validate required services are available for user"""
        user_prefs = self.user_preferences_repository.get_user_preferences(user_id)

        if needs_multimodal:
            # Check if multimodal service is configured
            multimodal_config = user_prefs.get('multimodal_llm_config', '{}') if user_prefs else '{}'
            if isinstance(multimodal_config, str):
                multimodal_config = json.loads(multimodal_config) if multimodal_config else {}
            if not multimodal_config.get('enabled', False):
                logger.warning(f"User {user_id} attempted multimodal operation without enabled backend - ignoring multimodal features")
                return False

        if needs_image_gen:
            # Check if image generation service is configured
            image_config = user_prefs.get('image_llm_config', '{}') if user_prefs else '{}'
            if isinstance(image_config, str):
                image_config = json.loads(image_config) if image_config else {}
            if not image_config.get('enabled', False):
                logger.warning(f"User {user_id} attempted image generation without enabled backend - ignoring image generation request")
                return False

        return True

    async def generate_character(
        self,
        request: CharacterGenerationRequest,
        user_id: str
    ) -> AsyncGenerator[CharacterStreamingEvent, None]:
        """Generate a new character with streaming updates using LangGraph"""
        try:
            character_id = f"char_{int(asyncio.get_event_loop().time())}"

            # Check backend configurations and filter out unsupported features
            needs_multimodal = bool(request.image_file or request.image_uri)
            needs_image_gen = bool(request.generate_image)

            # Validate services and modify request if backends not configured
            multimodal_available = await self.validate_services(user_id, needs_multimodal=needs_multimodal, needs_image_gen=False)
            image_gen_available = await self.validate_services(user_id, needs_multimodal=False, needs_image_gen=needs_image_gen)

            # Filter request based on backend availability
            filtered_image_file = request.image_file if multimodal_available else None
            filtered_image_uri = request.image_uri if multimodal_available else None
            filtered_generate_image = request.generate_image if image_gen_available else False
            filtered_image_options = request.image_generation_options if image_gen_available else None

            if needs_multimodal and not multimodal_available:
                yield CharacterStreamingEvent(
                    event_type="info",
                    character_id=character_id,
                    error="Uploaded images ignored - multimodal backend not configured for your account"
                )

            if needs_image_gen and not image_gen_available:
                yield CharacterStreamingEvent(
                    event_type="info",
                    character_id=character_id,
                    error="Image generation ignored - image generation backend not configured for your account"
                )

            # Use LangGraph streaming for character generation
            async for state_update in self.character_graph.stream_character_operation(
                operation_type="generate",
                scenario=request.scenario,
                user_id=user_id,
                image_data=filtered_image_file,
                image_uri=filtered_image_uri,
                generate_image=filtered_generate_image,
                image_generation_options=filtered_image_options
            ):
                # Convert state updates to streaming events
                for event_data in state_update.get("streaming_events", []):
                    # Convert field updates to CharacterField objects
                    if event_data.get("event_type") == "field_update" and event_data.get("field"):
                        field_data = event_data["field"]
                        field = CharacterField(
                            field_name=field_data["field_name"],
                            value=field_data["value"],
                            status=field_data["status"],
                            error=field_data.get("error")
                        )
                        event_data["field"] = field

                    # Create streaming event
                    streaming_event = CharacterStreamingEvent(
                        event_type=event_data["event_type"],
                        character_id=event_data.get("character_id", character_id),
                        field=event_data.get("field"),
                        image_uri=event_data.get("image_uri"),
                        error=event_data.get("error")
                    )
                    yield streaming_event

                # Check for errors
                if state_update.get("validation_error"):
                    yield CharacterStreamingEvent(
                        event_type="error",
                        error=state_update["validation_error"]
                    )
                    return

                if state_update.get("character_error"):
                    yield CharacterStreamingEvent(
                        event_type="error",
                        character_id=character_id,
                        error=state_update["character_error"]
                    )
                    return

                # Check if complete
                if state_update.get("current_step") == "image_generation_complete" or (
                    state_update.get("current_step") == "character_generation_complete" and
                    not filtered_generate_image
                ):
                    yield CharacterStreamingEvent(
                        event_type="complete",
                        character_id=character_id,
                        complete=True
                    )
                    return

        except Exception as e:
            logger.error(f"Character generation failed: {str(e)}")
            yield CharacterStreamingEvent(
                event_type="error",
                error=str(e)
            )

    async def modify_character(
        self,
        request: CharacterModificationRequest,
        user_id: str
    ) -> AsyncGenerator[CharacterStreamingEvent, None]:
        """Modify existing character with streaming updates using LangGraph"""
        try:
            # Check backend configurations and filter out unsupported features
            needs_multimodal = bool(request.image_file or request.image_uri)
            needs_image_gen = bool(request.generate_image)

            # Validate services and modify request if backends not configured
            multimodal_available = await self.validate_services(user_id, needs_multimodal=needs_multimodal, needs_image_gen=False)
            image_gen_available = await self.validate_services(user_id, needs_multimodal=False, needs_image_gen=needs_image_gen)

            # Filter request based on backend availability
            filtered_image_file = request.image_file if multimodal_available else None
            filtered_image_uri = request.image_uri if multimodal_available else None
            filtered_generate_image = request.generate_image if image_gen_available else False
            filtered_image_options = request.image_generation_options if image_gen_available else None

            if needs_multimodal and not multimodal_available:
                yield CharacterStreamingEvent(
                    event_type="info",
                    character_id=request.character_id,
                    error="Uploaded images ignored - multimodal backend not configured for your account"
                )

            if needs_image_gen and not image_gen_available:
                yield CharacterStreamingEvent(
                    event_type="info",
                    character_id=request.character_id,
                    error="Image generation ignored - image generation backend not configured for your account"
                )

            # Use LangGraph streaming for character modification
            async for state_update in self.character_graph.stream_character_operation(
                operation_type="modify",
                scenario=request.scenario,
                user_id=user_id,
                character_id=request.character_id,
                fields_to_modify=request.fields_to_modify,
                image_data=filtered_image_file,
                image_uri=filtered_image_uri,
                generate_image=filtered_generate_image,
                image_generation_options=filtered_image_options
            ):
                # Convert state updates to streaming events
                for event_data in state_update.get("streaming_events", []):
                    # Convert field updates to CharacterField objects
                    if event_data.get("event_type") == "field_update" and event_data.get("field"):
                        field_data = event_data["field"]
                        field = CharacterField(
                            field_name=field_data["field_name"],
                            value=field_data["value"],
                            status=field_data["status"],
                            error=field_data.get("error")
                        )
                        event_data["field"] = field

                    # Create streaming event
                    streaming_event = CharacterStreamingEvent(
                        event_type=event_data["event_type"],
                        character_id=event_data.get("character_id", request.character_id),
                        field=event_data.get("field"),
                        image_uri=event_data.get("image_uri"),
                        error=event_data.get("error")
                    )
                    yield streaming_event

                # Check for errors
                if state_update.get("validation_error"):
                    yield CharacterStreamingEvent(
                        event_type="error",
                        error=state_update["validation_error"]
                    )
                    return

                if state_update.get("character_error"):
                    yield CharacterStreamingEvent(
                        event_type="error",
                        character_id=request.character_id,
                        error=state_update["character_error"]
                    )
                    return

                # Check if complete
                if state_update.get("current_step") == "image_generation_complete" or (
                    state_update.get("current_step") == "character_modification_complete" and
                    not filtered_generate_image
                ):
                    yield CharacterStreamingEvent(
                        event_type="complete",
                        character_id=request.character_id,
                        complete=True
                    )
                    return

        except Exception as e:
            logger.error(f"Character modification failed: {str(e)}")
            yield CharacterStreamingEvent(
                event_type="error",
                error=str(e)
            )

