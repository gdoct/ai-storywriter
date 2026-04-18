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
    advances_arc: bool = False  # Whether this choice advances to the next story arc step


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
    current_arc_step: int = 1  # Current step in the story arc


class RollingStoryListItem(BaseModel):
    """List item model for rolling stories."""
    id: int
    title: str
    scenario_id: str
    status: RollingStoryStatus
    paragraph_count: int
    created_at: datetime
    updated_at: datetime


# ============= Action Type Enum =============

class ActionType(str, Enum):
    """Type of generation action for the two-node architecture."""
    EXTEND_SCENE = "extend_scene"  # Add depth/detail to current moment
    PROGRESS_STORY = "progress_story"  # Move to next beat of narrative


# ============= Generation Request/Response Models =============

class GenerateRequest(BaseModel):
    """Request model for generating paragraphs."""
    bible: List[Dict[str, Any]] = Field(default_factory=list)
    events: List[Dict[str, Any]] = Field(default_factory=list)
    chosen_action: Optional[str] = None  # The label of the chosen action
    chosen_action_description: Optional[str] = None
    advances_arc: bool = Field(
        default=False,
        description="Whether the chosen action advances to the next story arc step"
    )
    storyline_influence: Optional[str] = Field(
        default=None,
        description="User's input to influence the story direction (e.g., 'focus on the mystery', 'add more action')"
    )
    paragraph_word_count: int = Field(
        default=250,
        ge=50,
        le=600,
        description="Target word count for the paragraph (50-600)"
    )
    choice_count: int = Field(
        default=3,
        ge=0,
        le=5,
        description="Number of choices to generate (0 for auto mode, 2-5 for interactive)"
    )
    action_type: ActionType = Field(
        default=ActionType.PROGRESS_STORY,
        description="Type of action: 'extend_scene' adds detail to current moment, 'progress_story' advances the narrative"
    )
    use_v2: bool = Field(
        default=True,
        description="Use the new two-node Scenarist/Writer architecture (v2)"
    )


class GenerateResponse(BaseModel):
    """Response model for paragraph generation."""
    paragraphs: List[StoryParagraphResponse]
    bible_updates: List[StoryBibleEntryResponse]
    event_updates: List[StoryEventResponse]
    choices: List[Choice]
    current_arc_step: int = 1  # Current step in the story arc
    arc_ready: bool = False  # Whether the story is ready to advance to the next arc step
