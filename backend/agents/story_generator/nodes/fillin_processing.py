"""Fill-in Processing Node - processes fill-in beginning/ending from FillInTab"""

import logging
from typing import Dict, Any
from ..models.response_models import StoryStreamingEvent

logger = logging.getLogger(__name__)

async def fillin_processing_node(state: Dict[str, Any]) -> Dict[str, Any]:
    try:
        fillin_data = state.get("scenario", {}).get("fill_in", {}) or {}
        streaming_events = []
        current_step = state.get("current_step", 0) + 1
        total_steps = state.get("total_steps", 1)

        streaming_events.append(StoryStreamingEvent(
            type="progress",
            step="fillin_processing",
            progress=current_step / total_steps,
            message="Processing fill-in story segments"
        ))

        # Process fill-in beginning and ending
        beginning = (fillin_data.get("beginning") or "").strip()
        ending = (fillin_data.get("ending") or "").strip()

        processed_fillin = {
            "beginning": beginning,
            "ending": ending,
            "has_beginning": bool(beginning),
            "has_ending": bool(ending),
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