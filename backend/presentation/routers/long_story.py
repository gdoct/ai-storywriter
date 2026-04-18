"""
API Router for Long Stories feature.

Endpoints:
  POST   /long-stories                                              Create a new long story
  GET    /long-stories                                              List user's long stories
  GET    /long-stories/{story_id}                                   Get story with chapters
  PUT    /long-stories/{story_id}                                   Update title / status
  DELETE /long-stories/{story_id}                                   Delete story (cascade)
  POST   /long-stories/{story_id}/generate/arc/stream              Phase 1: generate synopsis + arc
  PUT    /long-stories/{story_id}/arc                              Save edited arc (before chapter gen)
  POST   /long-stories/{story_id}/generate/stream                  Phase 2: generate all chapters
  POST   /long-stories/{story_id}/generate/chapter/{chapter_number}/stream  Generate one chapter
"""
import json
import logging
from typing import List

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import StreamingResponse

from domain.models.long_story import (
    LongStoryCreate,
    LongStoryUpdate,
    LongStoryResponse,
    LongStoryDetailResponse,
    LongStoryListItem,
    ArcUpdate,
    ChapterContentUpdate,
    LongStoryChapterResponse,
)
from infrastructure.database.repositories import LongStoryRepository, ScenarioRepository
from api.middleware.fastapi_auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


def _serialize_event(event: dict) -> str:
    """JSON-serialize an event dict, handling datetime objects."""
    def _default(obj):
        if hasattr(obj, 'isoformat'):
            return obj.isoformat()
        if hasattr(obj, '__dict__'):
            return obj.__dict__
        return str(obj)
    return json.dumps(event, default=_default)


def _get_scenario(story: dict, user_id: str) -> dict:
    scenario_row = ScenarioRepository.get_scenario_by_id(story['scenario_id'], user_id)
    if not scenario_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Associated scenario not found")
    return dict(scenario_row)


# ── Story management ──────────────────────────────────────────────────────────

