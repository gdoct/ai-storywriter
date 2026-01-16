"""
Prompt Construction Node
Builds final story generation prompt from all processed components
"""

import logging
from typing import Dict, Any
from ..models.response_models import StoryStreamingEvent
from ..prompts import PromptRepository

logger = logging.getLogger(__name__)


async def prompt_construction_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build final story generation prompt from all processed components
    """
    try:
        streaming_events = []
        current_step = state.get("current_step", 0) + 1
        total_steps = state.get("total_steps", 1)
        
        # Emit progress update
        streaming_events.append(StoryStreamingEvent(
            type="progress",
            step="prompt_construction",
            progress=current_step / total_steps,
            message="Building story generation prompt"
        ))
        
        # Initialize prompt repository
        prompt_repo = PromptRepository()
        
        # Build context from all processed components
        scenario_data = _build_scenario_context(state)
        context = prompt_repo.build_context_from_scenario(scenario_data)

        # Add max_tokens to context for length guidance in prompts
        generation_options = state.get("generation_options", {})
        context["max_tokens"] = generation_options.get("max_tokens", 2000)

        # Generate system and user prompts
        system_prompt = prompt_repo.get_system_prompt(context)
        user_prompt = prompt_repo.get_story_generation_prompt(context)

        # Combine prompts
        final_prompt = f"System: {system_prompt}\n\nUser: {user_prompt}"

        # Update processing summary
        processing_summary = state.get("processing_summary", {})
        processing_summary["nodes_processed"] = processing_summary.get("nodes_processed", 0) + 1
        
        result_state = {
            **state,
            "final_prompt": final_prompt,
            "system_prompt": system_prompt,
            "user_prompt": user_prompt,
            "prompt_context": context,
            "current_step": current_step,
            "streaming_events": streaming_events,
            "processing_summary": processing_summary
        }

        return result_state
        
    except Exception as e:
        logger.error(f"Prompt construction failed: {str(e)}")
        return {
            **state,
            "error": f"Prompt construction failed: {str(e)}",
            "streaming_events": [StoryStreamingEvent(
                type="error",
                error=f"Prompt construction failed: {str(e)}"
            )]
        }


def _build_scenario_context(state: Dict[str, Any]) -> Dict[str, Any]:
    """Build scenario context from all processed state components"""
    scenario = state.get("scenario", {})

    # Start with original scenario
    context = dict(scenario)
    
    # Override with processed components if available
    if "processed_general" in state:
        general = state["processed_general"]
        context.update({
            "title": general.get("title"),
            "synopsis": general.get("synopsis"),
            "writing_style": general.get("writing_style", {})
        })
    
    if "processed_characters" in state:
        context["characters"] = state["processed_characters"]
    
    if "processed_locations" in state:
        context["locations"] = state["processed_locations"]
    
    # Add processed backstory, storyarc, notes (extract content from dict if needed)
    for key, state_key in [
        ("backstory", "processed_backstory"),
        ("storyarc", "processed_storyarc"),
        ("notes", "processed_notes"),
    ]:
        processed_value = state.get(state_key)
        if processed_value is not None:
            # These processed nodes return {"content": ..., "word_count": ...}
            if isinstance(processed_value, dict) and "content" in processed_value:
                context[key] = processed_value["content"]
            else:
                context[key] = processed_value

    # Timeline needs special handling - extract story_events list
    if state.get("processed_timeline") is not None:
        processed_timeline = state["processed_timeline"]
        if isinstance(processed_timeline, dict) and "story_events" in processed_timeline:
            context["timeline"] = processed_timeline["story_events"]
        else:
            context["timeline"] = processed_timeline

    # Custom prompts - extract the relevant fields
    if state.get("processed_custom_prompts") is not None:
        context["prompt_settings"] = state["processed_custom_prompts"]

    # Fill-in - this already has the right structure (beginning, ending)
    if state.get("processed_fillin") is not None:
        context["fill_in"] = state["processed_fillin"]
    
    return context