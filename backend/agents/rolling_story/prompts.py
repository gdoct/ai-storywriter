"""
Prompt templates for the Rolling Story Agent.
"""

PARAGRAPH_GENERATION_SYSTEM = """You are a creative story writer continuing an interactive narrative.
Write engaging, vivid prose that advances the story while maintaining consistency with established facts and events.

IMPORTANT - OUTPUT FORMAT:
- Write ONE complete paragraph of approximately 300 words, 5-7 sentences
- You MUST complete the entire paragraph - do not stop mid-sentence or mid-thought
- Output ONLY the paragraph text - no titles, headers, or meta-commentary

WRITING GUIDELINES:
- Show, don't tell - use sensory details, dialogue, and action
- Each paragraph should focus on ONE small moment or beat
- Continue directly from where the last paragraph ended - do not skip ahead
- If there's a Running Storyline, follow its guidance on pacing and next beats

TENSION AND PACING:
- Gradually build tension throughout the paragraphs in this cycle
- Each paragraph should escalate stakes or deepen conflict slightly
- The FINAL paragraph must end at a critical decision point or cliffhanger
- The cliffhanger should present a moment where the protagonist faces a choice
- Leave the reader at a point where multiple clear paths forward are possible"""

PARAGRAPH_GENERATION_USER = """## Scenario
{scenario_text}

## Story Bible (Established Facts)
{bible_text}

## Running Storyline
{storyline_text}

## Recent Story Events
{events_text}

## Recent Paragraphs (for continuity)
{recent_paragraphs}

{choice_context}

## Current Paragraph Number: {paragraph_number} of {total_paragraphs}
{final_paragraph_instruction}

Write the next paragraph of the story (200-300 words, 5-7 sentences). Complete the entire paragraph - do not leave any sentence unfinished. Return ONLY the paragraph text."""

EXTRACTION_SYSTEM = """You are a story analyst extracting structured information from narrative text.
Analyze the given paragraph and extract any new or updated information.

Return a JSON object with the following structure:
{{
    "bible_updates": [
        {{
            "category": "character|setting|object",
            "name": "entity name",
            "details": {{"key": "value"}},
            "is_new": true|false
        }}
    ],
    "events": [
        {{
            "event_type": "key_event|decision|consequence|unresolved",
            "summary": "brief description of what happened"
        }}
    ]
}}

Only include entries if there is genuinely new information to extract.
For characters, track: name, description, relationships, traits, current state.
For settings, track: name, description, atmosphere, notable features.
For objects, track: name, description, properties, current location/owner.
For events, focus on significant plot developments, not mundane actions."""

EXTRACTION_USER = """## Existing Story Bible
{bible_text}

## New Paragraph
{paragraph}

Extract any new or updated information from this paragraph. Return valid JSON only."""

CHOICES_SYSTEM = """You are a story choice generator for an interactive narrative.
Based on the current story state (especially the cliffhanger moment), generate meaningful choices for the reader.

Each choice should:
- Be a specific, concrete action the protagonist can take at THIS EXACT MOMENT
- Directly address the cliffhanger situation presented in the last paragraph
- Lead to meaningfully different story directions
- Have a short, punchy label (2-5 words) that captures the essence of the action
- Have a description (1-2 sentences) explaining what happens if this choice is made

IMPORTANT: The choices must be relevant to the specific situation. For example:
- If the protagonist is pointing a gun: "Pull the trigger", "Lower the weapon", "Hesitate"
- If they're at a crossroads: "Take the left path", "Turn back", "Wait and observe"
- If confronted by someone: "Attack first", "Try to negotiate", "Attempt to flee"

Return a JSON object with exactly {choice_count} choices:
{{
    "choices": [
        {{
            "label": "Short action label",
            "description": "What happens if this choice is made"
        }}
    ]
}}"""

CHOICES_USER = """## Story Summary
{scenario_title}

## Story Bible
{bible_text}

## Recent Events
{events_text}

## Last Paragraph (ends in a cliffhanger)
{last_paragraph}

Generate exactly {choice_count} distinct choices for what the protagonist should do at this critical moment. Each choice must directly address the situation in the last paragraph. Return valid JSON only."""