@router.post("/long-stories", response_model=LongStoryResponse, status_code=status.HTTP_201_CREATED)
async def create_long_story(
    story_data: LongStoryCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new long story from a scenario."""
    user_id = current_user['id']

    scenario = ScenarioRepository.get_scenario_by_id(story_data.scenario_id, user_id)
    if not scenario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")

    story = LongStoryRepository.create_long_story(
        user_id=user_id,
        scenario_id=story_data.scenario_id,
        title=story_data.title,
    )
    if not story:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Failed to create long story")
    return story


@router.get("/long-stories", response_model=List[LongStoryListItem])
async def list_long_stories(current_user: dict = Depends(get_current_user)):
    """List all long stories for the current user."""
    user_id = current_user['id']
    stories = LongStoryRepository.get_long_stories_by_user(user_id)
    return stories


@router.get("/long-stories/{story_id}", response_model=LongStoryDetailResponse)
async def get_long_story(
    story_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get a long story with all chapters."""
    user_id = current_user['id']
    story = LongStoryRepository.get_long_story_with_chapters(story_id, user_id)
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Long story not found")
    return story


@router.put("/long-stories/{story_id}", response_model=LongStoryResponse)
async def update_long_story(
    story_id: int,
    story_data: LongStoryUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a long story's title or status."""
    user_id = current_user['id']

    existing = LongStoryRepository.get_long_story_by_id(story_id, user_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Long story not found")

    story = LongStoryRepository.update_long_story(
        story_id=story_id,
        user_id=user_id,
        title=story_data.title,
        status=story_data.status.value if story_data.status else None,
    )
    return story


@router.delete("/long-stories/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_long_story(
    story_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a long story and all its chapters."""
    user_id = current_user['id']
    deleted = LongStoryRepository.delete_long_story(story_id, user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Long story not found")


# ── Arc management ────────────────────────────────────────────────────────────

@router.put("/long-stories/{story_id}/arc", response_model=List[LongStoryChapterResponse])
async def update_arc(
    story_id: int,
    arc_data: ArcUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Save user edits to the story arc (chapter titles and one-liners).

    Resets any pending/generating chapters to match the new arc.
    Already-completed chapters are preserved.
    """
    user_id = current_user['id']

    story = LongStoryRepository.get_long_story_by_id(story_id, user_id)
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Long story not found")

    arc = [item.model_dump() for item in arc_data.chapters]
    arc_json = json.dumps(arc)

    LongStoryRepository.update_long_story(story_id, user_id, story_arc=arc_json)
    chapters = LongStoryRepository.reset_chapters_from_arc(story_id, arc)
    return chapters


@router.put("/long-stories/{story_id}/chapter/{chapter_number}/content",
            response_model=LongStoryChapterResponse)
async def set_chapter_content(
    story_id: int,
    chapter_number: int,
    data: ChapterContentUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Save a specific version of chapter content as the canonical version.

    Called by the frontend when the user selects a non-latest version before
    advancing to the next chapter, so that continuity is based on the chosen version.
    """
    user_id = current_user['id']

    story = LongStoryRepository.get_long_story_by_id(story_id, user_id)
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Long story not found")

    chapter = LongStoryRepository.get_chapter_by_number(story_id, chapter_number)
    if not chapter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")

    updated = LongStoryRepository.update_chapter(
        chapter['id'], story_id, content=data.content, status='complete'
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Failed to update chapter content")
    return updated


# ── Generation ────────────────────────────────────────────────────────────────

@router.post("/long-stories/{story_id}/generate/arc/stream")
async def stream_generate_arc(
    story_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Phase 1: Stream synopsis + story arc generation.

    Stops after the arc is saved. The client should then display
    the arc for user review/editing before triggering chapter generation.

    Events: status, synopsis, arc, arc_ready, error
    """
    user_id = current_user['id']

    story = LongStoryRepository.get_long_story_by_id(story_id, user_id)
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Long story not found")
    scenario = _get_scenario(story, user_id)

    async def event_generator():
        try:
            from agents.long_story.long_story_graph import long_story_agent
            async for event in long_story_agent.stream_generate_arc(
                story_id=story_id, user_id=user_id, scenario=scenario
            ):
                try:
                    yield f"data: {_serialize_event(event)}\n\n"
                except Exception as se:
                    logger.error(f"Serialize error: {se}")
                    yield f"data: {json.dumps({'type': 'error', 'error': str(se)})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Arc generation error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@router.post("/long-stories/{story_id}/generate/stream")
async def stream_generate_chapters(
    story_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Phase 2: Stream chapter generation using the saved synopsis and arc.

    Reads synopsis and arc from the DB (must be arc_ready or later).
    Skips already-completed chapters (resume support).

    Events: synopsis, arc, chapter_start, token, chapter_complete, complete, error
    """
    user_id = current_user['id']

    story = LongStoryRepository.get_long_story_by_id(story_id, user_id)
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Long story not found")
    if not story.get('story_arc'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Story arc not generated yet. Call /generate/arc/stream first.")
    scenario = _get_scenario(story, user_id)

    async def event_generator():
        try:
            from agents.long_story.long_story_graph import long_story_agent
            async for event in long_story_agent.stream_generate_chapters(
                story_id=story_id, user_id=user_id, scenario=scenario
            ):
                try:
                    yield f"data: {_serialize_event(event)}\n\n"
                except Exception as se:
                    logger.error(f"Serialize error: {se}")
                    yield f"data: {json.dumps({'type': 'error', 'error': str(se)})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Chapter generation error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@router.post("/long-stories/{story_id}/generate/chapter/{chapter_number}/stream")
async def stream_generate_single_chapter(
    story_id: int,
    chapter_number: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate (or regenerate) a single chapter by number.

    Reads synopsis and arc from the DB (must be arc_ready or later).
    Derives continuity from the previous chapter already saved in DB.
    Resets the target chapter before generating (supports re-generation).

    Events: status, chapter_start, token, chapter_complete (with is_last, total_chapters), error
    """
    user_id = current_user['id']

    story = LongStoryRepository.get_long_story_by_id(story_id, user_id)
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Long story not found")
    if not story.get('story_arc'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Story arc not generated yet. Call /generate/arc/stream first.")
    scenario = _get_scenario(story, user_id)

    async def event_generator():
        try:
            from agents.long_story.long_story_graph import long_story_agent
            async for event in long_story_agent.stream_generate_single_chapter(
                story_id=story_id, user_id=user_id, scenario=scenario,
                chapter_number=chapter_number
            ):
                try:
                    yield f"data: {_serialize_event(event)}\n\n"
                except Exception as se:
                    logger.error(f"Serialize error: {se}")
                    yield f"data: {json.dumps({'type': 'error', 'error': str(se)})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Single chapter generation error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
