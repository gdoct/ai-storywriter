"""
Output Formatting Node
Formats and finalizes story output for client consumption
"""

import logging
from typing import Dict, Any
from ..models.response_models import StoryStreamingEvent

logger = logging.getLogger(__name__)


async def output_formatting_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format and finalize story output
    """
    try:
        generated_story = state.get("generated_story", "")
        streaming_events = []
        
        # Apply any final formatting
        formatted_story = _format_story_text(generated_story)
        
        # Update processing summary with final counts
        processing_summary = state.get("processing_summary", {})
        processing_summary["nodes_processed"] = processing_summary.get("nodes_processed", 0) + 1
        
        logger.info(f"Output formatting complete. Final story length: {len(formatted_story)} characters")
        
        return {
            **state,
            "formatted_story": formatted_story,
            "complete": True,
            "streaming_events": streaming_events,
            "processing_summary": processing_summary
        }
        
    except Exception as e:
        logger.error(f"Output formatting failed: {str(e)}")
        return {
            **state,
            "error": f"Output formatting failed: {str(e)}",
            "streaming_events": [StoryStreamingEvent(
                type="error",
                error=f"Output formatting failed: {str(e)}"
            )]
        }


def _format_story_text(story: str) -> str:
    """
    Apply final formatting to the story text
    """
    if not story:
        return ""
    
    # Clean up spacing and formatting
    formatted = story.strip()
    
    # Ensure proper paragraph spacing
    formatted = formatted.replace('\n\n\n', '\n\n')
    
    # Ensure story ends with proper punctuation
    if formatted and not formatted[-1] in '.!?"':
        formatted += '.'
    
    return formatted