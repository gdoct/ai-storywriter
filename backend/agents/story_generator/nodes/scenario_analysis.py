"""
Scenario Analysis Node
Analyzes and validates scenario structure, determines processing strategy
"""

import logging
from typing import Dict, Any, List
from ..models.response_models import StoryStreamingEvent

logger = logging.getLogger(__name__)


async def scenario_analysis_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze scenario structure and determine processing strategy
    """
    try:
        scenario = state.get("scenario")
        if scenario is None:
            raise ValueError("Scenario data is missing from request")

        # Ensure scenario is a dict
        if not isinstance(scenario, dict):
            raise ValueError("Scenario data must be a dictionary")

        streaming_events = []

        # Emit status update
        streaming_events.append(StoryStreamingEvent(
            type="status",
            message="Analyzing scenario structure..."
        ))

        # Analyze available components
        analysis = {
            "has_title": bool(scenario.get("title")),
            "has_synopsis": bool(scenario.get("synopsis")),
            "has_writing_style": bool(scenario.get("writing_style")),
            "character_count": len(scenario.get("characters", [])),
            "location_count": len(scenario.get("locations", [])),
            "has_backstory": bool(scenario.get("backstory")),
            "has_storyarc": bool(scenario.get("storyarc")),
            "timeline_event_count": len(scenario.get("timeline", [])),
            "has_notes": bool(scenario.get("notes")),
            "has_custom_prompts": bool(scenario.get("prompt_settings")),
            "has_fill_in": bool((scenario.get("fill_in") or {}).get("beginning") or
                                (scenario.get("fill_in") or {}).get("ending")),
            "multimodal_content": _detect_multimodal_content(scenario)
        }

        # Determine nodes to process
        nodes_to_process = []
        if analysis["has_title"] or analysis["has_synopsis"] or analysis["has_writing_style"]:
            nodes_to_process.append("general_processing")
        if analysis["character_count"] > 0:
            nodes_to_process.append("characters_processing")
        if analysis["location_count"] > 0:
            nodes_to_process.append("locations_processing")
        if analysis["has_backstory"]:
            nodes_to_process.append("backstory_processing")
        if analysis["has_storyarc"]:
            nodes_to_process.append("storyarc_processing")
        if analysis["timeline_event_count"] > 0:
            nodes_to_process.append("timeline_processing")
        if analysis["has_notes"]:
            nodes_to_process.append("notes_processing")
        if analysis["has_custom_prompts"]:
            nodes_to_process.append("custom_prompts_processing")
        if analysis["has_fill_in"]:
            nodes_to_process.append("fillin_processing")

        # Always include these
        nodes_to_process.extend(["prompt_construction", "story_generation", "output_formatting"])

        # Calculate total steps for progress tracking
        total_steps = len(nodes_to_process)

        # Log analysis results
        logger.info(f"Scenario analysis complete. Processing {total_steps} nodes: {nodes_to_process}")

        # Validate minimum requirements
        if not (analysis["has_title"] or analysis["has_synopsis"] or
                analysis["character_count"] > 0 or analysis["has_backstory"]):
            raise ValueError("Scenario must have at least a title, synopsis, characters, or backstory to generate a story")

        return {
            **state,
            "analysis": analysis,
            "nodes_to_process": nodes_to_process,
            "total_steps": total_steps,
            "current_step": 0,
            "streaming_events": streaming_events,
            "processing_summary": {
                "nodes_processed": 0,
                "characters": analysis["character_count"],
                "locations": analysis["location_count"],
                "timeline_events": analysis["timeline_event_count"],
                "has_backstory": analysis["has_backstory"],
                "has_storyarc": analysis["has_storyarc"],
                "has_notes": analysis["has_notes"],
                "has_custom_prompts": analysis["has_custom_prompts"],
                "has_fill_in": analysis["has_fill_in"]
            }
        }

    except Exception as e:
        logger.error(f"Scenario analysis failed: {str(e)}")
        return {
            **state,
            "error": f"Scenario analysis failed: {str(e)}",
            "streaming_events": [StoryStreamingEvent(
                type="error",
                error=f"Scenario analysis failed: {str(e)}"
            )]
        }


def _detect_multimodal_content(scenario: Dict[str, Any]) -> bool:
    """Detect if scenario contains multimodal content (images)"""
    # Check characters for photo data
    for character in scenario.get("characters", []):
        if character.get("photo_data") or character.get("photo_url"):
            return True

    # Check locations for image data
    for location in scenario.get("locations", []):
        if location.get("image_data") or location.get("image_url"):
            return True

    return False