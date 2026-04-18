"""
Prompt templates for the Long Story Agent.

Pipeline:
  1. Synopsis       - 2-3 sentence story overview
  2. Story Arc      - JSON list of chapters [{chapter_number, title, one_liner}]
  3. Chapter Storyline - JSON {setup, main_event, conclusion} for one chapter
  4. Chapter Text   - Full prose for one chapter (streamed)
"""
import json

# ── 1. SYNOPSIS ───────────────────────────────────────────────────────────────

SYNOPSIS_SYSTEM = """You write a concise story synopsis based on the provided scenario.

The synopsis is 2-3 sentences that summarise:
- Who the protagonist is and their situation
- What their core goal or journey is
- How the story roughly resolves (general direction, not spoilers)

Write ONLY the synopsis text. No title, no preamble, no bullet points."""

SYNOPSIS_USER = """## Scenario Title
{title}

## Description
{description}

## Writing Style
{writing_style}

## Characters
{characters}

## Story Arc (if defined)
{story_arc}

---

Write a 2-3 sentence synopsis for this story."""


# ── 2. STORY ARC ──────────────────────────────────────────────────────────────

ARC_SYSTEM = """You create a structured chapter-by-chapter story arc in JSON format.

Each chapter gets:
- A concise title (3-7 words)
- A one-liner describing what happens in that chapter (1 sentence)

Rules:
- Generate between 5 and 8 chapters
- Each chapter must advance the narrative meaningfully
- The final chapter should resolve the story
- Follow the story arc guidance if provided; otherwise invent a satisfying arc
- Output ONLY valid JSON, nothing else

Output format:
[
  {"chapter_number": 1, "title": "Chapter Title", "one_liner": "What happens in this chapter."},
  ...
]"""

ARC_USER = """## Synopsis
{synopsis}

## Scenario Title
{title}

## Writing Style
{writing_style}

## Characters
{characters}

## Story Arc Guidance (if defined)
{story_arc}

---

Generate a chapter-by-chapter story arc as JSON. Output ONLY the JSON array."""


# ── 3. CHAPTER STORYLINE ─────────────────────────────────────────────────────

STORYLINE_SYSTEM = """You create an abstract chapter storyline that guides prose generation.

The storyline has three parts:
- setup: How the chapter opens — this MUST continue directly from where the previous chapter ended. Reference the specific situation, location, or moment the characters were in.
- main_event: The core event or turning point of the chapter (1-2 sentences)
- conclusion: How the chapter ends and what it sets up for the next (1 sentence)

Rules:
- Stay at a high level — do NOT write dialogue or detailed prose
- Be specific about what happens (who does what)
- The SETUP must feel like a direct continuation — not a new beginning
- The conclusion should flow naturally into the next chapter
- Output ONLY valid JSON, nothing else

Output format:
{"setup": "...", "main_event": "...", "conclusion": "..."}"""

STORYLINE_USER = """## Synopsis
{synopsis}

## Chapter {chapter_number}: {chapter_title}
One-liner: {one_liner}

## How the Previous Chapter Ended (storyline)
{previous_conclusion}

## Last Lines of Previous Chapter (prose)
{previous_ending}

## Characters
{characters}

## Full Story Arc (for context)
{full_arc}

---

Generate the abstract storyline for Chapter {chapter_number} as JSON.
CRITICAL: The "setup" field must pick up DIRECTLY from the previous chapter's ending — same scene, same moment, no time skip unless narratively justified."""


# ── 4. CHAPTER PROSE ─────────────────────────────────────────────────────────

