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
        
        # Generate system and user prompts
        logger.info(f"Context keys: {list(context.keys())}")
        system_prompt = prompt_repo.get_system_prompt(context)
        user_prompt = prompt_repo.get_story_generation_prompt(context)

        logger.info(f"System prompt length: {len(system_prompt)}")
        logger.info(f"User prompt length: {len(user_prompt)}")

        # Combine prompts
        final_prompt = f"System: {system_prompt}\n\nUser: {user_prompt}"

        logger.info(f"Prompt construction complete. Final prompt length: {len(final_prompt)} characters")
        logger.info(f"System prompt: {system_prompt[:200]}...")
        logger.info(f"User prompt: {user_prompt[:200]}...")
        
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

        logger.info(f"Prompt construction returning state with keys: {list(result_state.keys())}")
        logger.info(f"Returning system_prompt length: {len(result_state['system_prompt'])}")
        logger.info(f"Returning user_prompt length: {len(result_state['user_prompt'])}")

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
    
    # Add processed backstory, storyarc, etc.
    for key, state_key in [
        ("backstory", "processed_backstory"),
        ("storyarc", "processed_storyarc"),
        ("timeline", "processed_timeline"),
        ("notes", "processed_notes"),
        ("prompt_settings", "processed_custom_prompts"),
        ("fill_in", "processed_fillin")
    ]:
        if state_key in state:
            context[key] = state[state_key]
    
    return context