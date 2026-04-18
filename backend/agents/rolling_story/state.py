"""
State definitions for the Rolling Story Agent.

This module defines TypedDicts for the two-node architecture:
- ScenaristDirective: Output from the Scenarist node
- StorySummary: Condensed story history for narrative coherence
- Plus existing state definitions for compatibility
"""
from typing import TypedDict, List, Dict, Any, Optional


# ============= New TypedDicts for Two-Node Architecture =============

class ScenaristDirective(TypedDict, total=False):
    """Authoritative instruction from the Scenarist node.

    The Scenarist decides WHAT happens; the Writer decides HOW it's written.
    """
    instruction: str  # 1-2 sentence directive of what happens next
    focus_elements: List[str]  # Characters, settings, or objects to feature
    tension_direction: str  # "increase", "maintain", or "decrease"
    arc_relevance: str  # How this connects to the story arc


class StorySummary(TypedDict, total=False):
    """Condensed summary of the story so far.

    Maintained across paragraphs to provide narrative context without
    including full paragraph text in every prompt.
    """
    summary_text: str  # Running condensed summary of all paragraphs
    paragraph_count: int  # Total paragraphs incorporated into summary


class UserChoice(TypedDict, total=False):
    """A user choice made during the story."""
    label: str  # Short label for the choice
    description: str  # Longer description of the choice
    advances_arc: bool  # Whether this choice advanced the story arc
    sequence: int  # Paragraph sequence when choice was made


# ============= Legacy TypedDicts (kept for compatibility) =============

class RunningStoryline(TypedDict, total=False):
    """The running storyline that tracks narrative arc and pacing.

    NOTE: This is from the legacy single-node architecture.
    The new architecture uses ScenaristDirective instead.
    """
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

    # Story arc tracking
    current_arc_step: int  # Current step in the story arc (1-based)
    should_advance_arc: bool  # Whether to advance to the next arc step this cycle

    # Running storyline - tracks narrative arc across paragraphs (legacy)
    storyline: Optional[RunningStoryline]

    # NEW: Two-node architecture state
    story_summary: Optional[str]  # Condensed summary of story so far
    scenarist_directive: Optional[ScenaristDirective]  # Current directive from Scenarist
    user_action_type: str  # "extend_scene" or "progress_story"
    all_user_choices: List[UserChoice]  # Complete history of user choices

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
