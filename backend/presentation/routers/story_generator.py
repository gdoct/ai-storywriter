"""
Story Generator Router
FastAPI endpoints for story generation using LangGraph agent
"""

import logging
import json
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from infrastructure.database.repositories import UserRepository
from domain.services.credit_service import CreditService
from api.middleware.fastapi_auth import get_current_user
from agents.story_generator.story_graph import story_generator
from agents.story_generator.models.request_models import StoryGenerationRequest
from agents.story_generator.models.response_models import (
    StoryGenerationResponse,
    StoryStreamingEvent
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agent/story", tags=["Story Generator Agent"])


@router.post("/generate", response_model=StoryGenerationResponse)
async def generate_story(
    request: StoryGenerationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a story using the LangGraph story generator agent
    Non-streaming endpoint that returns the complete story
    """
    try:
        user_id = current_user.get('user_id')

        # Initialize services
        credit_service = CreditService()

        # Check user credits (estimated cost)
        estimated_cost = _estimate_story_cost(request)
        if not await credit_service.check_sufficient_credits(user_id, estimated_cost):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Insufficient credits for story generation"
            )

        # Generate story using the LangGraph agent
        result = await story_generator.generate_story(
            scenario_data=request.scenario.dict(),
            user_id=str(user_id),
            llm_settings=request.generation_options.dict()
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Story generation failed")
            )

        # Deduct actual credits used
        actual_cost = result.get("processing_summary", {}).get("credits_used", estimated_cost)
        await credit_service.deduct_credits(
            user_id,
            actual_cost,
            "story_generation",
            f"Story generation for scenario: {request.scenario.title or 'Untitled'}"
        )

        return StoryGenerationResponse(
            success=True,
            story=result["story"],
            processing_summary=result["processing_summary"],
            credits_used=actual_cost
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Story generation failed for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Story generation failed"
        )


@router.post("/stream")
async def stream_story_generation(
    request: StoryGenerationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Stream story generation with real-time updates using Server-Sent Events
    """
    try:
        user_id = current_user.get('user_id')

        # Initialize services
        credit_service = CreditService()

        # Check user credits (estimated cost)
        estimated_cost = _estimate_story_cost(request)
        if not await credit_service.check_sufficient_credits(user_id, estimated_cost):
            # Send error event and close stream
            async def error_stream():
                yield _format_sse_event({
                    "type": "error",
                    "error": "Insufficient credits for story generation"
                })

            return StreamingResponse(
                error_stream(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Cache-Control"
                }
            )

        # Create the streaming generator
        async def story_stream():
            try:
                total_credits_used = 0

                # Stream story generation events
                async for event in story_generator.stream_story_generation(
                    request,
                    str(user_id)
                ):
                    # Convert Pydantic model to dict if needed
                    if hasattr(event, 'dict'):
                        event_dict = event.dict(exclude_none=True)
                    else:
                        event_dict = event

                    # Track credits used
                    if event_dict.get("credits_used"):
                        total_credits_used += event_dict["credits_used"]

                    # Send event to client
                    yield _format_sse_event(event_dict)

                    # Handle completion
                    if event_dict.get("type") == "complete":
                        # Deduct final credits
                        if total_credits_used > 0:
                            await credit_service.deduct_credits(
                                user_id,
                                total_credits_used,
                                "story_generation_streaming",
                                f"Streaming story generation for scenario: {request.scenario.title or 'Untitled'}"
                            )

                        logger.info(f"Story generation completed for user {user_id}, credits used: {total_credits_used}")
                        break

                    # Handle errors
                    if event_dict.get("type") == "error":
                        logger.error(f"Story generation error for user {user_id}: {event_dict.get('error')}")
                        break

                # Send final event to close the stream
                yield _format_sse_event({"type": "stream_end"})

            except Exception as e:
                logger.error(f"Streaming story generation failed for user {user_id}: {str(e)}")
                yield _format_sse_event({
                    "type": "error",
                    "error": f"Story generation failed: {str(e)}"
                })

        return StreamingResponse(
            story_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Cache-Control"
            }
        )

    except Exception as e:
        logger.error(f"Failed to start streaming story generation for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start story generation stream"
        )


@router.get("/cost-estimate")
async def estimate_story_cost(
    title: str = None,
    synopsis: str = None,
    character_count: int = 0,
    location_count: int = 0,
    has_timeline: bool = False,
    has_backstory: bool = False,
    has_storyarc: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """
    Estimate the cost of generating a story based on scenario complexity
    """
    try:
        user_id = current_user.get('user_id')
        # Create a mock request for cost estimation
        mock_scenario = {
            "title": title or "",
            "synopsis": synopsis or "",
            "characters": [{"id": f"char_{i}", "name": f"Character {i}"} for i in range(character_count)],
            "locations": [{"id": f"loc_{i}", "name": f"Location {i}"} for i in range(location_count)],
            "timeline": [{"event": "Sample event"}] if has_timeline else [],
            "backstory": "Sample backstory" if has_backstory else "",
            "storyarc": "Sample story arc" if has_storyarc else ""
        }

        mock_request = type('MockRequest', (), {
            'scenario': type('MockScenario', (), mock_scenario)()
        })()

        estimated_cost = _estimate_story_cost(mock_request)

        return {
            "estimated_cost": estimated_cost,
            "factors": {
                "base_cost": 10,
                "character_cost": character_count * 2,
                "location_cost": location_count * 1,
                "timeline_cost": 5 if has_timeline else 0,
                "backstory_cost": 3 if has_backstory else 0,
                "storyarc_cost": 4 if has_storyarc else 0,
                "synopsis_length_cost": len(synopsis or "") // 100
            }
        }

    except Exception as e:
        logger.error(f"Cost estimation failed for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cost estimation failed"
        )


def _estimate_story_cost(request: StoryGenerationRequest) -> int:
    """
    Estimate the credit cost for story generation based on scenario complexity
    """
    base_cost = 10  # Base cost for any story generation

    # Factor in scenario complexity
    scenario = request.scenario
    complexity_cost = 0

    # Character complexity
    if hasattr(scenario, 'characters') and scenario.characters:
        complexity_cost += len(scenario.characters) * 2

    # Location complexity
    if hasattr(scenario, 'locations') and scenario.locations:
        complexity_cost += len(scenario.locations) * 1

    # Timeline complexity
    if hasattr(scenario, 'timeline') and scenario.timeline:
        complexity_cost += len(scenario.timeline) * 0.5

    # Text length factors
    text_fields = []
    if hasattr(scenario, 'synopsis') and scenario.synopsis:
        text_fields.append(scenario.synopsis)
    if hasattr(scenario, 'backstory') and scenario.backstory:
        text_fields.append(scenario.backstory)
    if hasattr(scenario, 'storyarc') and scenario.storyarc:
        text_fields.append(scenario.storyarc)

    total_text_length = sum(len(text) for text in text_fields)
    length_cost = total_text_length // 1000  # 1 credit per 1000 characters

    # Generation options complexity
    options_cost = 0
    if hasattr(request, 'generation_options') and request.generation_options:
        options = request.generation_options
        if hasattr(options, 'target_length') and options.target_length:
            # Longer stories cost more
            if options.target_length > 1000:
                options_cost += 5
            elif options.target_length > 2000:
                options_cost += 10

    return int(base_cost + complexity_cost + length_cost + options_cost)


def _format_sse_event(data: Dict[str, Any]) -> str:
    """
    Format data as Server-Sent Event
    """
    json_data = json.dumps(data)
    return f"data: {json_data}\n\n"


# Note: Global exception handling is done at the FastAPI app level