"""Fill-in Processing Node - processes fill-in templates from FillInTab"""

import logging
from typing import Dict, Any
from ..models.response_models import StoryStreamingEvent

logger = logging.getLogger(__name__)

async def fillin_processing_node(state: Dict[str, Any]) -> Dict[str, Any]:
    try:
        fillin_data = state.get("scenario", {}).get("fillin", {})
        streaming_events = []
        current_step = state.get("current_step", 0) + 1
        total_steps = state.get("total_steps", 1)

        streaming_events.append(StoryStreamingEvent(
            type="progress",
            step="fillin_processing",
            progress=current_step / total_steps,
            message="Processing fill-in templates and user responses"
        ))

        # Process fill-in template and responses
        template = fillin_data.get("template", "").strip()
        responses = fillin_data.get("responses", {})

        processed_fillin = {
            "template": template,
            "responses": responses,
            "has_template": bool(template),
            "response_count": len(responses) if responses else 0,
            "completed_template": _apply_fillin_responses(template, responses) if template and responses else ""
        }

        processing_summary = state.get("processing_summary", {})
        processing_summary["nodes_processed"] = processing_summary.get("nodes_processed", 0) + 1

        return {
            **state,
            "processed_fillin": processed_fillin,
            "current_step": current_step,
            "streaming_events": streaming_events,
            "processing_summary": processing_summary
        }
    except Exception as e:
        return {
            **state,
            "error": f"Fill-in processing failed: {str(e)}",
            "streaming_events": [StoryStreamingEvent(type="error", error=str(e))]
        }


def _apply_fillin_responses(template: str, responses: Dict[str, str]) -> str:
    """Apply user responses to fill-in template"""
    if not template or not responses:
        return template

    completed = template
    for key, value in responses.items():
        # Replace placeholders like {{key}} or {key} with the response value
        placeholder_variants = [f"{{{{{key}}}}}", f"{{{key}}}"]
        for placeholder in placeholder_variants:
            completed = completed.replace(placeholder, value)

    return completed