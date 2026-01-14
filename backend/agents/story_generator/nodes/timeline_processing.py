"""Timeline Processing Node - processes timeline events from TimelineTab"""

import logging
from typing import Dict, Any
from ..models.response_models import StoryStreamingEvent

logger = logging.getLogger(__name__)

async def timeline_processing_node(state: Dict[str, Any]) -> Dict[str, Any]:
    try:
        timeline = state.get("scenario", {}).get("timeline", [])
        streaming_events = []
        current_step = state.get("current_step", 0) + 1
        total_steps = state.get("total_steps", 1)

        streaming_events.append(StoryStreamingEvent(
            type="progress",
            step="timeline_processing",
            progress=current_step / total_steps,
            message=f"Processing {len(timeline)} timeline events"
        ))

        # Separate story events from background events
        story_events = [e for e in timeline if e.get("include_in_story", True)]
        background_events = [e for e in timeline if not e.get("include_in_story", True)]

        processed_timeline = {
            "story_events": story_events,
            "background_events": background_events,
            "total_events": len(timeline),
            "story_event_count": len(story_events)
        }

        processing_summary = state.get("processing_summary", {})
        processing_summary["nodes_processed"] = processing_summary.get("nodes_processed", 0) + 1

        return {
            **state,
            "processed_timeline": processed_timeline,
            "current_step": current_step,
            "streaming_events": streaming_events,
            "processing_summary": processing_summary
        }
    except Exception as e:
        return {
            **state,
            "error": f"Timeline processing failed: {str(e)}",
            "streaming_events": [StoryStreamingEvent(type="error", error=str(e))]
        }