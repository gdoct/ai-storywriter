"""Custom Prompts Processing Node - processes custom prompts from CustomPromptsTab"""

import logging
from typing import Dict, Any
from ..models.response_models import StoryStreamingEvent

logger = logging.getLogger(__name__)

async def custom_prompts_processing_node(state: Dict[str, Any]) -> Dict[str, Any]:
    try:
        custom_prompts = state.get("scenario", {}).get("custom_prompts", {})
        streaming_events = []
        current_step = state.get("current_step", 0) + 1
        total_steps = state.get("total_steps", 1)

        streaming_events.append(StoryStreamingEvent(
            type="progress",
            step="custom_prompts_processing",
            progress=current_step / total_steps,
            message="Processing custom prompts and instructions"
        ))

        # Process different types of custom prompts
        processed_custom_prompts = {
            "system_prompt": custom_prompts.get("system_prompt", "").strip(),
            "story_prompt": custom_prompts.get("story_prompt", "").strip(),
            "style_instructions": custom_prompts.get("style_instructions", "").strip(),
            "character_instructions": custom_prompts.get("character_instructions", "").strip(),
            "plot_instructions": custom_prompts.get("plot_instructions", "").strip(),
            "has_custom_prompts": any(
                custom_prompts.get(key, "").strip()
                for key in ["system_prompt", "story_prompt", "style_instructions",
                          "character_instructions", "plot_instructions"]
            )
        }

        processing_summary = state.get("processing_summary", {})
        processing_summary["nodes_processed"] = processing_summary.get("nodes_processed", 0) + 1

        return {
            **state,
            "processed_custom_prompts": processed_custom_prompts,
            "current_step": current_step,
            "streaming_events": streaming_events,
            "processing_summary": processing_summary
        }
    except Exception as e:
        return {
            **state,
            "error": f"Custom prompts processing failed: {str(e)}",
            "streaming_events": [StoryStreamingEvent(type="error", error=str(e))]
        }