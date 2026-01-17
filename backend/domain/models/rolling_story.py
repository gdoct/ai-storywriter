"""
Pydantic models for Rolling Stories feature.
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class RollingStoryStatus(str, Enum):
    """Status of a rolling story."""
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class StoryBibleCategory(str, Enum):
    """Category of a story bible entry."""
    CHARACTER = "character"
    SETTING = "setting"
    OBJECT = "object"


class StoryEventType(str, Enum):
    """Type of story event."""
    KEY_EVENT = "key_event"
    DECISION = "decision"
    CONSEQUENCE = "consequence"
    UNRESOLVED = "unresolved"
    USER_CHOICE = "user_choice"


# ChoiceType enum removed - choices now use dynamic labels instead of fixed types


# ============= Story Bible Models =============

class StoryBibleEntryBase(BaseModel):
    """Base model for story bible entries."""
    category: StoryBibleCategory
    name: str
    details: Dict[str, Any] = Field(default_factory=dict)


class StoryBibleEntryCreate(StoryBibleEntryBase):
    """Model for creating a story bible entry."""
    introduced_at: int = 1


class StoryBibleEntryUpdate(BaseModel):
    """Model for updating a story bible entry."""
    name: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class StoryBibleEntryResponse(StoryBibleEntryBase):
    """Response model for story bible entry."""
    id: int
    rolling_story_id: int
    introduced_at: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============= Story Event Models =============

class StoryEventBase(BaseModel):
    """Base model for story events."""
    event_type: StoryEventType
    summary: str


class StoryEventCreate(StoryEventBase):
    """Model for creating a story event."""
    paragraph_sequence: int
    resolved: bool = False


class StoryEventResponse(StoryEventBase):
    """Response model for story event."""
    id: int
    rolling_story_id: int
    paragraph_sequence: int
    resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============= Story Paragraph Models =============

class StoryParagraphBase(BaseModel):
    """Base model for story paragraphs."""
    content: str


class StoryParagraphCreate(StoryParagraphBase):
    """Model for creating a story paragraph."""
    sequence: int


class StoryParagraphResponse(StoryParagraphBase):
    """Response model for story paragraph."""
    id: int
    rolling_story_id: int
    sequence: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============= Choice Models =============

class Choice(BaseModel):
    """Model for a story choice with dynamic label."""
    label: str  # Short action label (2-5 words), e.g., "Pull the trigger"
    description: str  # Longer description of the action


# ============= Rolling Story Models =============

class RollingStoryBase(BaseModel):
    """Base model for rolling stories."""
    title: str
    scenario_id: str


class RollingStoryCreate(RollingStoryBase):
    """Model for creating a rolling story."""
    pass


class RollingStoryUpdate(BaseModel):
    """Model for updating a rolling story."""
    title: Optional[str] = None
    status: Optional[RollingStoryStatus] = None


class RollingStoryResponse(RollingStoryBase):
    """Response model for rolling story."""
    id: int
    user_id: str
    status: RollingStoryStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RollingStoryDetailResponse(RollingStoryResponse):
    """Detailed response model for rolling story with paragraphs."""
    paragraphs: List[StoryParagraphResponse] = []
    bible: List[StoryBibleEntryResponse] = []
    events: List[StoryEventResponse] = []


class RollingStoryListItem(BaseModel):
    """List item model for rolling stories."""
    id: int
    title: str
    scenario_id: str
    status: RollingStoryStatus
    paragraph_count: int
    created_at: datetime
    updated_at: datetime


# ============= Generation Request/Response Models =============

class GenerateRequest(BaseModel):
    """Request model for generating paragraphs."""
    bible: List[Dict[str, Any]] = Field(default_factory=list)
    events: List[Dict[str, Any]] = Field(default_factory=list)
    chosen_action: Optional[str] = None  # The label of the chosen action
    chosen_action_description: Optional[str] = None
    storyline_influence: Optional[str] = Field(
        default=None,
        description="User's input to influence the story direction (e.g., 'focus on the mystery', 'add more action')"
    )
    paragraph_count: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Number of paragraphs to generate (1-10)"
    )
    choice_count: int = Field(
        default=3,
        ge=2,
        le=5,
        description="Number of choices to generate (2-5)"
    )


class GenerateResponse(BaseModel):
    """Response model for paragraph generation."""
    paragraphs: List[StoryParagraphResponse]
    bible_updates: List[StoryBibleEntryResponse]
    event_updates: List[StoryEventResponse]
    choices: List[Choice]
