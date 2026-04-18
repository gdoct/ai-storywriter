"""
Prompt templates for the Rolling Story Agent.

This module contains prompts for the two-node architecture:
- SCENARIST: High-level narrative director (decides WHAT happens)
- WRITER: Prose generator (decides HOW it's written)
- SUMMARY_CONDENSER: Maintains running story summary
- Plus legacy prompts for extraction and choices
"""

# ============= SCENARIST NODE PROMPTS =============

SCENARIST_SYSTEM = """You direct what happens next in the story.

YOUR JOB: Give instructions that follow the SYNOPSIS exactly.

The synopsis is the source of truth. If the synopsis says "Anne wakes up, gets dressed, has breakfast, goes outside, meets neighbor" then:
- First paragraphs: Anne wakes up
- Next: Anne gets dressed
- Next: Anne has breakfast
- Next: Anne goes outside
- Next: Anne meets neighbor

Do NOT add content not in the synopsis:
- No dreams or flashbacks
- No romantic subplots
- No internal struggles about life choices
- No absent lovers or empty chairs
- No philosophy about following dreams

Your instruction should be a simple, concrete action from the synopsis.

OUTPUT FORMAT - Return JSON:
{{"instruction": "Simple action that happens", "focus_elements": ["character"], "sensory_focus": "One sensory detail"}}

Example for "Anne has breakfast":
{{"instruction": "Anne cooks eggs and toast, then sits down to eat at her kitchen table.", "focus_elements": ["Anne", "kitchen"], "sensory_focus": "the sizzle of eggs in the pan"}}"""

SCENARIST_USER = """## SYNOPSIS (follow this exactly)
{synopsis}

## CHARACTERS
{characters}

## CURRENT ARC STEP: {current_step_name}
{current_step_description}

## WHAT HAS HAPPENED SO FAR
{story_summary}

## LAST PARAGRAPH
{last_paragraph}

## USER'S CHOICE (if any)
{user_choice}

---

What is the NEXT simple action from the synopsis that should happen?

Remember: Only actions from the synopsis. No invented drama, dreams, or backstory.

Return JSON: {{"instruction": "simple action", "focus_elements": ["character"], "sensory_focus": "detail"}}"""

# ============= WRITER NODE PROMPTS =============

WRITER_SYSTEM_TEMPLATE = """You are a prose writer executing the Scenarist's directive.

Your job is to:
1. Follow the Scenarist's instruction EXACTLY - write ONLY what it says
2. Write approximately {word_count} words
3. Match the writing style
4. Create continuity from the previous paragraph
5. End at a natural choice point

CRITICAL RULE - STAY FAITHFUL TO THE DIRECTIVE:
The directive tells you exactly what happens. Do NOT add:
- Dreams, memories, or flashbacks not in the directive
- Romantic subplots or relationship drama not specified
- Internal monologues about "following dreams" or life choices
- Past events, ex-lovers, or absent people not mentioned
- Philosophical reflections not in the directive

If the directive says "Anne makes breakfast", write about Anne making breakfast.
Nothing more. No invented backstory. No drama. Just what it says.

WRITING CRAFT:
- Show through sensory details and action
- Include the sensory focus specified
- Vary sentence rhythm
- Avoid clichés and purple prose
- End at a moment where a choice could be made

Output ONLY the paragraph text."""

# Default for backwards compatibility
WRITER_SYSTEM = WRITER_SYSTEM_TEMPLATE.format(word_count=190)


def get_writer_system_prompt(word_count: int = 190) -> str:
    """Get the writer system prompt with the specified word count."""
    return WRITER_SYSTEM_TEMPLATE.format(word_count=word_count)

WRITER_USER = """## Writing Style
{writing_style}

## DIRECTIVE (follow this exactly)
{scenarist_instruction}

## Focus Elements
{focus_elements}

## Sensory Detail to Include
{sensory_focus}

## Previous Paragraph (for continuity)
{last_paragraph}

## Characters/Facts (for consistency)
{bible_text}

Write approximately {word_count} words following the directive exactly.
End at a natural choice point.
Output ONLY the paragraph text."""

