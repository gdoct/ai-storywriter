"""Locations Processing Node - processes location data from LocationsTab"""

import logging
from typing import Dict, Any
from ..models.response_models import StoryStreamingEvent

logger = logging.getLogger(__name__)

async def locations_processing_node(state: Dict[str, Any]) -> Dict[str, Any]:
    try:
        locations = state.get("scenario", {}).get("locations", [])
        streaming_events = []
        current_step = state.get("current_step", 0) + 1
        total_steps = state.get("total_steps", 1)
        
        streaming_events.append(StoryStreamingEvent(
            type="progress",
            step="locations_processing",
            progress=current_step / total_steps,
            message=f"Processing {len(locations)} locations"
        ))
        
        processed_locations = []
        for location in locations:
            processed_loc = {
                "id": location.get("id", ""),
                "name": location.get("name", "").strip(),
                "visual_description": location.get("visual_description", "").strip(),
                "background": location.get("background", "").strip(),
                "extra_info": location.get("extra_info", "").strip(),
                "has_image": bool(location.get("image_data") or location.get("image_url"))
            }
            processed_locations.append(processed_loc)
        
        location_context = {
            "location_count": len(processed_locations),
            "location_names": [loc.get("name", "Unnamed") for loc in processed_locations],
            "has_images": any(loc.get("has_image") for loc in processed_locations)
        }
        
        processing_summary = state.get("processing_summary", {})
        processing_summary["nodes_processed"] = processing_summary.get("nodes_processed", 0) + 1
        
        return {
            **state,
            "processed_locations": processed_locations,
            "location_context": location_context,
            "current_step": current_step,
            "streaming_events": streaming_events,
            "processing_summary": processing_summary
        }
    except Exception as e:
        logger.error(f"Locations processing failed: {str(e)}")
        return {
            **state,
            "error": f"Locations processing failed: {str(e)}",
            "streaming_events": [StoryStreamingEvent(
                type="error",
                error=f"Locations processing failed: {str(e)}"
            )]
        }