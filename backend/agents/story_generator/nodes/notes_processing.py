"""Notes Processing Node - processes notes from NotesTab"""

import logging
from typing import Dict, Any
from ..models.response_models import StoryStreamingEvent

logger = logging.getLogger(__name__)

async def notes_processing_node(state: Dict[str, Any]) -> Dict[str, Any]:
    try:
        notes = state.get("scenario", {}).get("notes", "")
        streaming_events = []
        current_step = state.get("current_step", 0) + 1
        total_steps = state.get("total_steps", 1)

        streaming_events.append(StoryStreamingEvent(
            type="progress",
            step="notes_processing",
            progress=current_step / total_steps,
            message="Processing additional notes and context"
        ))

        processed_notes = {
            "content": notes.strip(),
            "word_count": len(notes.split()) if notes else 0,
            "has_content": bool(notes.strip())
        }

        processing_summary = state.get("processing_summary", {})
        processing_summary["nodes_processed"] = processing_summary.get("nodes_processed", 0) + 1

        return {
            **state,
            "processed_notes": processed_notes,
            "current_step": current_step,
            "streaming_events": streaming_events,
            "processing_summary": processing_summary
        }
    except Exception as e:
        return {
            **state,
            "error": f"Notes processing failed: {str(e)}",
            "streaming_events": [StoryStreamingEvent(type="error", error=str(e))]
        }