CHAPTER_SYSTEM_TEMPLATE = """You write exactly ONE chapter of a multi-chapter story.

Requirements:
- You MUST write at least {word_count} words of prose for this chapter alone
- Write ONLY the events of this single chapter — the story continues in later chapters
- Follow the chapter storyline faithfully: setup → main event → conclusion
- Match the writing style specified
- Write rich narrative prose with dialogue, vivid scene descriptions, and immersive sensory details
- Expand every scene and emotional beat with full literary depth — never rush or summarise
- STOP when you reach this chapter's conclusion. Do NOT write events from future chapters.

SCOPE — THIS IS CRITICAL:
- The "Background" in the user prompt describes the whole story. It is context only — do NOT use it as a script to follow.
- Write only what happens in this chapter's Storyline. Future chapters will be written separately.
- If the background mentions how the story ends, ignore that for now — this chapter does not reach the ending.

CONTINUITY:
- If a previous chapter exists, your first sentence should flow from where that chapter ended
- Do NOT reintroduce characters with backstory already told to the reader
- Avoid explicitly recapping plot events; weave context naturally into the ongoing scene
- Write fresh, vivid descriptions of the setting and atmosphere

Output ONLY the chapter prose. No title, no chapter number heading."""

def get_chapter_system_prompt(word_count: int = 1200) -> str:
    return CHAPTER_SYSTEM_TEMPLATE.format(word_count=word_count)

CHAPTER_USER = """## Your Task
Write Chapter {chapter_number}: {chapter_title}

## This Chapter's Storyline (follow this exactly)
Setup: {setup}
Main Event: {main_event}
Conclusion — STOP HERE: {conclusion}

## Background (context only — do NOT treat this as events to write)
{synopsis}

## Characters
{characters}

## Writing Style
{writing_style}

## How the Previous Chapter Ended (storyline conclusion)
{previous_conclusion}

## Last Lines of Previous Chapter (continue directly from here)
{previous_ending}

---

Write the full prose for Chapter {chapter_number}: {chapter_title}.
{continuity_instruction}
IMPORTANT: Your chapter ends when you reach the conclusion above. Do NOT write beyond it."""


# ── HELPER FUNCTIONS ──────────────────────────────────────────────────────────

def extract_scenario_fields(scenario: dict) -> dict:
    """Extract commonly used fields from a scenario dict."""
    jsondata = scenario.get('jsondata', '{}')
    if isinstance(jsondata, str):
        try:
            jsondata = json.loads(jsondata)
        except Exception:
            jsondata = {}

    title = jsondata.get('title') or scenario.get('title', 'Untitled Story')
    description = jsondata.get('description', '')
    writing_style = _format_writing_style(jsondata.get('writingStyle', {}))
    characters = _format_characters(jsondata.get('characters', []))
    story_arc = jsondata.get('storyarc', '') or ''

    return {
        'title': title,
        'description': description,
        'writing_style': writing_style,
        'characters': characters,
        'story_arc': story_arc,
    }


def _format_writing_style(style: dict | str) -> str:
    if not style:
        return 'No specific style defined.'
    if isinstance(style, str):
        return style
    parts = []
    for key, value in style.items():
        if value:
            parts.append(f"{key}: {value}")
    return '\n'.join(parts) if parts else 'No specific style defined.'


def _format_characters(characters: list) -> str:
    if not characters:
        return 'No characters defined.'
    lines = []
    for char in characters:
        name = char.get('name', 'Unknown')
        role = char.get('role', '')
        desc = char.get('description', '')
        traits = char.get('personality', '') or char.get('traits', '')
        line = f"- {name}"
        if role:
            line += f" ({role})"
        if desc:
            line += f": {desc}"
        if traits:
            line += f". Traits: {traits}"
        lines.append(line)
    return '\n'.join(lines)


def format_arc_for_prompt(arc: list) -> str:
    """Format the story arc list as a readable string."""
    if not arc:
        return 'No arc defined.'
    lines = []
    for item in arc:
        num = item.get('chapter_number', '?')
        title = item.get('title', '')
        one_liner = item.get('one_liner', '')
        lines.append(f"Chapter {num}: {title} — {one_liner}")
    return '\n'.join(lines)
