"""
Response models for Story Generator Agent
"""

from typing import Optional, Dict, Any, Literal
from pydantic import BaseModel


class ProcessingSummary(BaseModel):
    """Summary of processing completed"""
    nodes_processed: int
    characters: int
    locations: int
    timeline_events: int
    has_backstory: bool
    has_storyarc: bool
    has_notes: bool
    has_custom_prompts: bool
    has_fill_in: bool


class StoryGenerationResponse(BaseModel):
    """Response for non-streaming story generation"""
    success: bool
    story: Optional[str] = None
    processing_summary: Optional[ProcessingSummary] = None
    credits_used: int = 0
    error: Optional[str] = None


class StoryStreamingEvent(BaseModel):
    """Streaming event for story generation progress"""
    type: Literal["status", "progress", "content", "complete", "error", "stream_end"]
    message: Optional[str] = None
    step: Optional[str] = None
    progress: Optional[float] = None
    content: Optional[str] = None  # For streaming content chunks
    story: Optional[str] = None  # For complete story in 'complete' event
    total_tokens: Optional[int] = None
    credits_used: Optional[int] = None
    processing_summary: Optional[ProcessingSummary] = None
    error: Optional[str] = None

    class Config:
        use_enum_values = True