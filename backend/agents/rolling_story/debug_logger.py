"""
Debug logging utility for Rolling Story Agent.

Creates detailed log files for each story generation session, including:
- Inputs (scenario, bible, events, user choices)
- State (summary, arc step, action type)
- Prompts (Scenarist and Writer prompts) with token counts
- Generated outputs (directives, paragraphs, choices) with token counts

Log files are stored in: uploads/rolling_story_debug/{story_id}_debug.txt

Enable/disable via environment variable: ROLLING_STORY_DEBUG=true
"""
import os
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)


def estimate_tokens(text: str) -> int:
    """Estimate token count for a text string.

    Uses a simple heuristic: ~4 characters per token for English text.
    This is a rough estimate - actual tokenization varies by model.
    For more accurate counts, you'd need the actual tokenizer (tiktoken, etc.)
    """
    if not text:
        return 0
    # Rough estimate: 1 token ≈ 4 characters for English
    # Also count words as a secondary metric (1 token ≈ 0.75 words)
    char_estimate = len(text) / 4
    word_estimate = len(text.split()) / 0.75
    # Average the two estimates
    return int((char_estimate + word_estimate) / 2)

# Environment variable to enable/disable debug logging
DEBUG_ENABLED_ENV = "ROLLING_STORY_DEBUG"

# Base upload folder
UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "uploads")
DEBUG_FOLDER = os.path.join(UPLOAD_FOLDER, "rolling_story_debug")


def is_debug_enabled() -> bool:
    """Check if debug logging is enabled via environment variable."""
    value = os.environ.get(DEBUG_ENABLED_ENV, "").lower()
    return value in ("true", "1", "yes", "on")


def get_debug_file_path(story_id: int) -> Path:
    """Get the debug file path for a given story ID."""
    # Ensure debug folder exists
    backend_dir = Path(__file__).parent.parent.parent
    debug_dir = backend_dir / DEBUG_FOLDER
    debug_dir.mkdir(parents=True, exist_ok=True)

    return debug_dir / f"{story_id}_debug.txt"


