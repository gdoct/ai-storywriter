"""
Rolling Story Agent - Two-Node Architecture for interactive story generation.

Architecture:
- SCENARIST NODE: High-level narrative director (decides WHAT happens)
- WRITER NODE: Prose generator (decides HOW it's written)

The Scenarist receives the full story context (summary, all choices, scenario)
and outputs an authoritative directive. The Writer expands this into prose.

Features:
- Condensed story summary maintained across paragraphs
- All user choices tracked for narrative coherence
- Token-by-token streaming for Writer output
- Action types: "extend_scene" vs "progress_story"
"""
import asyncio
import json
import logging
import re
from typing import Dict, Any, List, AsyncGenerator, Optional

from langgraph.graph import StateGraph, END

from .state import RollingStoryState, ScenaristDirective, UserChoice
from .debug_logger import RollingStoryDebugLogger
from .prompts import (
    # New two-node prompts
    SCENARIST_SYSTEM,
    SCENARIST_USER,
    WRITER_SYSTEM,
    WRITER_USER,
    SUMMARY_CONDENSE_SYSTEM,
    SUMMARY_CONDENSE_USER,
    # Arc evaluator prompts
    ARC_EVALUATOR_SYSTEM,
    ARC_EVALUATOR_USER,
    # Arc parser and generator prompts
    ARC_PARSER_SYSTEM,
    ARC_PARSER_USER,
    ARC_GENERATOR_SYSTEM,
    ARC_GENERATOR_USER,
    # Legacy prompts (still used for extraction and choices)
    PARAGRAPH_GENERATION_SYSTEM,
    PARAGRAPH_GENERATION_USER,
    EXTRACTION_SYSTEM,
    EXTRACTION_USER,
    CHOICES_SYSTEM,
    CHOICES_USER,
    STORYLINE_SYSTEM,
    STORYLINE_USER,
    # Formatting helpers
    format_bible_for_prompt,
    format_events_for_prompt,
    format_scenario_for_prompt,
    format_storyline_for_prompt,
    format_all_choices_for_prompt,
    extract_writing_style,
    extract_arc_text,
    # Arc parsing helpers
    parse_story_arc,
    normalize_structured_arc,
    get_arc_step_info,
    get_next_arc_step_info,
)
from infrastructure.database.repositories import RollingStoryRepository

logger = logging.getLogger(__name__)


def parse_sse_chunks(chunk: bytes) -> List[str]:
    """Parse a Server-Sent Events chunk and extract ALL content deltas.

    Returns a list of content strings from all data lines in the chunk.
    """
    results = []
    try:
        decoded = chunk.decode('utf-8', errors='ignore')

        # Handle multiple lines in a single chunk
        for line in decoded.split('\n'):
            line = line.strip()
            if not line:
                continue
            if not line.startswith('data: '):
                continue

            data = line[6:]  # Remove 'data: ' prefix
            if data == '[DONE]':
                continue

            try:
                parsed = json.loads(data)
                choices = parsed.get('choices', [])
                if choices:
                    delta = choices[0].get('delta', {})
                    content = delta.get('content')
                    if content:  # Only add non-empty content
                        results.append(content)
            except json.JSONDecodeError:
                continue
    except Exception:
        pass
    return results


def normalize_category(category: str) -> str:
    """Normalize bible entry category to valid enum value."""
    if not category:
        return "character"

    cat_lower = category.lower().strip()

    # Map various LLM outputs to valid categories
    if cat_lower in ("character", "characters", "person", "people", "protagonist", "antagonist"):
        return "character"
    elif cat_lower in ("setting", "settings", "location", "locations", "place", "places", "environment"):
        return "setting"
    elif cat_lower in ("object", "objects", "item", "items", "thing", "things", "artifact", "artifacts"):
        return "object"

    # Default to character if unknown
    return "character"


def normalize_event_type(event_type: str) -> str:
    """Normalize event type to valid enum value."""
    if not event_type:
        return "key_event"

    et_lower = event_type.lower().strip().replace(" ", "_")

    if et_lower in ("key_event", "keyevent", "major_event", "event"):
        return "key_event"
    elif et_lower in ("decision", "choice", "decisions"):
        return "decision"
    elif et_lower in ("consequence", "result", "consequences", "outcome"):
        return "consequence"
    elif et_lower in ("unresolved", "pending", "open", "foreshadowing"):
        return "unresolved"
    elif et_lower in ("user_choice", "userchoice", "player_choice"):
        return "user_choice"

    return "key_event"


