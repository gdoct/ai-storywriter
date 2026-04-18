"""
State definitions for the Long Story Agent.

The agent runs a linear pipeline:
  generate_synopsis → generate_arc → (per chapter) generate_storyline → stream_chapter → loop/end
"""
from typing import TypedDict, List, Dict, Any, Optional, Callable


class ChapterArcItem(TypedDict, total=False):
    """A single item in the story arc."""
    chapter_number: int   # 1-based
    title: str
    one_liner: str


class ChapterStoryline(TypedDict, total=False):
    """The abstract storyline for one chapter."""
    chapter_number: int
    title: str
    setup: str        # Intro / setup section
    main_event: str   # Core event of the chapter
    conclusion: str   # How the chapter ends / sets up the next


class LongStoryState(TypedDict, total=False):
    """Full state for the Long Story generation pipeline."""

    # ── Identity ──────────────────────────────────────────────────────────────
    story_id: int
    user_id: str
    scenario: Dict[str, Any]    # Full scenario dict with jsondata, characters, etc.

    # ── Generated structures ──────────────────────────────────────────────────
    synopsis: Optional[str]
    story_arc: List[ChapterArcItem]         # [{chapter_number, title, one_liner}]
    chapter_storylines: List[ChapterStoryline]  # built up as chapters are generated

    # ── Loop control ──────────────────────────────────────────────────────────
    current_chapter_index: int      # 0-based index into story_arc
    total_chapters: int

    # ── Per-chapter generation ────────────────────────────────────────────────
    current_storyline: Optional[ChapterStoryline]
    last_chapter_ending: Optional[str]       # last ~800 chars of previous chapter prose
    last_chapter_conclusion: Optional[str]   # storyline conclusion from the previous chapter

    # ── Accumulated output ────────────────────────────────────────────────────
    generated_chapters: List[Dict[str, Any]]   # [{chapter_number, title, content}]

    # ── Streaming ─────────────────────────────────────────────────────────────
    stream_callback: Optional[Callable]  # async callable that receives event dicts

    # ── Control ───────────────────────────────────────────────────────────────
    error: Optional[str]
    complete: bool
