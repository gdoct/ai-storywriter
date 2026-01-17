"""
State definitions for the Rolling Story Agent.
"""
from typing import TypedDict, List, Dict, Any, Optional


class RunningStoryline(TypedDict, total=False):
    """The running storyline that tracks narrative arc and pacing."""
    current_situation: str  # What's happening right now in the story
    tension_level: str  # low, building, high, climax, resolving
    active_threads: List[str]  # Plot threads currently in play
    next_beat: str  # What should happen next narratively
    pacing_notes: str  # Guidance on pacing (slow down, speed up, maintain)
    user_influence: Optional[str]  # User's input to influence the storyline


class RollingStoryState(TypedDict, total=False):
    """State for the Rolling Story generation graph."""

    # Input context
    story_id: int
    user_id: str
    scenario: Dict[str, Any]  # The source scenario
    bible: List[Dict[str, Any]]  # Story bible entries from frontend
    events: List[Dict[str, Any]]  # Story events from frontend
    chosen_action: Optional[str]  # 'positive', 'negative', 'neutral', or None
    chosen_action_description: Optional[str]  # Description of chosen action

    # Running storyline - tracks narrative arc across paragraphs
    storyline: Optional[RunningStoryline]

    # Generation state
    last_paragraph: Optional[str]  # Most recent paragraph for context
    last_two_paragraphs: List[str]  # Last 2 paragraphs for better context
    current_sequence: int  # Current paragraph sequence number
    paragraphs_generated: int  # Count of paragraphs in this cycle
    target_paragraphs: int  # Target (default 8)

    # LLM configuration
    llm_config: Dict[str, Any]

    # Output accumulation
    generated_paragraphs: List[Dict[str, Any]]  # Paragraphs generated this cycle
    bible_updates: List[Dict[str, Any]]  # New/updated bible entries
    event_updates: List[Dict[str, Any]]  # New events
    choices: List[Dict[str, Any]]  # Generated choices for next cycle

    # Current paragraph being generated
    current_paragraph: Optional[str]
    current_paragraph_bible: List[Dict[str, Any]]
    current_paragraph_events: List[Dict[str, Any]]

    # Streaming - callback for real-time token delivery
    stream_callback: Optional[Any]  # Callable for streaming tokens

    # Streaming events for batch delivery
    streaming_events: List[Dict[str, Any]]

    # Control flow
    error: Optional[str]
    complete: bool
