import json
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends, Request, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from domain.models.character_agent import (
    CharacterGenerationRequest,
    CharacterModificationRequest,
    CharacterStreamingEvent,
    CharacterAgentError
)
from domain.services.character_agent_service import CharacterAgentService
from infrastructure.database.repositories import UserRepository
from infrastructure.database.user_preferences_repository import UserPreferencesRepository
from infrastructure.database.llm_repository import LLMRepository
from api.middleware.fastapi_auth import get_current_user

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

def get_character_agent_service() -> CharacterAgentService:
    """Dependency to get character agent service"""
    llm_repository = LLMRepository()
    user_preferences_repository = UserPreferencesRepository()
    return CharacterAgentService(llm_repository, user_preferences_repository)

@router.post("/generate")
async def generate_character(
    scenario: str = Form(...),
    generate_image: bool = Form(False),
    image_generation_options: Optional[str] = Form(None),
    image_uri: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
    character_agent_service: CharacterAgentService = Depends(get_character_agent_service)
):
    """
    Generate a new character with streaming updates.

    - **scenario**: JSON string containing scenario context
    - **generate_image**: Whether to generate a character portrait
    - **image_generation_options**: JSON string with image generation options
    - **image_uri**: URI to image for multimodal analysis
    - **image_file**: Binary image file for multimodal analysis
    """
    try:
        # Parse JSON inputs
        scenario_dict = json.loads(scenario) if scenario else {}
        image_gen_options = json.loads(image_generation_options) if image_generation_options else None

        # Handle image file upload
        image_data = None
        if image_file:
            image_data = await image_file.read()

        # Create request object
        request = CharacterGenerationRequest(
            scenario=scenario_dict,
            image_file=image_data,
            image_uri=image_uri,
            generate_image=generate_image,
            image_generation_options=image_gen_options
        )

        # Stream character generation
        async def generate_stream():
            try:
                async for event in character_agent_service.generate_character(request, current_user['id']):
                    event_json = event.model_dump_json()
                    yield f"data: {event_json}\n\n"

                # Send final completion marker
                yield f"data: [DONE]\n\n"

            except Exception as e:
                logger.error(f"Character generation streaming error: {str(e)}")
                error_event = CharacterStreamingEvent(
                    event_type="error",
                    error=str(e)
                )
                yield f"data: {error_event.model_dump_json()}\n\n"

        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable nginx buffering
            }
        )

    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON format: {str(e)}"
        )
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Character generation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during character generation"
        )

@router.post("/modify")
async def modify_character(
    scenario: str = Form(...),
    character_id: str = Form(...),
    fields_to_modify: str = Form(...),
    generate_image: bool = Form(False),
    image_generation_options: Optional[str] = Form(None),
    image_uri: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
    character_agent_service: CharacterAgentService = Depends(get_character_agent_service)
):
    """
    Modify an existing character with streaming updates.

    - **scenario**: JSON string containing scenario context
    - **character_id**: ID of character to modify
    - **fields_to_modify**: JSON array of field names to modify
    - **generate_image**: Whether to generate a new character portrait
    - **image_generation_options**: JSON string with image generation options
    - **image_uri**: URI to image for multimodal analysis
    - **image_file**: Binary image file for multimodal analysis
    """
    try:
        # Parse JSON inputs
        scenario_dict = json.loads(scenario) if scenario else {}
        fields_list = json.loads(fields_to_modify) if fields_to_modify else []
        image_gen_options = json.loads(image_generation_options) if image_generation_options else None

        # Validate fields_to_modify is a list
        if not isinstance(fields_list, list):
            raise ValueError("fields_to_modify must be a JSON array")

        # Handle image file upload
        image_data = None
        if image_file:
            image_data = await image_file.read()

        # Create request object
        request = CharacterModificationRequest(
            scenario=scenario_dict,
            character_id=character_id,
            fields_to_modify=fields_list,
            image_file=image_data,
            image_uri=image_uri,
            generate_image=generate_image,
            image_generation_options=image_gen_options
        )

        # Stream character modification
        async def modify_stream():
            try:
                async for event in character_agent_service.modify_character(request, current_user['id']):
                    event_json = event.model_dump_json()
                    yield f"data: {event_json}\n\n"

                # Send final completion marker
                yield f"data: [DONE]\n\n"

            except Exception as e:
                logger.error(f"Character modification streaming error: {str(e)}")
                error_event = CharacterStreamingEvent(
                    event_type="error",
                    error=str(e)
                )
                yield f"data: {error_event.model_dump_json()}\n\n"

        return StreamingResponse(
            modify_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable nginx buffering
            }
        )

    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON format: {str(e)}"
        )
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Character modification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during character modification"
        )

@router.get("/health")
async def character_agent_health():
    """Health check endpoint for character agent"""
    return {"status": "healthy", "service": "character_agent"}