"""StoryArc Processing Node - processes story arc from StoryArcTab"""

import logging
from typing import Dict, Any
from ..models.response_models import StoryStreamingEvent

logger = logging.getLogger(__name__)

async def storyarc_processing_node(state: Dict[str, Any]) -> Dict[str, Any]:
    try:
        storyarc = state.get("scenario", {}).get("storyarc", "")
        streaming_events = []
        current_step = state.get("current_step", 0) + 1
        total_steps = state.get("total_steps", 1)
        
        streaming_events.append(StoryStreamingEvent(
            type="progress",
            step="storyarc_processing", 
            progress=current_step / total_steps,
            message="Processing story arc structure"
        ))
        
        processed_storyarc = {
            "content": storyarc.strip(),
            "word_count": len(storyarc.split()) if storyarc else 0
        }
        
        processing_summary = state.get("processing_summary", {})
        processing_summary["nodes_processed"] = processing_summary.get("nodes_processed", 0) + 1
        
        return {
            **state,
            "processed_storyarc": processed_storyarc,
            "current_step": current_step,
            "streaming_events": streaming_events,
            "processing_summary": processing_summary
        }
    except Exception as e:
        return {
            **state,
            "error": f"StoryArc processing failed: {str(e)}",
            "streaming_events": [StoryStreamingEvent(type="error", error=str(e))]
        }