# ============= SUMMARY CONDENSER PROMPTS =============

SUMMARY_CONDENSE_SYSTEM = """You maintain a factual summary of what has happened in the story.

CRITICAL RULE: Only summarize what ACTUALLY happened in the paragraphs.
Do NOT add or infer:
- Character motivations not explicitly shown
- Backstory not explicitly stated
- Romantic relationships not described
- Internal struggles not written
- Philosophy or life lessons not in the text

If the paragraph says "Anne made breakfast", summarize it as "Anne made breakfast."
Do NOT add "Anne wrestled with her dreams while making breakfast."

FORMATTING:
**WHAT HAPPENED:** [Factual events in order]
**WHERE:** [Current location]
**WHO:** [Characters present and what they did]

Keep the summary:
- Under 300 words
- Purely factual - only what was explicitly written
- In present tense

Return ONLY the summary text."""

SUMMARY_CONDENSE_USER = """## Current Summary
{current_summary}

## New Paragraph to Incorporate
{new_paragraph}

Update the summary with facts from the new paragraph.

RULES:
- Only include what explicitly happened (actions, dialogue, locations)
- Do NOT interpret emotions or motivations beyond what's stated
- Do NOT add philosophical musings or life lessons
- Keep it factual and brief (under 300 words)

Return ONLY the summary text."""

# ============= ARC EVALUATOR PROMPTS =============

ARC_EVALUATOR_SYSTEM = """You are the Arc Guardian - responsible for ensuring the story follows its defined narrative arc.

When a reader makes a choice, you evaluate whether that choice:
1. STAYS within the current arc step (exploring, deepening, or complicating the current beat)
2. ADVANCES to the next arc step (transitioning the story forward)

Your job is to:
- Understand the current arc step and what it entails
- Understand the next arc step and what would trigger it
- Evaluate the reader's choice against both
- Determine if the choice naturally leads to advancement or stays in current step
- Provide guidance on how to interpret the choice within the arc context

IMPORTANT PRINCIPLES:
- Arc advancement should feel EARNED, not forced
- A choice that partially matches the next step can still stay in current step if setup isn't complete
- Consider the story summary - has enough of the current step been explored?
- Some choices may need to be "bent" to fit the arc (e.g., "run away" during Inciting Incident becomes "flee from the attack")

OUTPUT FORMAT - Return a JSON object:
{{
    "stays_in_step": true/false,
    "new_arc_step": <integer - same as current or current+1>,
    "rationale": "Brief explanation of why this choice stays or advances",
    "modified_action": "How to interpret the choice within the arc context (may be same as original)"
}}"""

ARC_EVALUATOR_USER = """## CURRENT ARC STEP: Step {current_step} - {current_step_name}
{current_step_description}

## NEXT ARC STEP: Step {next_step} - {next_step_name}
{next_step_description}

## STORY SUMMARY (What has happened so far)
{story_summary}

## THE READER'S CHOICE
Label: {choice_label}
Description: {choice_description}

## EVALUATION TASK
Determine if this choice:
1. STAYS in the current arc step (continues exploring Step {current_step})
2. ADVANCES to the next arc step (transitions to Step {next_step})

Consider:
- Does the choice align with elements of the NEXT step? If so, it may advance.
- Has enough of the CURRENT step been explored in the story summary?
- Can the choice be interpreted to fit the current step while building toward the next?

Return ONLY valid JSON with your evaluation."""

# ============= ARC GENERATION/PARSING PROMPTS =============

