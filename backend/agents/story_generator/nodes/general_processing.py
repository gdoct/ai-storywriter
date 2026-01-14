"""
General Processing Node
Processes title, synopsis, and style settings from GeneralTab
"""

import logging
from typing import Dict, Any, List
from ..models.response_models import StoryStreamingEvent

logger = logging.getLogger(__name__)


async def general_processing_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process general scenario information (title, synopsis, style settings)
    """
    try:
        scenario = state.get("scenario", {})
        streaming_events = []
        current_step = state.get("current_step", 0) + 1
        total_steps = state.get("total_steps", 1)

        # Emit progress update
        streaming_events.append(StoryStreamingEvent(
            type="progress",
            step="general_processing",
            progress=current_step / total_steps,
            message="Processing title and style settings"
        ))

        # Process title and synopsis
        processed_general = {
            "title": _process_title(scenario.get("title")),
            "synopsis": _process_synopsis(scenario.get("synopsis")),
            "writing_style": _process_writing_style(scenario.get("writing_style") or {})
        }

        # Extract key narrative elements
        narrative_context = {
            "genre": processed_general["writing_style"].get("genre", ""),
            "tone": processed_general["writing_style"].get("tone", ""),
            "theme": processed_general["writing_style"].get("theme", ""),
            "language": processed_general["writing_style"].get("language", "English"),
            "communication_style": processed_general["writing_style"].get("communication_style", ""),
            "perspective": _determine_perspective(processed_general["writing_style"]),
            "target_length": _determine_target_length(scenario)
        }

        logger.info(f"General processing complete. Genre: {narrative_context['genre']}, "
                   f"Tone: {narrative_context['tone']}, Language: {narrative_context['language']}")

        # Update processing summary
        processing_summary = state.get("processing_summary", {})
        processing_summary["nodes_processed"] = processing_summary.get("nodes_processed", 0) + 1

        return {
            **state,
            "processed_general": processed_general,
            "narrative_context": narrative_context,
            "current_step": current_step,
            "streaming_events": streaming_events,
            "processing_summary": processing_summary
        }

    except Exception as e:
        logger.error(f"General processing failed: {str(e)}")
        return {
            **state,
            "error": f"General processing failed: {str(e)}",
            "streaming_events": [StoryStreamingEvent(
                type="error",
                error=f"General processing failed: {str(e)}"
            )]
        }


def _process_title(title) -> str:
    """Process and validate story title"""
    if not title or title is None:
        return ""

    # Clean and format title
    processed = str(title).strip()
    # Remove excessive punctuation
    processed = processed.rstrip('.,!?;:')

    return processed


def _process_synopsis(synopsis) -> str:
    """Process and validate story synopsis"""
    if not synopsis or synopsis is None:
        return ""

    # Clean and format synopsis
    processed = str(synopsis).strip()
    # Ensure it ends with proper punctuation
    if processed and not processed[-1] in '.!?':
        processed += '.'

    return processed


def _process_writing_style(writing_style: Dict[str, Any]) -> Dict[str, Any]:
    """Process and normalize writing style settings"""
    processed = {
        "genre": (writing_style.get("genre") or "").strip(),
        "tone": (writing_style.get("tone") or "").strip(),
        "theme": (writing_style.get("theme") or "").strip(),
        "communication_style": (writing_style.get("communication_style") or "").strip(),
        "language": (writing_style.get("language") or "English").strip(),
        "other": (writing_style.get("other") or "").strip()
    }

    # Set defaults for empty values
    if not processed["genre"]:
        processed["genre"] = "General Fiction"
    if not processed["tone"]:
        processed["tone"] = "Balanced"
    if not processed["language"]:
        processed["language"] = "English"

    return processed


def _determine_perspective(writing_style: Dict[str, Any]) -> str:
    """Determine narrative perspective from style settings"""
    style = writing_style.get("style", "").lower()

    # Try to detect perspective from style or other fields
    if "first person" in style or "1st person" in style:
        return "first_person"
    elif "third person" in style or "3rd person" in style:
        return "third_person"
    elif "second person" in style or "2nd person" in style:
        return "second_person"
    else:
        # Default to third person
        return "third_person"


def _determine_target_length(scenario: Dict[str, Any]) -> str:
    """Determine target story length from scenario context"""
    # Check if there are fill-in segments (usually shorter stories)
    fill_in = scenario.get("fill_in") or {}
    if fill_in.get("beginning") or fill_in.get("ending"):
        return "short"

    # Check complexity of scenario
    complexity_score = 0
    complexity_score += len(scenario.get("characters", []))
    complexity_score += len(scenario.get("locations", []))
    complexity_score += len(scenario.get("timeline", []))

    if scenario.get("backstory"):
        complexity_score += 1
    if scenario.get("storyarc"):
        complexity_score += 1

    if complexity_score >= 8:
        return "long"
    elif complexity_score >= 4:
        return "medium"
    else:
        return "short"