"""Backstory Processing Node - processes backstory from BackstoryTab"""

import logging
from typing import Dict, Any
from ..models.response_models import StoryStreamingEvent

logger = logging.getLogger(__name__)

async def backstory_processing_node(state: Dict[str, Any]) -> Dict[str, Any]:
    try:
        backstory = state.get("scenario", {}).get("backstory", "")
        streaming_events = []
        current_step = state.get("current_step", 0) + 1
        total_steps = state.get("total_steps", 1)
        
        streaming_events.append(StoryStreamingEvent(
            type="progress",
            step="backstory_processing",
            progress=current_step / total_steps,
            message="Integrating backstory context"
        ))
        
        processed_backstory = {
            "content": backstory.strip(),
            "word_count": len(backstory.split()) if backstory else 0
        }
        
        processing_summary = state.get("processing_summary", {})
        processing_summary["nodes_processed"] = processing_summary.get("nodes_processed", 0) + 1
        
        return {
            **state,
            "processed_backstory": processed_backstory,
            "current_step": current_step,
            "streaming_events": streaming_events,
            "processing_summary": processing_summary
        }
    except Exception as e:
        return {
            **state,
            "error": f"Backstory processing failed: {str(e)}",
            "streaming_events": [StoryStreamingEvent(type="error", error=str(e))]
        }