ARC_PARSER_SYSTEM = """You are a story arc parser. Your job is to convert a story arc written in any format into a structured JSON array.

The input may be in various formats:
- Roman numerals (I, II, III...)
- Numbers (1, 2, 3...)
- Bullet points
- Headers with sub-points
- Plain text paragraphs

OUTPUT FORMAT - Return ONLY a JSON array of steps:
[
    {{"step": 1, "name": "Step Name", "description": "Combined description from sub-points", "locked": false}},
    {{"step": 2, "name": "Next Step Name", "description": "...", "locked": false}},
    ...
]

RULES:
- Extract the step NAME from headers/titles (e.g., "Setup", "Inciting Incident", "Climax")
- Combine all sub-points into a single description string
- Steps must be numbered 1, 2, 3... in order
- "locked" should always be false
- Keep the original meaning and order of steps
- If there are no clear steps, create logical story beats from the content

Return ONLY valid JSON - no explanation, no markdown."""

ARC_PARSER_USER = """Parse this story arc into structured JSON:

{arc_text}

Return ONLY a JSON array of step objects."""

ARC_GENERATOR_SYSTEM = """You are a story arc architect. Your job is to create or improve a structured story arc for an interactive narrative.

A good story arc has:
1. Clear, distinct steps that build upon each other
2. Each step represents a significant narrative beat
3. Steps should be achievable in 2-5 paragraphs each
4. The arc should have 5-8 steps total (not too short, not too long)
5. Each step name should be evocative and memorable
6. Descriptions should be specific enough to guide the story but flexible enough for reader choices

STEP STRUCTURE:
- Step 1: Always the "Setup" - introduce characters, setting, normal world
- Middle steps: Rising action, complications, reveals, turning points
- Final step: Climax and resolution

OUTPUT FORMAT - Return a JSON array of steps:
[
    {{"step": 1, "name": "Setup", "description": "Brief but specific description of what happens in this step", "locked": false}},
    {{"step": 2, "name": "Inciting Incident", "description": "...", "locked": false}},
    ...
]

IMPORTANT:
- Steps are 1-indexed (start at 1)
- "locked" should always be false when generating (it's set to true as steps are played)
- Keep descriptions to 1-3 sentences each
- Make step names unique and descriptive"""

ARC_GENERATOR_USER = """## Scenario Information
Title: {title}
Synopsis: {synopsis}
Genre: {genre}

## Characters
{characters}

## Existing Story Arc (if any)
{existing_arc}

## Task
{task}

Return ONLY valid JSON - an array of step objects."""

ARC_REGENERATOR_USER = """## Scenario Information
Title: {title}
Synopsis: {synopsis}
Genre: {genre}

## Characters
{characters}

## LOCKED STEPS (These MUST be preserved exactly as-is)
{locked_steps}

## Story Summary (What has happened so far)
{story_summary}

## Current Step Being Played
Step {current_step}: {current_step_name}
{current_step_description}

## Reason for Regeneration
{regeneration_reason}

## Task
Generate new steps from step {from_step} onwards that:
1. Flow naturally from the locked steps and current story
2. Account for the direction the story has taken
3. Still lead toward a satisfying conclusion
4. Have 3-5 remaining steps (adjust based on story progress)

Return ONLY valid JSON - an array of step objects starting from step {from_step}."""

# ============= LEGACY PROMPTS (kept for compatibility) =============

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
- If there's a USER DIRECTION in the storyline, you MUST incorporate it into this paragraph

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

CHOICES_SYSTEM = """Generate choices for an interactive story based on the current situation.

RULES:
1. Choices must fit the CURRENT ARC STEP - don't jump ahead in the story
2. Choices must relate to what just happened in the paragraph
3. One choice should advance to the NEXT ARC STEP
4. Other choices should stay in the current step (explore, deepen, react)

OUTPUT FORMAT - Return JSON:
{{"choices": [
  {{"label": "Short label", "description": "What happens", "advances_arc": false}},
  {{"label": "Another choice", "description": "What happens", "advances_arc": true}}
]}}

Keep labels short (2-5 words). Keep descriptions to 1 sentence."""