class RollingStoryAgent:
    """LangGraph agent for rolling story generation with true streaming."""

    def __init__(self):
        # We don't need the graph for streaming - we'll iterate manually
        pass

    def _get_llm_service(self, user_id: str):
        """Get the LLM service for a user."""
        from domain.services.llm_proxy_service import LLMProxyService
        return LLMProxyService.get_llm_service_for_user(user_id)

    def _build_choice_context(self, chosen_action: str, chosen_description: str, is_first_paragraph: bool) -> str:
        """Build the choice context string for prompts."""
        if not chosen_action or not is_first_paragraph:
            return ""

        context = f"## User's Choice\nThe protagonist decides to: {chosen_action}"
        if chosen_description:
            context += f"\nDetails: {chosen_description}"
        return context

    def _format_recent_paragraphs(self, paragraphs: List[str]) -> str:
        """Format the last few paragraphs for context."""
        if not paragraphs:
            return "The story is about to begin."

        # Take last 2 paragraphs for context
        recent = paragraphs[-2:] if len(paragraphs) >= 2 else paragraphs
        return "\n\n".join(recent)

    def _build_arc_context(self, scenario: dict, current_arc_step: int) -> str:
        """Build story arc context for prompts."""
        jsondata = scenario.get("jsondata", "{}")
        if isinstance(jsondata, str):
            try:
                jsondata = json.loads(jsondata)
            except:
                jsondata = {}

        storyarc = jsondata.get("storyarc", "")
        if not storyarc:
            return "No story arc defined for this scenario."

        return f"Currently at step {current_arc_step} of the story arc. The story arc is:\n{storyarc}"

    # ============= ARC EVALUATION =============

    async def _evaluate_choice_against_arc(
        self,
        user_id: str,
        scenario: dict,
        chosen_action: str,
        chosen_action_description: str,
        current_arc_step: int,
        story_summary: str,
        structured_arc: list = None
    ) -> Dict[str, Any]:
        """Evaluate user's choice and determine if it advances the story arc.

        This is the Arc Guardian - it ensures the story follows its defined narrative arc
        by evaluating each user choice against the current and next arc steps.

        Args:
            structured_arc: Optional pre-loaded structured arc (1-indexed steps)

        Returns:
            {
                "stays_in_step": True/False,
                "new_arc_step": int,  # same as current or current+1
                "rationale": "Why this choice stays or advances",
                "modified_action": "How to interpret the choice within arc context"
            }
        """
        llm_service, provider, mode = self._get_llm_service(user_id)

        # Get arc step info (use structured_arc if provided)
        current_step_info = get_arc_step_info(scenario, current_arc_step, structured_arc)
        next_step_info = get_next_arc_step_info(scenario, current_arc_step, structured_arc)

        # If no arc defined or at last step, default to staying
        if current_step_info["name"] == "No Arc" or current_step_info.get("is_last", False):
            return {
                "stays_in_step": True,
                "new_arc_step": current_arc_step,
                "rationale": "No arc defined or at final arc step",
                "modified_action": chosen_action
            }

        # Build the evaluation prompt
        prompt = ARC_EVALUATOR_USER.format(
            current_step=current_arc_step,
            current_step_name=current_step_info["name"],
            current_step_description=current_step_info["description"],
            next_step=current_arc_step + 1,
            next_step_name=next_step_info["name"] if next_step_info["exists"] else "N/A",
            next_step_description=next_step_info["description"] if next_step_info["exists"] else "Story arc complete",
            story_summary=story_summary or "Story is just beginning.",
            choice_label=chosen_action,
            choice_description=chosen_action_description or ""
        )

        payload = {
            "messages": [
                {"role": "system", "content": ARC_EVALUATOR_SYSTEM},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,  # Low temperature for consistent evaluation
            "max_tokens": 400
        }

        try:
            response = llm_service.chat_completion(payload)

            response_text = ""
            if isinstance(response, dict):
                choices = response.get("choices", [])
                if choices:
                    response_text = choices[0].get("message", {}).get("content", "")
            elif isinstance(response, str):
                response_text = response

            parsed = self._parse_json_response(response_text)
            if parsed and "stays_in_step" in parsed:
                # Ensure proper types
                result = {
                    "stays_in_step": bool(parsed.get("stays_in_step", True)),
                    "new_arc_step": int(parsed.get("new_arc_step", current_arc_step)),
                    "rationale": str(parsed.get("rationale", "")),
                    "modified_action": str(parsed.get("modified_action", chosen_action))
                }
                logger.info(f"Arc evaluation: stays={result['stays_in_step']}, step={result['new_arc_step']}, rationale={result['rationale'][:50]}...")
                return result

        except Exception as e:
            logger.error(f"Arc evaluation failed: {e}", exc_info=True)

        # Default: stay in current step
        logger.warning("Arc evaluation fallback: staying in current step")
        return {
            "stays_in_step": True,
            "new_arc_step": current_arc_step,
            "rationale": "Evaluation failed, defaulting to current step",
            "modified_action": chosen_action
        }

    async def _initialize_structured_arc(
        self,
        story_id: int,
        user_id: str,
        scenario: dict,
        debug_logger=None
    ) -> list:
        """Initialize the structured arc for a rolling story.

        This is called once when generation starts. It:
        1. Checks if a structured arc already exists in the database
        2. If not, uses LLM to parse the scenario's story arc text into JSON
        3. If no arc text exists, generates one via LLM

        Args:
            story_id: The rolling story ID
            user_id: The user ID
            scenario: The scenario dict containing jsondata
            debug_logger: Optional debug logger for arc logging

        Returns:
            List of structured arc steps (1-indexed)
        """
        # Check if structured arc already exists
        existing_arc = RollingStoryRepository.get_structured_arc(story_id)
        if existing_arc and len(existing_arc) > 0:
            logger.info(f"Using existing structured arc with {len(existing_arc)} steps")
            if debug_logger:
                debug_logger.log_structured_arc(existing_arc, source="existing (from database)")
            return existing_arc

        # Get arc text from scenario
        arc_text = extract_arc_text(scenario)

        if arc_text and arc_text != "No story arc defined for this scenario.":
            # Use LLM to parse the arc text into structured JSON
            logger.info("Parsing story arc via LLM")
            parsed_arc, raw_response = await self._parse_arc_with_llm(user_id, arc_text)
            if debug_logger:
                debug_logger.log_arc_parsing(
                    raw_text=raw_response or arc_text,
                    parsed_result=parsed_arc if parsed_arc else None,
                    error="Parsing returned None or too few steps" if not parsed_arc or len(parsed_arc) < 3 else None
                )
            if parsed_arc and len(parsed_arc) >= 3:
                normalized = normalize_structured_arc(parsed_arc)
                RollingStoryRepository.set_structured_arc(story_id, user_id, normalized)
                logger.info(f"LLM parsed and saved structured arc with {len(normalized)} steps")
                if debug_logger:
                    debug_logger.log_structured_arc(normalized, source="parsed via LLM")
                return normalized
            else:
                logger.warning(f"LLM parsed arc has only {len(parsed_arc) if parsed_arc else 0} steps")

        # No arc text or parsing failed - generate new arc via LLM
        logger.info("Generating new structured arc via LLM")
        generated_arc, raw_response = await self._generate_story_arc(user_id, scenario)
        if debug_logger and raw_response:
            debug_logger.log_arc_parsing(
                raw_text=raw_response,
                parsed_result=generated_arc if generated_arc else None,
                error="Generation returned None" if not generated_arc else None
            )
        if generated_arc:
            RollingStoryRepository.set_structured_arc(story_id, user_id, generated_arc)
            logger.info(f"Generated and saved structured arc with {len(generated_arc)} steps")
            if debug_logger:
                debug_logger.log_structured_arc(generated_arc, source="generated via LLM")
            return generated_arc

        # Fallback: create a minimal default arc
        logger.warning("Using fallback default arc")
        default_arc = [
            {"step": 1, "name": "Beginning", "description": "Story introduction and setup", "locked": False},
            {"step": 2, "name": "Rising Action", "description": "Conflict develops and stakes increase", "locked": False},
            {"step": 3, "name": "Climax", "description": "Main confrontation or turning point", "locked": False},
            {"step": 4, "name": "Resolution", "description": "Story conclusion", "locked": False}
        ]
        RollingStoryRepository.set_structured_arc(story_id, user_id, default_arc)
        if debug_logger:
            debug_logger.log_structured_arc(default_arc, source="fallback default")
        return default_arc

    async def _parse_arc_with_llm(
        self,
        user_id: str,
        arc_text: str
    ) -> tuple:
        """Use LLM to parse story arc text into structured JSON.

        This handles any format: Roman numerals, numbers, bullets, etc.

        Args:
            user_id: The user ID for LLM service selection
            arc_text: The raw story arc text to parse

        Returns:
            Tuple of (List of structured arc steps or None, raw response text)
        """
        llm_service, provider, mode = self._get_llm_service(user_id)

        prompt = ARC_PARSER_USER.format(arc_text=arc_text)

        payload = {
            "messages": [
                {"role": "system", "content": ARC_PARSER_SYSTEM},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,  # Low temperature for accurate parsing
            "max_tokens": 2000
        }

        response_text = ""
        try:
            response = llm_service.chat_completion(payload)

            if isinstance(response, dict):
                choices = response.get("choices", [])
                if choices:
                    response_text = choices[0].get("message", {}).get("content", "")
            elif isinstance(response, str):
                response_text = response

            parsed = self._parse_json_response(response_text)
            if parsed and isinstance(parsed, list) and len(parsed) > 0:
                logger.info(f"LLM successfully parsed arc into {len(parsed)} steps")
                return (parsed, response_text)
            else:
                logger.warning(f"LLM arc parsing failed, response: {response_text[:200]}")

        except Exception as e:
            logger.error(f"Arc parsing with LLM failed: {e}", exc_info=True)

        return (None, response_text)

    async def _generate_story_arc(
        self,
        user_id: str,
        scenario: dict
    ) -> tuple:
        """Generate a story arc using LLM based on scenario details.

        Args:
            user_id: The user ID for LLM service selection
            scenario: The scenario dict containing jsondata

        Returns:
            Tuple of (List of structured arc steps or None, raw response text)
        """
        llm_service, provider, mode = self._get_llm_service(user_id)

        # Extract scenario details
        jsondata = scenario.get("jsondata", "{}")
        if isinstance(jsondata, str):
            try:
                jsondata = json.loads(jsondata)
            except:
                jsondata = {}

        title = jsondata.get("title", "Untitled Story")
        synopsis = jsondata.get("synopsis", "An interactive story")
        genre = jsondata.get("genre", "")
        if isinstance(jsondata.get("writingStyle"), dict):
            genre = jsondata["writingStyle"].get("genre", genre)

        # Format characters
        characters = jsondata.get("characters", [])
        char_text = ""
        for char in characters[:5]:  # Limit to 5 main characters
            if char.get("name"):
                char_text += f"- {char['name']}"
                if char.get("role"):
                    char_text += f" ({char['role']})"
                char_text += "\n"
        if not char_text:
            char_text = "No specific characters defined"

        # Check for existing arc text to improve upon
        existing_arc = jsondata.get("storyarc", "")
        if existing_arc:
            task = f"""Improve and structure this existing story arc into proper steps:

{existing_arc}

Make sure each step is clear, distinct, and achievable in 2-5 paragraphs."""
        else:
            task = """Create a compelling story arc with 5-7 steps that fits this scenario.
Each step should be a major narrative beat that can be explored in 2-5 paragraphs."""

        prompt = ARC_GENERATOR_USER.format(
            title=title,
            synopsis=synopsis,
            genre=genre or "General fiction",
            characters=char_text,
            existing_arc=existing_arc or "None provided",
            task=task
        )

        payload = {
            "messages": [
                {"role": "system", "content": ARC_GENERATOR_SYSTEM},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 1500
        }

        response_text = ""
        try:
            response = llm_service.chat_completion(payload)

            if isinstance(response, dict):
                choices = response.get("choices", [])
                if choices:
                    response_text = choices[0].get("message", {}).get("content", "")
            elif isinstance(response, str):
                response_text = response

            parsed = self._parse_json_response(response_text)
            if parsed and isinstance(parsed, list) and len(parsed) >= 3:
                # Normalize the generated arc
                return (normalize_structured_arc(parsed), response_text)
            else:
                logger.warning(f"Failed to parse generated arc: {response_text[:200]}")

        except Exception as e:
            logger.error(f"Arc generation failed: {e}", exc_info=True)

        return (None, response_text)

    # ============= NEW: Two-Node Architecture Methods =============

    async def _generate_scenarist_directive(
        self,
        user_id: str,
        scenario: dict,
        story_summary: str,
        all_user_choices: List[Dict[str, Any]],
        bible: List[Dict[str, Any]],
        events: List[Dict[str, Any]],
        last_paragraph: str,
        user_influence: str,
        action_type: str,
        current_arc_step: int,
        current_choice: Dict[str, Any] = None,
        structured_arc: list = None
    ) -> tuple:
        """Generate the Scenarist's authoritative directive for the next paragraph.

        The Scenarist is the high-level narrative director that decides WHAT happens,
        considering the full story context, all user choices, and the scenario arc.

        Args:
            structured_arc: Optional pre-loaded structured arc (1-indexed steps)

        Returns:
            tuple: (directive dict, raw_response str, parse_success bool, user_prompt str)
        """
        prompt = ""  # Initialize for error handling
        try:
            llm_service, provider, mode = self._get_llm_service(user_id)

            # Extract scenario data
            jsondata = scenario.get("jsondata", {})
            if isinstance(jsondata, str):
                import json
                try:
                    jsondata = json.loads(jsondata)
                except Exception as parse_err:
                    logger.warning(f"Failed to parse jsondata: {parse_err}")
                    jsondata = {}

            title = jsondata.get("title", "Untitled Story")
            synopsis = jsondata.get("synopsis", "No synopsis provided.")

            # Format characters simply
            characters = jsondata.get("characters", [])
            characters_text = "No characters defined."
            if characters:
                char_lines = []
                for char in characters:
                    if char.get("name"):
                        line = f"- {char['name']}"
                        if char.get("role"):
                            line += f" ({char['role']})"
                        if char.get("gender"):
                            line += f" - {char['gender']}"
                        char_lines.append(line)
                if char_lines:
                    characters_text = "\n".join(char_lines)

            # Get current and next arc step info (use structured_arc if provided)
            current_step_info = get_arc_step_info(scenario, current_arc_step, structured_arc)
            next_step_info = get_next_arc_step_info(scenario, current_arc_step, structured_arc)

            # Format user's last choice
            user_choice_text = "No choice made yet - this is the beginning."
            if current_choice:
                user_choice_text = f"Choice: {current_choice.get('label', '')} - {current_choice.get('description', '')}"

            prompt = SCENARIST_USER.format(
                synopsis=synopsis,
                characters=characters_text,
                current_step_name=current_step_info['name'],
                current_step_description=current_step_info['description'],
                story_summary=story_summary or "Story has not started yet.",
                last_paragraph=last_paragraph or "This is the first paragraph.",
                user_choice=user_choice_text
            )
        except Exception as e:
            error_msg = f"Error building scenarist prompt: {e}"
            logger.error(error_msg, exc_info=True)
            raise RuntimeError(error_msg) from e

        payload = {
            "messages": [
                {"role": "system", "content": SCENARIST_SYSTEM},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.5,  # Slightly higher for more creative narrative decisions
            "max_tokens": 600  # Increased for richer directive with all new fields
        }

        response = llm_service.chat_completion(payload)

        # Extract text from response
        response_text = ""
        if isinstance(response, dict):
            choices = response.get("choices", [])
            if choices:
                response_text = choices[0].get("message", {}).get("content", "")
        elif isinstance(response, str):
            response_text = response

        # Parse JSON response
        parsed = self._parse_json_response(response_text)
        if parsed and parsed.get("instruction"):
            logger.info(f"Scenarist directive: {parsed.get('instruction', '')[:100]}...")
            return (parsed, response_text, True, prompt)

        # Default directive if parsing fails
        logger.warning(f"Scenarist parse failed, using default. Response: {response_text[:200]}")
        default_directive = {
            "instruction": "Continue following the current arc step, showing the protagonist's actions.",
            "focus_elements": [],
            "sensory_focus": "The immediate environment"
        }
        return (default_directive, response_text, False, prompt)

    async def _stream_writer_paragraph(
        self,
        user_id: str,
        scenario: dict,
        scenarist_directive: Dict[str, Any],
        bible: List[Dict[str, Any]],
        last_paragraph: str,
        word_count: int = 190
    ) -> AsyncGenerator[str, None]:
        """Stream the Writer's prose based on the Scenarist's directive.

        The Writer transforms the Scenarist's directive into rich, engaging prose,
        matching the established writing style and maintaining continuity.

        Args:
            word_count: Target word count for the paragraph (50-300)
        """
        from .prompts import get_writer_system_prompt
        llm_service, provider, mode = self._get_llm_service(user_id)

        # Extract writing style from scenario
        writing_style = extract_writing_style(scenario)

        # Format focus elements
        focus_elements = scenarist_directive.get("focus_elements", [])
        focus_text = ", ".join(focus_elements) if focus_elements else "None specified"

        prompt = WRITER_USER.format(
            writing_style=writing_style,
            scenarist_instruction=scenarist_directive.get("instruction", "Continue the story"),
            sensory_focus=scenarist_directive.get("sensory_focus", "The immediate environment"),
            focus_elements=focus_text,
            last_paragraph=last_paragraph or "Story is beginning.",
            bible_text=format_bible_for_prompt(bible),
            word_count=word_count
        )

        # Get dynamic system prompt with word count
        writer_system = get_writer_system_prompt(word_count)

        payload = {
            "messages": [
                {"role": "system", "content": writer_system},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,  # Moderate temperature for creative prose
            "max_tokens": 2048
        }

        # Stream the response
        try:
            for chunk in llm_service.chat_completion_stream(payload):
                contents = parse_sse_chunks(chunk)
                for content in contents:
                    yield content
                await asyncio.sleep(0)
        except Exception as e:
            logger.error(f"Writer streaming failed: {e}")
            raise

    async def _condense_summary(
        self,
        user_id: str,
        current_summary: str,
        new_paragraph: str
    ) -> str:
        """Update the running story summary by incorporating a new paragraph.

        Maintains a structured summary with plot, emotional, and unresolved thread tracking.
        Keeps the summary under 800 words to maintain context without unbounded growth.
        """
        llm_service, provider, mode = self._get_llm_service(user_id)

        prompt = SUMMARY_CONDENSE_USER.format(
            current_summary=current_summary or "Story is just beginning.",
            new_paragraph=new_paragraph
        )

        payload = {
            "messages": [
                {"role": "system", "content": SUMMARY_CONDENSE_SYSTEM},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,  # Low temperature for accurate summarization
            "max_tokens": 1000  # Increased to support richer structured summaries
        }

        response = llm_service.chat_completion(payload)

        # Extract text from response
        response_text = ""
        if isinstance(response, dict):
            choices = response.get("choices", [])
            if choices:
                response_text = choices[0].get("message", {}).get("content", "")
        elif isinstance(response, str):
            response_text = response

        return response_text.strip() if response_text else current_summary

    def _load_story_summary(self, story_id: int) -> str:
        """Load the story summary from database."""
        summary_data = RollingStoryRepository.get_story_summary(story_id)
        if summary_data:
            return summary_data.get("summary_text", "")
        return ""

    def _save_story_summary(self, story_id: int, summary_text: str, paragraph_count: int) -> None:
        """Save the story summary to database."""
        RollingStoryRepository.save_story_summary(story_id, summary_text, paragraph_count)

    def _load_all_user_choices(self, story_id: int) -> List[Dict[str, Any]]:
        """Load all user choices from database."""
        return RollingStoryRepository.get_all_user_choices(story_id)

    def _save_user_choice(
        self,
        story_id: int,
        sequence: int,
        label: str,
        description: str,
        advances_arc: bool
    ) -> None:
        """Save a user choice to database."""
        RollingStoryRepository.add_user_choice(
            story_id, sequence, label, description, advances_arc
        )

    # ============= END: Two-Node Architecture Methods =============

    # ============= LEGACY: Original Storyline Method (kept for compatibility) =============

    async def _generate_storyline(
        self,
        user_id: str,
        scenario: dict,
        bible: List[Dict[str, Any]],
        events: List[Dict[str, Any]],
        recent_paragraphs: List[str],
        chosen_action: str = None,
        chosen_description: str = None,
        user_influence: str = None,
        current_arc_step: int = 1
    ) -> Dict[str, Any]:
        """Generate or update the running storyline."""
        llm_service, provider, mode = self._get_llm_service(user_id)

        choice_context = self._build_choice_context(chosen_action, chosen_description, True)
        arc_context = self._build_arc_context(scenario, current_arc_step)

        prompt = STORYLINE_USER.format(
            scenario_text=format_scenario_for_prompt(scenario, current_arc_step),
            bible_text=format_bible_for_prompt(bible),
            events_text=format_events_for_prompt(events),
            recent_paragraphs=self._format_recent_paragraphs(recent_paragraphs),
            choice_context=choice_context,
            user_influence=user_influence or "None",
            arc_context=arc_context
        )

        payload = {
            "messages": [
                {"role": "system", "content": STORYLINE_SYSTEM},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.5,
            "max_tokens": 500
        }

        response = llm_service.chat_completion(payload)

        # Extract text from response
        response_text = ""
        if isinstance(response, dict):
            choices = response.get("choices", [])
            if choices:
                response_text = choices[0].get("message", {}).get("content", "")
        elif isinstance(response, str):
            response_text = response

        # Parse JSON using robust parser
        parsed = self._parse_json_response(response_text)
        if parsed:
            # Add user influence to storyline so it's included in paragraph prompts
            if user_influence:
                parsed["user_influence"] = user_influence
            return parsed

        # Default storyline
        storyline = {
            "current_situation": "The story is unfolding",
            "tension_level": "building",
            "active_threads": [],
            "next_beat": "Continue developing the narrative",
            "pacing_notes": "Maintain steady pace"
        }
        if user_influence:
            storyline["user_influence"] = user_influence
        return storyline

    async def _stream_paragraph(
        self,
        user_id: str,
        scenario: dict,
        bible: List[Dict[str, Any]],
        events: List[Dict[str, Any]],
        storyline: Dict[str, Any],
        recent_paragraphs: List[str],
        paragraph_number: int,
        total_paragraphs: int,
        chosen_action: str = None,
        chosen_description: str = None,
        current_arc_step: int = 1
    ) -> AsyncGenerator[str, None]:
        """Stream a single paragraph token by token."""
        llm_service, provider, mode = self._get_llm_service(user_id)

        choice_context = self._build_choice_context(
            chosen_action, chosen_description, paragraph_number == 1
        )

        # Add special instruction for the final paragraph
        is_final = paragraph_number == total_paragraphs
        if is_final:
            final_paragraph_instruction = """
## IMPORTANT - FINAL PARAGRAPH
This is the LAST paragraph of this cycle. You MUST end it at a critical decision point or cliffhanger.
The protagonist should face a moment of choice where multiple paths forward are clearly possible.
Examples: pointing a weapon, standing at a crossroads, confronted by someone, about to make a revelation, etc.
End at the moment of decision, NOT after it is made."""
        else:
            final_paragraph_instruction = ""

        prompt = PARAGRAPH_GENERATION_USER.format(
            scenario_text=format_scenario_for_prompt(scenario, current_arc_step),
            bible_text=format_bible_for_prompt(bible),
            storyline_text=format_storyline_for_prompt(storyline),
            events_text=format_events_for_prompt(events),
            recent_paragraphs=self._format_recent_paragraphs(recent_paragraphs),
            choice_context=choice_context,
            paragraph_number=paragraph_number,
            total_paragraphs=total_paragraphs,
            final_paragraph_instruction=final_paragraph_instruction
        )

        payload = {
            "messages": [
                {"role": "system", "content": PARAGRAPH_GENERATION_SYSTEM},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.8,
            "max_tokens": 2048  # Increased to ensure paragraphs aren't cut off
        }

        # Use streaming endpoint
        try:
            for chunk in llm_service.chat_completion_stream(payload):
                # Parse all content from this chunk
                contents = parse_sse_chunks(chunk)
                for content in contents:
                    yield content
                # Small delay to allow other tasks
                await asyncio.sleep(0)
        except Exception as e:
            logger.error(f"Streaming failed: {e}")
            raise

    def _repair_json(self, json_str: str) -> str:
        """Attempt to repair common JSON malformations from LLMs."""
        # Fix missing quotes for string values after colon
        # Pattern: "key": SomeText... -> "key": "SomeText..."
        # The LLM often forgets the opening quote for string values

        # First, try a regex approach that handles the whole string
        # Match pattern: "key": followed by unquoted text until comma or closing brace
        def fix_unquoted_value(match):
            key_part = match.group(1)  # "key":
            value = match.group(2).strip()
            end_char = match.group(3)  # , or } or ]

            # Escape quotes in value
            value = value.replace('\\', '\\\\').replace('"', '\\"')
            return f'{key_part}"{value}"{end_char}'

        # Pattern: "key": <unquoted text starting with letter> followed by , or } or ]
        # This handles: "description": Some text here,
        repaired = re.sub(
            r'("(?:label|description|summary|name|details)":\s*)([A-Za-z][^,}\]"]*?)(\s*[,}\]])',
            fix_unquoted_value,
            json_str
        )

        return repaired

    def _parse_json_response(self, response_text: str) -> Optional[Dict[str, Any]]:
        """Parse JSON from LLM response, handling various formats."""
        if not response_text:
            logger.warning("Empty response text in _parse_json_response")
            return None

        # Clean up the response text
        cleaned = response_text.strip()

        # Remove double braces if present (common LLM mistake)
        cleaned = cleaned.replace('{{', '{').replace('}}', '}')

        # Try direct parse first
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.debug(f"Direct JSON parse failed: {e}")

        # Try extracting from markdown code block (handle multiline)
        code_block_match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', cleaned)
        if code_block_match:
            try:
                return json.loads(code_block_match.group(1))
            except json.JSONDecodeError as e:
                logger.debug(f"Markdown code block JSON parse failed: {e}")

        # Try finding JSON object with balanced braces
        start_idx = cleaned.find('{')
        if start_idx >= 0:
            brace_count = 0
            end_idx = start_idx
            in_string = False
            escape_next = False

            for i, char in enumerate(cleaned[start_idx:], start_idx):
                if escape_next:
                    escape_next = False
                    continue
                if char == '\\':
                    escape_next = True
                    continue
                if char == '"' and not escape_next:
                    in_string = not in_string
                    continue
                if in_string:
                    continue

                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end_idx = i + 1
                        break

            if end_idx > start_idx:
                json_str = cleaned[start_idx:end_idx]
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError as e:
                    logger.debug(f"Balanced brace extraction failed to parse: {e}")
                    # Try repairing the JSON
                    try:
                        repaired = self._repair_json(json_str)
                        logger.debug(f"Attempting repaired JSON: {repaired[:200]}...")
                        return json.loads(repaired)
                    except json.JSONDecodeError as e2:
                        logger.warning(f"Repaired JSON also failed to parse: {e2}")
                        logger.debug(f"Attempted to parse: {json_str[:200]}...")

        logger.warning(f"All JSON parsing methods failed for response: {cleaned[:200]}...")
        return None

    async def _extract_updates(
        self,
        user_id: str,
        paragraph: str,
        bible: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Extract bible and event updates from a paragraph."""
        llm_service, provider, mode = self._get_llm_service(user_id)

        prompt = EXTRACTION_USER.format(
            bible_text=format_bible_for_prompt(bible),
            paragraph=paragraph
        )

        payload = {
            "messages": [
                {"role": "system", "content": EXTRACTION_SYSTEM},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 1000
        }

        try:
            response = llm_service.chat_completion(payload)

            response_text = ""
            if isinstance(response, dict):
                choices = response.get("choices", [])
                if choices:
                    response_text = choices[0].get("message", {}).get("content", "")
            elif isinstance(response, str):
                response_text = response

            parsed = self._parse_json_response(response_text)
            if parsed:
                return parsed
        except Exception as e:
            logger.warning(f"Extraction failed (non-fatal): {e}")

        return {"bible_updates": [], "events": []}

    async def _generate_choices(
        self,
        user_id: str,
        scenario: dict,
        bible: List[Dict[str, Any]],
        events: List[Dict[str, Any]],
        last_paragraph: str,
        choice_count: int = 3,
        current_arc_step: int = 1,
        arc_ready: bool = False,
        structured_arc: list = None
    ) -> List[Dict[str, Any]]:
        """Generate arc-categorized choices for the next cycle.

        Args:
            structured_arc: Optional pre-loaded structured arc (1-indexed steps)
        """
        llm_service, provider, mode = self._get_llm_service(user_id)

        # Get scenario title and story arc
        jsondata = scenario.get("jsondata", "{}")
        if isinstance(jsondata, str):
            try:
                jsondata = json.loads(jsondata)
            except:
                jsondata = {}
        scenario_title = jsondata.get("title", "Untitled Story")
        storyarc = jsondata.get("storyarc", "")

        # Get current and next arc step info (use structured_arc if provided)
        current_step_info = get_arc_step_info(scenario, current_arc_step, structured_arc)
        next_step_info = get_next_arc_step_info(scenario, current_arc_step, structured_arc)

        # Format prompts
        user_prompt = CHOICES_USER.format(
            scenario_title=scenario_title,
            bible_text=format_bible_for_prompt(bible),
            last_paragraph=last_paragraph,
            choice_count=choice_count,
            current_arc_step=current_arc_step,
            current_step_name=current_step_info['name'],
            current_step_description=current_step_info['description'],
            next_arc_step=current_arc_step + 1,
            next_step_name=next_step_info['name'],
            next_step_description=next_step_info['description']
        )

        payload = {
            "messages": [
                {"role": "system", "content": CHOICES_SYSTEM},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 1000  # Increased to ensure full JSON response
        }

        try:
            response = llm_service.chat_completion(payload)

            response_text = ""
            if isinstance(response, dict):
                choices = response.get("choices", [])
                if choices:
                    response_text = choices[0].get("message", {}).get("content", "")
            elif isinstance(response, str):
                response_text = response


            parsed = self._parse_json_response(response_text)
            if parsed and "choices" in parsed:
                generated_choices = parsed["choices"]
                # Ensure each choice has required fields with proper defaults
                for choice in generated_choices:
                    if "advances_arc" not in choice:
                        choice["advances_arc"] = False
                    if "choice_category" not in choice:
                        # Infer category from advances_arc if not provided
                        choice["choice_category"] = "advance_arc" if choice.get("advances_arc") else "stay_in_step"
                return generated_choices
            else:
                logger.warning(f"Failed to parse choices from response. Parsed result: {parsed}")
        except Exception as e:
            logger.error(f"Choice generation failed: {e}", exc_info=True)

        # Fallback choices with arc categories
        logger.warning("Using fallback choices due to parsing failure")
        fallback_choices = [
            {"label": "Explore further", "description": "Take time to understand the current situation more deeply", "advances_arc": False, "choice_category": "stay_in_step"},
            {"label": "Take decisive action", "description": "Move forward boldly toward the next challenge", "advances_arc": True, "choice_category": "advance_arc"},
            {"label": "Find another approach", "description": "Look for an alternative way to handle this moment", "advances_arc": False, "choice_category": "flavor_stay"}
        ]
        return fallback_choices[:choice_count]

    async def generate(
        self,
        story_id: int,
        user_id: str,
        scenario: dict,
        bible: List[Dict[str, Any]],
        events: List[Dict[str, Any]],
        chosen_action: str = None,
        chosen_action_description: str = None,
        advances_arc: bool = False,
        user_storyline_influence: str = None,
        paragraph_word_count: int = 190,
        choice_count: int = 3
    ) -> Dict[str, Any]:
        """Generate single paragraph + choices (non-streaming)."""
        current_sequence = RollingStoryRepository.get_next_sequence(story_id)
        target_paragraphs = 1  # Always 1 paragraph per turn now

        # Get current arc step from database
        current_arc_step = RollingStoryRepository.get_current_arc_step(story_id)

        # Advance arc if the chosen action was marked to advance it
        if advances_arc and chosen_action:
            current_arc_step = RollingStoryRepository.advance_arc_step(story_id, user_id)

        generated_paragraphs = []
        all_bible_updates = []
        all_event_updates = []
        recent_paragraph_texts = []

        # Get existing paragraphs for context
        existing = RollingStoryRepository.get_last_paragraphs(story_id, 2)
        for p in existing:
            recent_paragraph_texts.append(p.get("content", ""))

        # Generate storyline at the start
        storyline = await self._generate_storyline(
            user_id, scenario, bible, events, recent_paragraph_texts,
            chosen_action, chosen_action_description, user_storyline_influence,
            current_arc_step
        )

        # Check if story is ready to advance arc based on storyline analysis
        arc_ready = storyline.get("arc_ready", False)

        for i in range(target_paragraphs):
            paragraph_number = i + 1

            # Collect paragraph text
            paragraph_text = ""
            async for token in self._stream_paragraph(
                user_id, scenario, bible, events, storyline,
                recent_paragraph_texts, paragraph_number, target_paragraphs,
                chosen_action, chosen_action_description, current_arc_step
            ):
                paragraph_text += token

            paragraph_text = paragraph_text.strip()

            # Extract updates
            updates = await self._extract_updates(user_id, paragraph_text, bible)
            bible_updates = updates.get("bible_updates", [])
            event_updates = updates.get("events", [])

            # Persist
            saved_paragraph = RollingStoryRepository.add_paragraph(
                rolling_story_id=story_id,
                sequence=current_sequence + i,
                content=paragraph_text
            )

            # Save bible entries
            for entry in bible_updates:
                if entry.get("is_new", True):
                    saved = RollingStoryRepository.add_bible_entry(
                        rolling_story_id=story_id,
                        category=normalize_category(entry.get("category", "character")),
                        name=entry.get("name", "Unknown"),
                        details=entry.get("details", {}),
                        introduced_at=current_sequence + i
                    )
                    if saved:
                        all_bible_updates.append(saved)
                        bible.append(saved)

            # Save events
            for event in event_updates:
                saved = RollingStoryRepository.add_event(
                    rolling_story_id=story_id,
                    paragraph_sequence=current_sequence + i,
                    event_type=normalize_event_type(event.get("event_type", "key_event")),
                    summary=event.get("summary", ""),
                    resolved=False
                )
                if saved:
                    all_event_updates.append(saved)
                    events.append(saved)

            generated_paragraphs.append(saved_paragraph)
            recent_paragraph_texts.append(paragraph_text)

            # Keep only last 2 for context
            if len(recent_paragraph_texts) > 2:
                recent_paragraph_texts = recent_paragraph_texts[-2:]

        # Generate choices with arc awareness
        choices = await self._generate_choices(
            user_id, scenario, bible, events, recent_paragraph_texts[-1], choice_count,
            current_arc_step, arc_ready
        )

        return {
            "paragraphs": generated_paragraphs,
            "bible_updates": all_bible_updates,
            "event_updates": all_event_updates,
            "choices": choices,
            "storyline": storyline,
            "current_arc_step": current_arc_step,
            "arc_ready": arc_ready
        }

    async def stream_generate(
        self,
        story_id: int,
        user_id: str,
        scenario: dict,
        bible: List[Dict[str, Any]],
        events: List[Dict[str, Any]],
        chosen_action: str = None,
        chosen_action_description: str = None,
        advances_arc: bool = False,
        user_storyline_influence: str = None,
        paragraph_word_count: int = 190,
        choice_count: int = 3
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream paragraph generation with real-time token delivery (legacy, generates 1 paragraph)."""
        current_sequence = RollingStoryRepository.get_next_sequence(story_id)
        target_paragraphs = 1  # Always 1 paragraph per turn now

        # Get current arc step from database
        current_arc_step = RollingStoryRepository.get_current_arc_step(story_id)

        # Use the explicit advances_arc flag from the frontend
        should_advance_arc = advances_arc and chosen_action is not None

        generated_paragraphs = []
        all_bible_updates = []
        all_event_updates = []
        recent_paragraph_texts = []

        # Get existing paragraphs for context
        existing = RollingStoryRepository.get_last_paragraphs(story_id, 2)
        for p in existing:
            recent_paragraph_texts.append(p.get("content", ""))

        # If user made a choice, insert it as a special "choice" paragraph
        if chosen_action:
            choice_text = f"[CHOICE: {chosen_action}]"
            choice_paragraph = RollingStoryRepository.add_paragraph(
                rolling_story_id=story_id,
                sequence=current_sequence,
                content=choice_text
            )
            generated_paragraphs.append(choice_paragraph)
            current_sequence += 1

            # Also record it as a user_choice event
            choice_event = RollingStoryRepository.add_event(
                rolling_story_id=story_id,
                paragraph_sequence=current_sequence - 1,
                event_type="user_choice",
                summary=f"Reader chose: {chosen_action}",
                resolved=True
            )
            if choice_event:
                all_event_updates.append(choice_event)

            # Yield the choice paragraph to the frontend
            yield {"type": "choice_made", "content": choice_text, "paragraph": choice_paragraph}

            # If advancing arc, do it now and record it
            if should_advance_arc:
                current_arc_step = RollingStoryRepository.advance_arc_step(story_id, user_id)
                arc_event = RollingStoryRepository.add_event(
                    rolling_story_id=story_id,
                    paragraph_sequence=current_sequence - 1,
                    event_type="key_event",
                    summary=f"Story arc advanced to step {current_arc_step}",
                    resolved=False
                )
                if arc_event:
                    all_event_updates.append(arc_event)
                yield {"type": "arc_advanced", "new_step": current_arc_step}

        # Generate storyline at the start
        yield {"type": "status", "message": "Planning story direction..."}

        try:
            storyline = await self._generate_storyline(
                user_id, scenario, bible, events, recent_paragraph_texts,
                chosen_action, chosen_action_description, user_storyline_influence,
                current_arc_step
            )

            yield {"type": "storyline", "storyline": storyline}
        except Exception as e:
            logger.error(f"Storyline generation failed: {e}")
            storyline = {
                "current_situation": "The story continues",
                "tension_level": "building",
                "active_threads": [],
                "next_beat": "Continue the narrative",
                "pacing_notes": "Maintain pace",
                "arc_ready": False
            }
            if user_storyline_influence:
                storyline["user_influence"] = user_storyline_influence

        # Check if story is ready to advance arc based on storyline analysis
        arc_ready = storyline.get("arc_ready", False)

        for i in range(target_paragraphs):
            paragraph_number = i + 1

            yield {
                "type": "status",
                "message": f"Generating paragraph {paragraph_number} of {target_paragraphs}..."
            }

            # Stream the paragraph token by token
            paragraph_text = ""
            try:
                async for token in self._stream_paragraph(
                    user_id, scenario, bible, events, storyline,
                    recent_paragraph_texts, paragraph_number, target_paragraphs,
                    chosen_action, chosen_action_description, current_arc_step
                ):
                    paragraph_text += token
                    # Yield each token as it arrives
                    yield {"type": "token", "content": token}
            except Exception as e:
                logger.error(f"Paragraph {paragraph_number} streaming failed: {e}")
                yield {"type": "error", "error": f"Failed to generate paragraph: {str(e)}"}
                return

            paragraph_text = paragraph_text.strip()

            # Signal paragraph complete with newlines for separation
            yield {"type": "paragraph_end", "content": "\n\n"}

            # Extract updates (background, don't stream)
            updates = await self._extract_updates(user_id, paragraph_text, bible)
            bible_updates = updates.get("bible_updates", [])
            event_updates = updates.get("events", [])

            # Persist
            try:
                saved_paragraph = RollingStoryRepository.add_paragraph(
                    rolling_story_id=story_id,
                    sequence=current_sequence + i,
                    content=paragraph_text
                )

                # Save bible entries
                for entry in bible_updates:
                    if entry.get("is_new", True):
                        saved = RollingStoryRepository.add_bible_entry(
                            rolling_story_id=story_id,
                            category=normalize_category(entry.get("category", "character")),
                            name=entry.get("name", "Unknown"),
                            details=entry.get("details", {}),
                            introduced_at=current_sequence + i
                        )
                        if saved:
                            all_bible_updates.append(saved)
                            bible.append(saved)

                # Save events
                for event in event_updates:
                    saved = RollingStoryRepository.add_event(
                        rolling_story_id=story_id,
                        paragraph_sequence=current_sequence + i,
                        event_type=normalize_event_type(event.get("event_type", "key_event")),
                        summary=event.get("summary", ""),
                        resolved=False
                    )
                    if saved:
                        all_event_updates.append(saved)
                        events.append(saved)

                generated_paragraphs.append(saved_paragraph)
                recent_paragraph_texts.append(paragraph_text)

                # Keep only last 2 for context
                if len(recent_paragraph_texts) > 2:
                    recent_paragraph_texts = recent_paragraph_texts[-2:]

            except Exception as e:
                logger.error(f"Persist failed: {e}")
                yield {"type": "error", "error": f"Failed to save paragraph: {str(e)}"}
                return

        # Generate choices with arc awareness
        yield {"type": "status", "message": "Generating story choices..."}

        choices = await self._generate_choices(
            user_id, scenario, bible, events, recent_paragraph_texts[-1], choice_count,
            current_arc_step, arc_ready
        )

        yield {"type": "choices", "choices": choices}

        # Final completion event
        yield {
            "type": "complete",
            "paragraphs": generated_paragraphs,
            "bible_updates": all_bible_updates,
            "event_updates": all_event_updates,
            "choices": choices,
            "storyline": storyline,
            "current_arc_step": current_arc_step,
            "arc_ready": arc_ready
        }

    # ============= NEW: Two-Node Architecture Generation =============

    async def stream_generate_v2(
        self,
        story_id: int,
        user_id: str,
        scenario: dict,
        bible: List[Dict[str, Any]],
        events: List[Dict[str, Any]],
        chosen_action: str = None,
        chosen_action_description: str = None,
        advances_arc: bool = False,
        user_storyline_influence: str = None,
        paragraph_word_count: int = 190,
        choice_count: int = 3,
        action_type: str = "progress_story"
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream paragraph generation using the two-node Scenarist/Writer architecture.

        This method separates concerns:
        - SCENARIST: Decides WHAT happens (high-level narrative direction)
        - WRITER: Decides HOW it's written (prose generation)

        Args:
            story_id: The rolling story ID
            user_id: The user ID
            scenario: The source scenario with jsondata
            bible: Story bible entries
            events: Story events
            chosen_action: Label of user's choice (if any)
            chosen_action_description: Description of user's choice
            advances_arc: Whether the choice advances the story arc
            user_storyline_influence: User's direction for the story
            paragraph_word_count: Target word count for the paragraph (50-300)
            choice_count: Number of choices to generate
            action_type: "extend_scene" or "progress_story"

        Yields:
            Dict events: status, directive, token, paragraph_end, choices, complete, error
        """
        import time
        session_start = time.time()

        # Initialize debug logger (only writes if ROLLING_STORY_DEBUG=true)
        debug_logger = RollingStoryDebugLogger(story_id)

        current_sequence = RollingStoryRepository.get_next_sequence(story_id)
        current_arc_step = RollingStoryRepository.get_current_arc_step(story_id)

        # Initialize structured arc (once per story, at first generation)
        yield {"type": "status", "message": "Parsing story arc structure..."}
        structured_arc = await self._initialize_structured_arc(story_id, user_id, scenario, debug_logger)
        logger.info(f"Structured arc has {len(structured_arc)} steps, currently at step {current_arc_step}")

        # Brief status update about arc
        if structured_arc:
            current_step_name = structured_arc[min(current_arc_step - 1, len(structured_arc) - 1)].get("name", f"Step {current_arc_step}")
            yield {"type": "status", "message": f"Story arc ready: currently at '{current_step_name}'"}

        generated_paragraphs = []
        all_bible_updates = []
        all_event_updates = []

        # Load story summary and user choices history
        story_summary = self._load_story_summary(story_id)
        all_user_choices = self._load_all_user_choices(story_id)

        # Get last paragraph for context
        last_paragraphs = RollingStoryRepository.get_last_paragraphs(story_id, 1)
        last_paragraph = last_paragraphs[0].get("content", "") if last_paragraphs else ""

        # Log inputs and initial state
        debug_logger.log_generation_inputs(
            scenario=scenario,
            bible=bible,
            events=events,
            chosen_action=chosen_action,
            chosen_action_description=chosen_action_description,
            advances_arc=advances_arc,
            user_influence=user_storyline_influence,
            paragraph_count=1,  # Always 1 paragraph per turn now
            choice_count=choice_count,
            action_type=action_type
        )
        debug_logger.log_state(
            story_summary=story_summary,
            all_user_choices=all_user_choices,
            current_arc_step=current_arc_step,
            last_paragraph=last_paragraph
        )

        # Handle user choice if made
        if chosen_action:
            # Record the choice in our tracking table
            self._save_user_choice(
                story_id, current_sequence,
                chosen_action, chosen_action_description, advances_arc
            )

            # Add to local list for immediate use
            all_user_choices.append({
                "label": chosen_action,
                "description": chosen_action_description,
                "advances_arc": advances_arc,
                "sequence": current_sequence
            })

            # Insert choice as a special paragraph (for display)
            choice_text = f"[CHOICE: {chosen_action}]"
            choice_paragraph = RollingStoryRepository.add_paragraph(
                rolling_story_id=story_id,
                sequence=current_sequence,
                content=choice_text
            )
            generated_paragraphs.append(choice_paragraph)
            current_sequence += 1

            # Record as event
            choice_event = RollingStoryRepository.add_event(
                rolling_story_id=story_id,
                paragraph_sequence=current_sequence - 1,
                event_type="user_choice",
                summary=f"Reader chose: {chosen_action}",
                resolved=True
            )
            if choice_event:
                all_event_updates.append(choice_event)

            yield {"type": "choice_made", "content": choice_text, "paragraph": choice_paragraph}

            # Evaluate the choice against the story arc to determine if it advances
            yield {"type": "status", "message": "Analyzing your choice against the story arc..."}

            arc_evaluation = await self._evaluate_choice_against_arc(
                user_id=user_id,
                scenario=scenario,
                chosen_action=chosen_action,
                chosen_action_description=chosen_action_description or "",
                current_arc_step=current_arc_step,
                story_summary=story_summary or "Story is just beginning.",
                structured_arc=structured_arc
            )

            # Log the arc evaluation result
            logger.info(f"Arc evaluation result: stays_in_step={arc_evaluation['stays_in_step']}, "
                       f"new_arc_step={arc_evaluation['new_arc_step']}, "
                       f"rationale={arc_evaluation['rationale'][:100]}...")

            # Update arc step based on evaluation (not the frontend's advances_arc flag)
            if not arc_evaluation["stays_in_step"]:
                # Arc evaluation determined the choice advances the story
                old_step = current_arc_step
                new_step = arc_evaluation["new_arc_step"]
                current_arc_step = RollingStoryRepository.set_arc_step(story_id, user_id, new_step)

                # Lock the previous step (it's been played through)
                RollingStoryRepository.lock_arc_step(story_id, user_id, old_step)
                logger.info(f"Locked arc step {old_step}, advanced to step {current_arc_step}")

                arc_event = RollingStoryRepository.add_event(
                    rolling_story_id=story_id,
                    paragraph_sequence=current_sequence - 1,
                    event_type="key_event",
                    summary=f"Story arc advanced to step {current_arc_step}: {arc_evaluation['rationale'][:100]}",
                    resolved=False
                )
                if arc_event:
                    all_event_updates.append(arc_event)

                # Get the new step name for the status message
                new_step_name = "next phase"
                if structured_arc and current_arc_step <= len(structured_arc):
                    new_step_name = structured_arc[current_arc_step - 1].get("name", f"Step {current_arc_step}")

                yield {"type": "arc_advanced", "new_step": current_arc_step, "rationale": arc_evaluation["rationale"]}
                yield {"type": "status", "message": f"Story advancing to: {new_step_name}"}

            # Store the modified action interpretation for use by the Scenarist
            effective_action = arc_evaluation.get("modified_action", chosen_action)
            effective_action_description = arc_evaluation.get("rationale", chosen_action_description)
        else:
            # No choice made, no effective action
            effective_action = None
            effective_action_description = None

        # Get paragraph count for summary tracking
        summary_data = RollingStoryRepository.get_story_summary(story_id)
        paragraph_count_in_summary = summary_data.get("paragraph_count", 0) if summary_data else 0

        # Generate single paragraph using two-node architecture
        # === SCENARIST NODE ===
        yield {"type": "status", "message": "Creating narrative directive..."}

        # Build current_choice dict if user just made a choice
        # Use the effective action (modified by arc evaluation) if available
        current_choice = None
        if chosen_action:
            current_choice = {
                "label": effective_action or chosen_action,
                "description": effective_action_description or chosen_action_description,
                "original_label": chosen_action,
                "original_description": chosen_action_description
            }

        try:
            scenarist_directive, raw_response, parse_success, scenarist_prompt = await self._generate_scenarist_directive(
                user_id=user_id,
                scenario=scenario,
                story_summary=story_summary,
                all_user_choices=all_user_choices,
                bible=bible,
                events=events,
                last_paragraph=last_paragraph,
                user_influence=user_storyline_influence,
                action_type=action_type,
                current_arc_step=current_arc_step,
                current_choice=current_choice,
                structured_arc=structured_arc
            )

            # Log prompts and response for debugging
            debug_logger.log_scenarist_prompt(SCENARIST_SYSTEM, scenarist_prompt, 1)
            debug_logger.log_scenarist_raw_response(raw_response, 1, parse_success)
            debug_logger.log_scenarist_response(scenarist_directive, 1)
            yield {"type": "directive", "directive": scenarist_directive}

        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            logger.error(f"Scenarist failed: {e}\n{error_details}")
            debug_logger.log_error(f"{str(e)}\n\nFull traceback:\n{error_details}", "Scenarist node")
            yield {"type": "error", "error": f"Scenarist failed: {str(e)}"}
            return

        # === WRITER NODE ===
        yield {"type": "status", "message": "Writing story paragraph..."}

        # Build and log writer prompt
        writing_style = extract_writing_style(scenario)
        focus_elements = scenarist_directive.get("focus_elements", [])
        focus_text = ", ".join(focus_elements) if focus_elements else "None specified"
        writer_user_prompt = WRITER_USER.format(
            writing_style=writing_style,
            scenarist_instruction=scenarist_directive.get("instruction", "Continue the story"),
            sensory_focus=scenarist_directive.get("sensory_focus", "The immediate environment"),
            focus_elements=focus_text,
            last_paragraph=last_paragraph or "Story is beginning.",
            bible_text=format_bible_for_prompt(bible),
            word_count=paragraph_word_count
        )
        debug_logger.log_writer_prompt(WRITER_SYSTEM, writer_user_prompt, 1)

        paragraph_text = ""
        try:
            async for token in self._stream_writer_paragraph(
                user_id=user_id,
                scenario=scenario,
                scenarist_directive=scenarist_directive,
                bible=bible,
                last_paragraph=last_paragraph,
                word_count=paragraph_word_count
            ):
                paragraph_text += token
                yield {"type": "token", "content": token}

        except Exception as e:
            logger.error(f"Writer streaming failed: {e}")
            debug_logger.log_error(str(e), "Writer node")
            yield {"type": "error", "error": f"Failed to generate paragraph: {str(e)}"}
            return

        paragraph_text = paragraph_text.strip()
        debug_logger.log_writer_output(paragraph_text, 1)
        yield {"type": "paragraph_end", "content": "\n\n"}

        # === UPDATE SUMMARY ===
        yield {"type": "status", "message": "Updating story memory..."}
        try:
            old_summary = story_summary
            story_summary = await self._condense_summary(
                user_id, story_summary, paragraph_text
            )
            paragraph_count_in_summary += 1
            self._save_story_summary(story_id, story_summary, paragraph_count_in_summary)
            debug_logger.log_summary_update(old_summary, story_summary, 1)
        except Exception as e:
            logger.warning(f"Summary condensation failed (non-fatal): {e}")

        # === EXTRACT UPDATES ===
        yield {"type": "status", "message": "Analyzing story elements..."}
        updates = await self._extract_updates(user_id, paragraph_text, bible)
        bible_updates = updates.get("bible_updates", [])
        event_updates = updates.get("events", [])
        debug_logger.log_extraction(bible_updates, event_updates, 1)

        # === PERSIST ===
        try:
            saved_paragraph = RollingStoryRepository.add_paragraph(
                rolling_story_id=story_id,
                sequence=current_sequence,
                content=paragraph_text
            )

            # Save bible entries
            for entry in bible_updates:
                if entry.get("is_new", True):
                    saved = RollingStoryRepository.add_bible_entry(
                        rolling_story_id=story_id,
                        category=normalize_category(entry.get("category", "character")),
                        name=entry.get("name", "Unknown"),
                        details=entry.get("details", {}),
                        introduced_at=current_sequence
                    )
                    if saved:
                        all_bible_updates.append(saved)
                        bible.append(saved)

            # Save events
            for event in event_updates:
                saved = RollingStoryRepository.add_event(
                    rolling_story_id=story_id,
                    paragraph_sequence=current_sequence,
                    event_type=normalize_event_type(event.get("event_type", "key_event")),
                    summary=event.get("summary", ""),
                    resolved=False
                )
                if saved:
                    all_event_updates.append(saved)
                    events.append(saved)

            generated_paragraphs.append(saved_paragraph)

        except Exception as e:
            logger.error(f"Persist failed: {e}")
            yield {"type": "error", "error": f"Failed to save paragraph: {str(e)}"}
            return

        # Update last_paragraph for choices generation
        last_paragraph = paragraph_text

        # === GENERATE CHOICES (only if choice_count > 0) ===
        choices = []
        arc_ready = (action_type == "progress_story")

        if choice_count > 0:
            yield {"type": "status", "message": "Creating choice options..."}

            choices = await self._generate_choices(
                user_id, scenario, bible, events, last_paragraph, choice_count,
                current_arc_step, arc_ready, structured_arc
            )

            debug_logger.log_choices(choices)
            yield {"type": "choices", "choices": choices}
        else:
            # Auto mode - no choices, story continues automatically
            debug_logger.log_choices([])
            yield {"type": "choices", "choices": [], "auto_mode": True}

        # Log completion with timing
        session_duration = time.time() - session_start
        debug_logger.log_completion(len(generated_paragraphs), session_duration)

        # === FINAL COMPLETION ===
        yield {
            "type": "complete",
            "paragraphs": generated_paragraphs,
            "bible_updates": all_bible_updates,
            "event_updates": all_event_updates,
            "choices": choices,
            "story_summary": story_summary,
            "current_arc_step": current_arc_step,
            "arc_ready": arc_ready,
            "auto_mode": choice_count == 0
        }


# Global instance
rolling_story_agent = RollingStoryAgent()