class RollingStoryDebugLogger:
    """Debug logger for rolling story generation sessions."""

    def __init__(self, story_id: int):
        self.story_id = story_id
        self.enabled = is_debug_enabled()
        self.file_path = get_debug_file_path(story_id) if self.enabled else None
        self.session_start = datetime.now()

        # Token tracking
        self.total_prompt_tokens = 0
        self.total_response_tokens = 0
        self.token_details: List[Dict[str, Any]] = []

        if self.enabled:
            self._start_session()

    def _start_session(self):
        """Start a new logging session with a header."""
        with open(self.file_path, "a", encoding="utf-8") as f:
            f.write("\n" + "=" * 80 + "\n")
            f.write(f"ROLLING STORY DEBUG LOG - Story ID: {self.story_id}\n")
            f.write(f"Session started: {self.session_start.isoformat()}\n")
            f.write("=" * 80 + "\n\n")

    def _write(self, content: str):
        """Write content to the debug file."""
        if not self.enabled:
            return
        try:
            with open(self.file_path, "a", encoding="utf-8") as f:
                f.write(content)
        except Exception as e:
            logger.warning(f"Failed to write debug log: {e}")

    def _format_dict(self, data: Any, indent: int = 2) -> str:
        """Format a dictionary or list as pretty JSON."""
        try:
            return json.dumps(data, indent=indent, ensure_ascii=False, default=str)
        except Exception:
            return str(data)

    def log_section(self, title: str, content: str = ""):
        """Log a section with a title."""
        self._write(f"\n{'─' * 40}\n")
        self._write(f"│ {title}\n")
        self._write(f"{'─' * 40}\n")
        if content:
            self._write(content + "\n")

    def log_generation_inputs(
        self,
        scenario: dict,
        bible: List[Dict[str, Any]],
        events: List[Dict[str, Any]],
        chosen_action: Optional[str],
        chosen_action_description: Optional[str],
        advances_arc: bool,
        user_influence: Optional[str],
        paragraph_count: int,
        choice_count: int,
        action_type: str
    ):
        """Log the inputs to the generation process."""
        self.log_section("GENERATION INPUTS")

        # Extract key scenario info
        jsondata = scenario.get("jsondata", "{}")
        if isinstance(jsondata, str):
            try:
                jsondata = json.loads(jsondata)
            except:
                jsondata = {}

        self._write(f"Scenario Title: {jsondata.get('title', 'Untitled')}\n")
        self._write(f"Paragraph Count: {paragraph_count}\n")
        self._write(f"Choice Count: {choice_count}\n")
        self._write(f"Action Type: {action_type}\n")
        self._write(f"User Influence: {user_influence or 'None'}\n")
        self._write(f"\n--- User Choice ---\n")
        self._write(f"Chosen Action: {chosen_action or 'None'}\n")
        self._write(f"Description: {chosen_action_description or 'None'}\n")
        self._write(f"Advances Arc: {advances_arc}\n")

        self._write(f"\n--- Story Bible ({len(bible)} entries) ---\n")
        for entry in bible[:10]:  # Limit to first 10 for brevity
            self._write(f"  - [{entry.get('category', '?')}] {entry.get('name', '?')}\n")
        if len(bible) > 10:
            self._write(f"  ... and {len(bible) - 10} more entries\n")

        self._write(f"\n--- Events ({len(events)} entries) ---\n")
        for event in events[:10]:  # Limit to first 10
            self._write(f"  - [{event.get('event_type', '?')}] {event.get('summary', '?')[:60]}...\n")
        if len(events) > 10:
            self._write(f"  ... and {len(events) - 10} more events\n")

    def log_state(
        self,
        story_summary: str,
        all_user_choices: List[Dict[str, Any]],
        current_arc_step: int,
        last_paragraph: str
    ):
        """Log the current state before generation."""
        self.log_section("CURRENT STATE")

        self._write(f"Current Arc Step: {current_arc_step}\n")
        self._write(f"Total User Choices: {len(all_user_choices)}\n")

        self._write(f"\n--- Story Summary ---\n")
        self._write(f"{story_summary or '(No summary yet)'}\n")

        self._write(f"\n--- Last Paragraph ---\n")
        self._write(f"{last_paragraph[:500] if last_paragraph else '(No previous paragraph)'}...\n")

        if all_user_choices:
            self._write(f"\n--- User Choice History ---\n")
            for choice in all_user_choices[-5:]:  # Last 5 choices
                self._write(f"  [{choice.get('sequence', '?')}] {choice.get('label', '?')} ")
                self._write(f"(arc: {choice.get('advances_arc', False)})\n")

    def log_scenarist_prompt(self, system_prompt: str, user_prompt: str, paragraph_num: int):
        """Log the Scenarist prompts with token counts."""
        system_tokens = estimate_tokens(system_prompt)
        user_tokens = estimate_tokens(user_prompt)
        total_prompt_tokens = system_tokens + user_tokens

        self.log_section(f"SCENARIST PROMPT - Paragraph {paragraph_num}")

        self._write(f"Token Count: {total_prompt_tokens} (system: {system_tokens}, user: {user_tokens})\n")

        self._write(f"\n--- System Prompt ({system_tokens} tokens) ---\n")
        self._write(f"{system_prompt[:2000]}...\n" if len(system_prompt) > 2000 else f"{system_prompt}\n")

        self._write(f"\n--- User Prompt ({user_tokens} tokens) ---\n")
        self._write(f"{user_prompt}\n")

        # Track for totals
        self.total_prompt_tokens += total_prompt_tokens
        self.token_details.append({
            "type": "scenarist_prompt",
            "paragraph": paragraph_num,
            "tokens": total_prompt_tokens
        })

    def log_scenarist_raw_response(self, raw_response: str, paragraph_num: int, parse_success: bool):
        """Log the raw Scenarist LLM response for debugging parse failures."""
        self.log_section(f"SCENARIST RAW RESPONSE - Paragraph {paragraph_num}")
        self._write(f"Parse Success: {parse_success}\n\n")
        self._write(f"{raw_response[:2000]}{'...(truncated)' if len(raw_response) > 2000 else ''}\n")

    def log_scenarist_response(self, directive: Dict[str, Any], paragraph_num: int):
        """Log the Scenarist's response/directive with token count."""
        response_text = self._format_dict(directive)
        response_tokens = estimate_tokens(response_text)

        self.log_section(f"SCENARIST DIRECTIVE - Paragraph {paragraph_num}")
        self._write(f"Token Count: {response_tokens}\n\n")
        self._write(response_text + "\n")

        # Track for totals
        self.total_response_tokens += response_tokens
        self.token_details.append({
            "type": "scenarist_response",
            "paragraph": paragraph_num,
            "tokens": response_tokens
        })

    def log_writer_prompt(self, system_prompt: str, user_prompt: str, paragraph_num: int):
        """Log the Writer prompts with token counts."""
        system_tokens = estimate_tokens(system_prompt)
        user_tokens = estimate_tokens(user_prompt)
        total_prompt_tokens = system_tokens + user_tokens

        self.log_section(f"WRITER PROMPT - Paragraph {paragraph_num}")

        self._write(f"Token Count: {total_prompt_tokens} (system: {system_tokens}, user: {user_tokens})\n")

        self._write(f"\n--- System Prompt ({system_tokens} tokens) ---\n")
        self._write(f"{system_prompt}\n")

        self._write(f"\n--- User Prompt ({user_tokens} tokens) ---\n")
        self._write(f"{user_prompt}\n")

        # Track for totals
        self.total_prompt_tokens += total_prompt_tokens
        self.token_details.append({
            "type": "writer_prompt",
            "paragraph": paragraph_num,
            "tokens": total_prompt_tokens
        })

    def log_writer_output(self, paragraph_text: str, paragraph_num: int):
        """Log the Writer's generated paragraph with token count."""
        response_tokens = estimate_tokens(paragraph_text)

        self.log_section(f"WRITER OUTPUT - Paragraph {paragraph_num}")
        self._write(f"Token Count: {response_tokens}\n\n")
        self._write(f"{paragraph_text}\n")

        # Track for totals
        self.total_response_tokens += response_tokens
        self.token_details.append({
            "type": "writer_response",
            "paragraph": paragraph_num,
            "tokens": response_tokens
        })

    def log_summary_update(self, old_summary: str, new_summary: str, paragraph_num: int):
        """Log the summary condensation."""
        self.log_section(f"SUMMARY UPDATE - After Paragraph {paragraph_num}")
        self._write(f"--- Previous Summary ---\n{old_summary[:500] if old_summary else '(none)'}...\n\n")
        self._write(f"--- New Summary ---\n{new_summary[:500]}...\n")

    def log_extraction(self, bible_updates: List[Dict], event_updates: List[Dict], paragraph_num: int):
        """Log the extraction results."""
        self.log_section(f"EXTRACTION RESULTS - Paragraph {paragraph_num}")

        self._write(f"Bible Updates: {len(bible_updates)}\n")
        for entry in bible_updates:
            self._write(f"  + [{entry.get('category', '?')}] {entry.get('name', '?')}\n")

        self._write(f"\nEvent Updates: {len(event_updates)}\n")
        for event in event_updates:
            self._write(f"  + [{event.get('event_type', '?')}] {event.get('summary', '?')[:60]}\n")

    def log_structured_arc(self, arc: List[Dict[str, Any]], source: str = "parsed"):
        """Log the structured story arc.

        Args:
            arc: List of arc step dictionaries
            source: Where the arc came from - "parsed", "generated", or "existing"
        """
        self.log_section(f"STRUCTURED ARC ({source})")
        self._write(f"Total Steps: {len(arc)}\n\n")
        for step in arc:
            step_num = step.get("step", "?")
            name = step.get("name", "Unnamed")
            desc = step.get("description", "No description")
            locked = step.get("locked", False)
            self._write(f"Step {step_num}: {name}")
            if locked:
                self._write(" [LOCKED]")
            self._write(f"\n  {desc[:200]}{'...' if len(desc) > 200 else ''}\n\n")

    def log_arc_parsing(self, raw_text: str, parsed_result: List[Dict[str, Any]] = None, error: str = None):
        """Log the arc parsing attempt for debugging.

        Args:
            raw_text: The raw arc text or LLM response
            parsed_result: The parsed result if successful
            error: Error message if parsing failed
        """
        self.log_section("ARC PARSING ATTEMPT")
        self._write(f"--- Raw Input (first 500 chars) ---\n{raw_text[:500]}{'...' if len(raw_text) > 500 else ''}\n\n")
        if parsed_result:
            self._write(f"--- Parse Success: {len(parsed_result)} steps ---\n")
            for step in parsed_result[:3]:  # Show first 3 steps
                self._write(f"  Step {step.get('step', '?')}: {step.get('name', '?')}\n")
            if len(parsed_result) > 3:
                self._write(f"  ... and {len(parsed_result) - 3} more steps\n")
        elif error:
            self._write(f"--- Parse Failed ---\n{error}\n")

    def log_choices(self, choices: List[Dict[str, Any]]):
        """Log the generated choices."""
        self.log_section("GENERATED CHOICES")
        for i, choice in enumerate(choices, 1):
            self._write(f"{i}. {choice.get('label', '?')}\n")
            self._write(f"   {choice.get('description', '?')}\n")
            self._write(f"   Advances Arc: {choice.get('advances_arc', False)}\n\n")

    def log_completion(self, total_paragraphs: int, duration_seconds: float):
        """Log the completion of the generation session with token summary."""
        self.log_section("SESSION COMPLETE")
        self._write(f"Total Paragraphs Generated: {total_paragraphs}\n")
        self._write(f"Duration: {duration_seconds:.2f} seconds\n")
        self._write(f"Completed at: {datetime.now().isoformat()}\n")

        # Token summary
        total_tokens = self.total_prompt_tokens + self.total_response_tokens
        self._write(f"\n{'─' * 40}\n")
        self._write(f"│ TOKEN SUMMARY (estimated)\n")
        self._write(f"{'─' * 40}\n")
        self._write(f"Total Prompt Tokens:   {self.total_prompt_tokens:,}\n")
        self._write(f"Total Response Tokens: {self.total_response_tokens:,}\n")
        self._write(f"Grand Total:           {total_tokens:,}\n")

        # Breakdown by type
        self._write(f"\n--- Breakdown by Operation ---\n")

        # Group by type
        scenarist_prompts = sum(d["tokens"] for d in self.token_details if d["type"] == "scenarist_prompt")
        scenarist_responses = sum(d["tokens"] for d in self.token_details if d["type"] == "scenarist_response")
        writer_prompts = sum(d["tokens"] for d in self.token_details if d["type"] == "writer_prompt")
        writer_responses = sum(d["tokens"] for d in self.token_details if d["type"] == "writer_response")

        self._write(f"Scenarist Prompts:   {scenarist_prompts:,} tokens\n")
        self._write(f"Scenarist Responses: {scenarist_responses:,} tokens\n")
        self._write(f"Writer Prompts:      {writer_prompts:,} tokens\n")
        self._write(f"Writer Responses:    {writer_responses:,} tokens\n")

        # Per-paragraph breakdown
        self._write(f"\n--- Per-Paragraph Breakdown ---\n")
        paragraphs_seen = set()
        for detail in self.token_details:
            p = detail.get("paragraph")
            if p and p not in paragraphs_seen:
                paragraphs_seen.add(p)
                para_tokens = sum(d["tokens"] for d in self.token_details if d.get("paragraph") == p)
                self._write(f"Paragraph {p}: {para_tokens:,} tokens\n")

    def log_error(self, error: str, context: str = ""):
        """Log an error."""
        self.log_section("ERROR")
        if context:
            self._write(f"Context: {context}\n")
        self._write(f"Error: {error}\n")