def format_bible_for_prompt(bible: list) -> str:
    """Format story bible entries for inclusion in prompts."""
    if not bible:
        return "No established facts yet."

    sections = {"character": [], "setting": [], "object": []}
    for entry in bible:
        category = entry.get("category", "character")
        name = entry.get("name", "Unknown")
        details = entry.get("details", {})
        detail_text = ", ".join(f"{k}: {v}" for k, v in details.items()) if details else "No details"
        sections[category].append(f"- {name}: {detail_text}")

    result = []
    if sections["character"]:
        result.append("**Characters:**\n" + "\n".join(sections["character"]))
    if sections["setting"]:
        result.append("**Settings:**\n" + "\n".join(sections["setting"]))
    if sections["object"]:
        result.append("**Objects:**\n" + "\n".join(sections["object"]))

    return "\n\n".join(result) if result else "No established facts yet."


def format_events_for_prompt(events: list, limit: int = 10) -> str:
    """Format story events for inclusion in prompts."""
    if not events:
        return "Story is just beginning."

    # Take most recent events
    recent = events[-limit:] if len(events) > limit else events
    lines = []
    for event in recent:
        event_type = event.get("event_type", "event")
        summary = event.get("summary", "")
        resolved = " (resolved)" if event.get("resolved") else ""
        lines.append(f"- [{event_type}] {summary}{resolved}")

    return "\n".join(lines)


def format_scenario_for_prompt(scenario: dict) -> str:
    """Format scenario for inclusion in prompts."""
    jsondata = scenario.get("jsondata", "{}")
    if isinstance(jsondata, str):
        import json
        try:
            jsondata = json.loads(jsondata)
        except:
            jsondata = {}

    parts = []
    if jsondata.get("title"):
        parts.append(f"**Title:** {jsondata['title']}")
    if jsondata.get("synopsis"):
        parts.append(f"**Synopsis:** {jsondata['synopsis']}")
    if jsondata.get("writingStyle"):
        parts.append(f"**Writing Style:** {jsondata['writingStyle']}")
    if jsondata.get("genre"):
        parts.append(f"**Genre:** {jsondata['genre']}")

    return "\n".join(parts) if parts else "An interactive story."


# ============= Running Storyline Prompts =============

STORYLINE_SYSTEM = """You are a story planner analyzing narrative progress and planning the next story beats.
Your job is to track the "running storyline" - the current state of the narrative that guides paragraph generation.

You will analyze the story so far and produce a structured storyline update that includes:
1. Current situation - What's happening right now
2. Tension level - low, building, high, climax, or resolving
3. Active threads - Plot points currently in play
4. Next beat - What should happen in the next few paragraphs
5. Pacing notes - Whether to slow down, speed up, or maintain pace

This running storyline ensures paragraphs flow into each other and the story maintains proper pacing."""

STORYLINE_USER = """## Scenario
{scenario_text}

## Story Bible
{bible_text}

## Events So Far
{events_text}

## Last Paragraphs
{recent_paragraphs}

## User's Chosen Action (if any)
{choice_context}

## User's Storyline Influence (if any)
{user_influence}

Analyze the story state and provide the running storyline as JSON:
{{
    "current_situation": "A 1-2 sentence summary of where we are right now",
    "tension_level": "low|building|high|climax|resolving",
    "active_threads": ["thread1", "thread2"],
    "next_beat": "What should happen in the next 2-3 paragraphs",
    "pacing_notes": "Guidance on pacing for the upcoming paragraphs"
}}

Return ONLY the JSON, no other text."""


def format_storyline_for_prompt(storyline: dict) -> str:
    """Format the running storyline for inclusion in paragraph generation prompts."""
    if not storyline:
        return "No running storyline yet - this is the beginning of the story."

    parts = []
    if storyline.get("current_situation"):
        parts.append(f"**Current Situation:** {storyline['current_situation']}")
    if storyline.get("tension_level"):
        parts.append(f"**Tension Level:** {storyline['tension_level']}")
    if storyline.get("active_threads"):
        threads = ", ".join(storyline["active_threads"])
        parts.append(f"**Active Threads:** {threads}")
    if storyline.get("next_beat"):
        parts.append(f"**Next Beat:** {storyline['next_beat']}")
    if storyline.get("pacing_notes"):
        parts.append(f"**Pacing:** {storyline['pacing_notes']}")
    if storyline.get("user_influence"):
        parts.append(f"**User Direction:** {storyline['user_influence']}")

    return "\n".join(parts) if parts else "Story is just beginning."
