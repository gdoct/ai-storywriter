"""
API Router for Rolling Stories feature.
"""
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import StreamingResponse

from domain.models.rolling_story import (
    RollingStoryCreate,
    RollingStoryUpdate,
    RollingStoryResponse,
    RollingStoryDetailResponse,
    RollingStoryListItem,
    GenerateRequest,
    GenerateResponse,
    StoryBibleEntryUpdate,
    StoryBibleEntryResponse,
    StoryEventResponse,
    StoryParagraphResponse,
)
from infrastructure.database.repositories import RollingStoryRepository, ScenarioRepository
from api.middleware.fastapi_auth import get_current_user

router = APIRouter()


# ============= Story Management =============

@router.post("/rolling-stories", response_model=RollingStoryResponse, status_code=status.HTTP_201_CREATED)
async def create_rolling_story(
    story_data: RollingStoryCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new rolling story from a scenario."""
    user_id = current_user['id']

    # Verify scenario exists and belongs to user
    scenario = ScenarioRepository.get_scenario_by_id(story_data.scenario_id, user_id)
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scenario not found"
        )

    story = RollingStoryRepository.create_rolling_story(
        user_id=user_id,
        scenario_id=story_data.scenario_id,
        title=story_data.title
    )

    if not story:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create rolling story"
        )

    return story


@router.get("/rolling-stories", response_model=List[RollingStoryListItem])
async def list_rolling_stories(current_user: dict = Depends(get_current_user)):
    """List all rolling stories for the current user."""
    user_id = current_user['id']
    stories = RollingStoryRepository.get_rolling_stories_by_user(user_id)
    return stories


@router.get("/rolling-stories/{story_id}", response_model=RollingStoryDetailResponse)
async def get_rolling_story(
    story_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get a rolling story with all paragraphs, bible entries, and events."""
    user_id = current_user['id']
    story = RollingStoryRepository.get_rolling_story_full(story_id, user_id)

    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rolling story not found"
        )

    return story


@router.put("/rolling-stories/{story_id}", response_model=RollingStoryResponse)
async def update_rolling_story(
    story_id: int,
    story_data: RollingStoryUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a rolling story's title or status."""
    user_id = current_user['id']

    # Verify story exists
    existing = RollingStoryRepository.get_rolling_story_by_id(story_id, user_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rolling story not found"
        )

    story = RollingStoryRepository.update_rolling_story(
        story_id=story_id,
        user_id=user_id,
        title=story_data.title,
        status=story_data.status.value if story_data.status else None
    )

    return story


@router.delete("/rolling-stories/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rolling_story(
    story_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a rolling story and all related data."""
    user_id = current_user['id']

    deleted = RollingStoryRepository.delete_rolling_story(story_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rolling story not found"
        )


# ============= Story Bible =============

@router.get("/rolling-stories/{story_id}/bible", response_model=List[StoryBibleEntryResponse])
async def get_story_bible(
    story_id: int,
    category: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all story bible entries for a rolling story."""
    user_id = current_user['id']

    # Verify story exists and belongs to user
    story = RollingStoryRepository.get_rolling_story_by_id(story_id, user_id)
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rolling story not found"
        )

    entries = RollingStoryRepository.get_bible_entries(story_id, category)
    return entries


@router.put("/rolling-stories/{story_id}/bible/{entry_id}", response_model=StoryBibleEntryResponse)
async def update_bible_entry(
    story_id: int,
    entry_id: int,
    entry_data: StoryBibleEntryUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a story bible entry."""
    user_id = current_user['id']

    # Verify story exists and belongs to user
    story = RollingStoryRepository.get_rolling_story_by_id(story_id, user_id)
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rolling story not found"
        )

    entry = RollingStoryRepository.update_bible_entry(
        entry_id=entry_id,
        rolling_story_id=story_id,
        name=entry_data.name,
        details=entry_data.details
    )

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bible entry not found"
        )

    return entry


# ============= Story Events =============

@router.get("/rolling-stories/{story_id}/events", response_model=List[StoryEventResponse])
async def get_story_events(
    story_id: int,
    event_type: str = None,
    limit: int = None,
    current_user: dict = Depends(get_current_user)
):
    """Get story events for a rolling story."""
    user_id = current_user['id']

    # Verify story exists and belongs to user
    story = RollingStoryRepository.get_rolling_story_by_id(story_id, user_id)
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rolling story not found"
        )

    events = RollingStoryRepository.get_events(story_id, event_type, limit)
    return events


# ============= Paragraph Generation =============

@router.post("/rolling-stories/{story_id}/generate")
async def generate_paragraphs(
    story_id: int,
    request: GenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate the next 8 paragraphs for a rolling story.

    This endpoint triggers the RollingStoryAgent to generate paragraphs,
    extract bible/event updates, and generate choices for the next cycle.

    The frontend should send the current bible and events state, along with
    the user's chosen action (if continuing from a previous cycle).
    """
    user_id = current_user['id']

    # Verify story exists and belongs to user
    story = RollingStoryRepository.get_rolling_story_full(story_id, user_id)
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rolling story not found"
        )

    # Get the scenario for context
    scenario_row = ScenarioRepository.get_scenario_by_id(story['scenario_id'], user_id)
    if not scenario_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated scenario not found"
        )
    # Convert sqlite3.Row to dict for the agent
    scenario = dict(scenario_row)

    # Import and invoke the agent
    # This will be implemented in the next step
    try:
        from agents.rolling_story.rolling_story_graph import rolling_story_agent

        result = await rolling_story_agent.generate(
            story_id=story_id,
            user_id=user_id,
            scenario=scenario,
            bible=request.bible,
            events=request.events,
            chosen_action=request.chosen_action,
            chosen_action_description=request.chosen_action_description,
            user_storyline_influence=request.storyline_influence,
            paragraph_count=request.paragraph_count,
            choice_count=request.choice_count
        )

        return result
    except ImportError:
        # Agent not yet implemented - return placeholder
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Rolling story agent not yet implemented"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generation failed: {str(e)}"
        )


@router.post("/rolling-stories/{story_id}/generate/stream")
async def stream_generate_paragraphs(
    story_id: int,
    request: GenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Stream the generation of paragraphs for a rolling story.

    Returns a Server-Sent Events stream with real-time paragraph generation.
    """
    user_id = current_user['id']

    # Verify story exists and belongs to user
    story = RollingStoryRepository.get_rolling_story_full(story_id, user_id)
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rolling story not found"
        )

    # Get the scenario for context
    scenario_row = ScenarioRepository.get_scenario_by_id(story['scenario_id'], user_id)
    if not scenario_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated scenario not found"
        )
    # Convert sqlite3.Row to dict for the agent
    scenario = dict(scenario_row)

    async def event_generator():
        try:
            from agents.rolling_story.rolling_story_graph import rolling_story_agent
            import json

            async for event in rolling_story_agent.stream_generate(
                story_id=story_id,
                user_id=user_id,
                scenario=scenario,
                bible=request.bible,
                events=request.events,
                chosen_action=request.chosen_action,
                chosen_action_description=request.chosen_action_description,
                user_storyline_influence=request.storyline_influence,
                paragraph_count=request.paragraph_count,
                choice_count=request.choice_count
            ):
                yield f"data: {json.dumps(event)}\n\n"

            yield "data: [DONE]\n\n"
        except ImportError:
            yield f"data: {json.dumps({'error': 'Rolling story agent not yet implemented'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
