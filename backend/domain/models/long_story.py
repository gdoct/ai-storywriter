"""
Domain models (Pydantic) for the Long Story feature.
"""
from typing import List, Optional
from enum import Enum
from pydantic import BaseModel


class LongStoryStatus(str, Enum):
    DRAFT = 'draft'
    ARC_READY = 'arc_ready'      # synopsis + arc generated, awaiting user review
    IN_PROGRESS = 'in_progress'
    COMPLETED = 'completed'
    ABANDONED = 'abandoned'


class ChapterStatus(str, Enum):
    PENDING = 'pending'
    GENERATING = 'generating'
    COMPLETE = 'complete'


# ── Request models ─────────────────────────────────────────────────────────────

class LongStoryCreate(BaseModel):
    scenario_id: str
    title: str


class LongStoryUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[LongStoryStatus] = None


class ArcChapterItem(BaseModel):
    chapter_number: int
    title: str
    one_liner: str


class ArcUpdate(BaseModel):
    """Payload for saving user edits to the story arc before chapter generation."""
    chapters: List[ArcChapterItem]


class ChapterContentUpdate(BaseModel):
    """Payload for saving a specific version of chapter content as canonical."""
    content: str


# ── Response models ────────────────────────────────────────────────────────────

class LongStoryChapterResponse(BaseModel):
    id: int
    long_story_id: int
    chapter_number: int
    title: str
    one_liner: Optional[str] = None
    storyline: Optional[str] = None   # JSON string
    content: Optional[str] = None
    status: ChapterStatus
    created_at: str
    updated_at: str


class LongStoryResponse(BaseModel):
    id: int
    scenario_id: str
    user_id: str
    title: str
    status: LongStoryStatus
    synopsis: Optional[str] = None
    story_arc: Optional[str] = None   # JSON string
    created_at: str
    updated_at: str


class LongStoryListItem(BaseModel):
    id: int
    scenario_id: str
    user_id: str
    title: str
    status: LongStoryStatus
    chapter_count: Optional[int] = 0
    created_at: str
    updated_at: str


class LongStoryDetailResponse(LongStoryResponse):
    chapters: List[LongStoryChapterResponse] = []