CHOICES_USER = """## SCENARIO: {scenario_title}

## CURRENT ARC STEP: Step {current_arc_step} - {current_step_name}
{current_step_description}

## NEXT ARC STEP: Step {next_arc_step} - {next_step_name}
{next_step_description}

## LAST PARAGRAPH (choices must respond to this)
{last_paragraph}

## CHARACTERS
{bible_text}

Generate exactly {choice_count} choices:
- 1-2 choices that STAY in the current step ({current_step_name}) with "advances_arc": false
- 1 choice that would ADVANCE to the next step ({next_step_name}) with "advances_arc": true

Return ONLY valid JSON. Example:
{{"choices": [{{"label": "Confront them directly", "description": "Demand the truth, risking their anger", "advances_arc": false, "choice_category": "stay_in_step"}}, {{"label": "Follow the trail", "description": "Push forward toward the mystery's source", "advances_arc": true, "choice_category": "advance_arc"}}]}}"""


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


def format_events_for_prompt(events: list, limit: int = 20) -> str:
    """Format story events for inclusion in prompts.

    Separates unresolved threads from resolved events to help the LLM
    maintain narrative coherence.

    Args:
        events: List of story events
        limit: Maximum total events to include (distributed across categories)
    """
    if not events:
        return "Story is just beginning."

    # Separate resolved and unresolved events
    unresolved = []
    resolved = []
    user_choices = []

    for event in events:
        event_type = event.get("event_type", "event")
        summary = event.get("summary", "")
        is_resolved = event.get("resolved", False)

        if event_type == "user_choice":
            user_choices.append(summary)
        elif is_resolved:
            resolved.append(f"- {summary}")
        else:
            unresolved.append(f"- [{event_type}] {summary}")

    # Distribute limit across categories (prioritize unresolved)
    unresolved_limit = min(len(unresolved), limit // 2)
    resolved_limit = min(len(resolved), limit // 3)
    choices_limit = min(len(user_choices), limit // 4)

    sections = []

    # Always show unresolved threads prominently
    if unresolved:
        sections.append("**UNRESOLVED THREADS (develop these):**")
        sections.extend(unresolved[-unresolved_limit:] if unresolved_limit > 0 else unresolved[-8:])

    # Show recent resolved events for context
    if resolved:
        sections.append("\n**RECENT EVENTS:**")
        sections.extend(resolved[-resolved_limit:] if resolved_limit > 0 else resolved[-7:])

    # Show user choices that shaped the story
    if user_choices:
        sections.append("\n**READER CHOICES (these shaped the story):**")
        sections.extend([f"- {c}" for c in user_choices[-choices_limit:]] if choices_limit > 0 else [f"- {c}" for c in user_choices[-5:]])

    return "\n".join(sections) if sections else "Story is just beginning."


def format_scenario_for_prompt(scenario: dict, current_arc_step: int = 1) -> str:
    """Format scenario for inclusion in prompts.

    Args:
        scenario: The scenario dict containing jsondata
        current_arc_step: The current step in the story arc (1-based)
    """
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

    # Writing style - can be a string or an object with style/genre/tone
    writing_style = jsondata.get("writingStyle")
    if writing_style:
        if isinstance(writing_style, dict):
            style_parts = []
            if writing_style.get("style"):
                style_parts.append(f"Style: {writing_style['style']}")
            if writing_style.get("genre"):
                style_parts.append(f"Genre: {writing_style['genre']}")
            if writing_style.get("tone"):
                style_parts.append(f"Tone: {writing_style['tone']}")
            if writing_style.get("theme"):
                style_parts.append(f"Theme: {writing_style['theme']}")
            if style_parts:
                parts.append(f"**Writing Style:** {', '.join(style_parts)}")
        else:
            parts.append(f"**Writing Style:** {writing_style}")

    if jsondata.get("genre"):
        parts.append(f"**Genre:** {jsondata['genre']}")

    # Backstory - important context for the story world
    if jsondata.get("backstory"):
        parts.append(f"\n**Backstory/World Context:**\n{jsondata['backstory']}")

    # Characters - critical for the Scenarist to know who is in the story
    characters = jsondata.get("characters", [])
    if characters:
        parts.append("\n**Characters:**")
        for char in characters:
            if not char.get("name"):
                continue
            char_lines = [f"- **{char['name']}**"]
            if char.get("alias"):
                char_lines[0] += f" (also known as: {char['alias']})"
            if char.get("role"):
                char_lines.append(f"  Role: {char['role']}")
            if char.get("gender"):
                char_lines.append(f"  Gender: {char['gender']}")
            if char.get("appearance"):
                char_lines.append(f"  Appearance: {char['appearance']}")
            if char.get("backstory"):
                char_lines.append(f"  Background: {char['backstory']}")
            if char.get("extraInfo"):
                char_lines.append(f"  Extra: {char['extraInfo']}")
            parts.append("\n".join(char_lines))

    # Locations - important settings for the story
    locations = jsondata.get("locations", [])
    if locations:
        parts.append("\n**Locations:**")
        for loc in locations:
            if not loc.get("name"):
                continue
            loc_lines = [f"- **{loc['name']}**"]
            if loc.get("visualDescription"):
                loc_lines.append(f"  Description: {loc['visualDescription']}")
            if loc.get("background"):
                loc_lines.append(f"  Background: {loc['background']}")
            if loc.get("extraInfo"):
                loc_lines.append(f"  Extra: {loc['extraInfo']}")
            parts.append("\n".join(loc_lines))

    # Include story arc with current step indicator
    if jsondata.get("storyarc"):
        storyarc = jsondata["storyarc"]
        parts.append(f"\n**Story Arc (Currently at Step {current_arc_step}):**")
        parts.append(storyarc)
        parts.append(f"\n*Note: The story is currently at step {current_arc_step} of the arc. Progress through the arc naturally based on story events.*")

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
6. Arc progression readiness - Whether the story is ready to advance to the next step of the story arc

STORY ARC AWARENESS:
- If a story arc is provided, track which step the story is currently at
- Consider whether story events have completed the current arc step
- Indicate if the story is ready to progress to the next arc step
- The arc_ready field should be true only when the current step's events have been sufficiently explored

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

## Story Arc Progression
{arc_context}

Analyze the story state and provide the running storyline as JSON:
{{
    "current_situation": "A 1-2 sentence summary of where we are right now",
    "tension_level": "low|building|high|climax|resolving",
    "active_threads": ["thread1", "thread2"],
    "next_beat": "What should happen in the next 2-3 paragraphs",
    "pacing_notes": "Guidance on pacing for the upcoming paragraphs",
    "arc_ready": true|false,
    "arc_notes": "Brief note on story arc progress - what has been accomplished and what remains in the current step"
}}

Return ONLY the JSON, no other text."""


def format_storyline_for_prompt(storyline: dict) -> str:
    """Format the running storyline for inclusion in paragraph generation prompts."""
    if not storyline:
        return "No running storyline yet - this is the beginning of the story."

    parts = []

    # Put user direction FIRST and make it prominent - this is what the user specifically asked for
    if storyline.get("user_influence"):
        parts.append(f"**IMPORTANT - USER DIRECTION (must incorporate this):** {storyline['user_influence']}")
        parts.append("")  # Add blank line for emphasis

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

    # Include story arc progression notes
    if storyline.get("arc_notes"):
        parts.append(f"**Story Arc Progress:** {storyline['arc_notes']}")

    return "\n".join(parts) if parts else "Story is just beginning."


# ============= New Helper Functions for Two-Node Architecture =============

def format_all_choices_for_prompt(choices: list) -> str:
    """Format all user choices made in the story for the Scenarist prompt.

    These choices represent the reader's agency and MUST influence the story direction.
    Each choice should have ongoing consequences.
    """
    if not choices:
        return "No choices made yet - story is beginning. The protagonist's character will be defined by the choices the reader makes."

    lines = ["The reader has made these choices, shaping who the protagonist is and where the story goes:\n"]

    for i, choice in enumerate(choices, 1):
        label = choice.get("label", "Choice")
        description = choice.get("description", "")
        advances = choice.get("advances_arc", False)

        line = f"{i}. **{label}**"
        if description:
            line += f" - {description}"
        if advances:
            line += " *(major turning point)*"
        lines.append(line)

    lines.append("\n**IMPORTANT:** These choices define the protagonist's character and values. "
                 "The story should reflect the pattern of choices made - a protagonist who chose "
                 "caution should not suddenly become reckless without reason. Choices should have "
                 "ongoing consequences, not just immediate effects.")

    return "\n".join(lines)


def extract_writing_style(scenario: dict) -> str:
    """Extract writing style from scenario for the Writer prompt."""
    jsondata = scenario.get("jsondata", "{}")
    if isinstance(jsondata, str):
        import json
        try:
            jsondata = json.loads(jsondata)
        except:
            jsondata = {}

    style_parts = []

    # Writing style can be a string or an object with style/genre/tone/theme
    writing_style = jsondata.get("writingStyle")
    if writing_style:
        if isinstance(writing_style, dict):
            if writing_style.get("style"):
                style_parts.append(f"**Style:** {writing_style['style']}")
            if writing_style.get("genre"):
                style_parts.append(f"**Genre:** {writing_style['genre']}")
            if writing_style.get("tone"):
                style_parts.append(f"**Tone:** {writing_style['tone']}")
            if writing_style.get("theme"):
                style_parts.append(f"**Theme:** {writing_style['theme']}")
            if writing_style.get("communicationStyle"):
                style_parts.append(f"**Communication Style:** {writing_style['communicationStyle']}")
            if writing_style.get("other"):
                style_parts.append(f"**Other Notes:** {writing_style['other']}")
            if writing_style.get("language"):
                style_parts.append(f"**Language:** {writing_style['language']}")
        else:
            style_parts.append(f"**Style:** {writing_style}")

    # Fallback to top-level genre if not in writingStyle object
    if jsondata.get("genre") and not (isinstance(writing_style, dict) and writing_style.get("genre")):
        style_parts.append(f"**Genre:** {jsondata['genre']}")

    # Add any additional style notes from the scenario
    if jsondata.get("styleNotes"):
        style_parts.append(f"**Notes:** {jsondata['styleNotes']}")

    return "\n".join(style_parts) if style_parts else "Write in an engaging, vivid prose style appropriate to the genre."


def extract_arc_text(scenario: dict) -> str:
    """Extract story arc text from scenario for the Scenarist prompt."""
    jsondata = scenario.get("jsondata", "{}")
    if isinstance(jsondata, str):
        import json
        try:
            jsondata = json.loads(jsondata)
        except:
            jsondata = {}

    storyarc = jsondata.get("storyarc", "")
    if not storyarc:
        return "No story arc defined for this scenario."

    return storyarc


def parse_story_arc(storyarc: str) -> list:
    """Parse story arc text into structured steps.

    The story arc format uses bullet points with bold step names:
    • **Step Name**
      • Sub-point describing the step
      • Another sub-point

    Returns:
        List of dicts (1-indexed for LLM clarity): [
            {"step": 1, "name": "Setup", "description": "Introduce protagonist...", "locked": false},
            {"step": 2, "name": "Inciting Incident", "description": "Village attacked...", "locked": false},
            ...
        ]
    """
    import re

    if not storyarc:
        return []

    steps = []
    current_step = None
    current_description_lines = []

    lines = storyarc.strip().split('\n')

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Check for main step header: • **Step Name** or - **Step Name** or numbered like "1. **Step Name**"
        main_step_match = re.match(r'^(?:[•\-\*]|\d+\.?)\s*\*\*([^*]+)\*\*\s*$', line)
        if main_step_match:
            # Save previous step if exists
            if current_step:
                current_step["description"] = ' '.join(current_description_lines).strip()
                steps.append(current_step)
                current_description_lines = []

            step_name = main_step_match.group(1).strip()
            current_step = {
                "step": len(steps) + 1,  # 1-indexed for LLM clarity
                "name": step_name,
                "description": "",
                "locked": False
            }
        elif current_step:
            # This is a sub-point or description line
            # Remove bullet markers and clean up
            clean_line = re.sub(r'^[•\-\*]\s*', '', line).strip()
            if clean_line:
                current_description_lines.append(clean_line)

    # Don't forget the last step
    if current_step:
        current_step["description"] = ' '.join(current_description_lines).strip()
        steps.append(current_step)

    return steps


def normalize_structured_arc(arc: list) -> list:
    """Normalize a structured arc to ensure consistent format.

    - Ensures steps are 1-indexed (for LLM clarity)
    - Ensures all required fields exist
    - Fixes step numbering if needed

    Args:
        arc: List of step dicts (may be in various formats)

    Returns:
        Normalized list of step dicts (1-indexed)
    """
    if not arc:
        return []

    normalized = []
    for i, step in enumerate(arc):
        normalized.append({
            "step": i + 1,  # 1-indexed for LLM clarity
            "name": step.get("name", f"Step {i + 1}"),
            "description": step.get("description", ""),
            "locked": step.get("locked", False)
        })

    return normalized


def get_arc_step_info(scenario: dict, step_number: int, structured_arc: list = None) -> dict:
    """Get information about a specific arc step.

    Args:
        scenario: The scenario dict containing jsondata (fallback if no structured_arc)
        step_number: 1-based step number (step 1 is the first step)
        structured_arc: Optional pre-parsed structured arc list (1-indexed)

    Returns:
        {
            "name": "Step Name",
            "description": "Step description...",
            "is_last": True/False,
            "total_steps": int,
            "locked": True/False
        }
    """
    # Use structured arc if provided, otherwise parse from scenario
    if structured_arc:
        steps = structured_arc
    else:
        storyarc = extract_arc_text(scenario)
        if storyarc == "No story arc defined for this scenario.":
            return {"name": "No Arc", "description": "No story arc defined.", "is_last": True, "total_steps": 0, "locked": False}
        steps = parse_story_arc(storyarc)

    if not steps:
        return {"name": "No Arc", "description": "Could not parse story arc.", "is_last": True, "total_steps": 0, "locked": False}

    # Convert 1-based step_number to 0-based index, clamped to valid range
    step_index = max(0, min(step_number - 1, len(steps) - 1))
    step = steps[step_index]

    return {
        "name": step.get("name", f"Step {step_number}"),
        "description": step.get("description", ""),
        "is_last": step_index >= len(steps) - 1,
        "total_steps": len(steps),
        "locked": step.get("locked", False)
    }


def get_next_arc_step_info(scenario: dict, current_step: int, structured_arc: list = None) -> dict:
    """Get information about the next arc step (for preview in choices).

    Args:
        scenario: The scenario dict containing jsondata (fallback if no structured_arc)
        current_step: 1-based current step number
        structured_arc: Optional pre-parsed structured arc list (1-indexed)

    Returns:
        {
            "name": "Next Step Name",
            "description": "Next step description...",
            "exists": True/False
        }
    """
    # Use structured arc if provided, otherwise parse from scenario
    if structured_arc:
        steps = structured_arc
    else:
        storyarc = extract_arc_text(scenario)
        if storyarc == "No story arc defined for this scenario.":
            return {"name": "N/A", "description": "", "exists": False}
        steps = parse_story_arc(storyarc)

    if not steps:
        return {"name": "N/A", "description": "", "exists": False}

    # current_step is 1-based, so next step index is current_step (since array is 0-based)
    next_index = current_step  # e.g., if current_step=1, next is at index 1 (step 2)
    if next_index >= len(steps):
        return {"name": "Story Complete", "description": "The story arc has been completed.", "exists": False}

    next_step = steps[next_index]
    return {
        "name": next_step.get("name", f"Step {current_step + 1}"),
        "description": next_step.get("description", ""),
        "exists": True
    }
