"""
State models for Story Generator LangGraph
"""

from typing import Dict, Any, List, Optional, TypedDict
from .response_models import StoryStreamingEvent


class StoryGeneratorState(TypedDict):
    """
    State schema for the Story Generator LangGraph workflow
    """
    # Input data
    scenario: Dict[str, Any]
    generation_options: Dict[str, Any]
    user_id: str

    # Analysis results
    analysis: Dict[str, Any]
    nodes_to_process: List[str]
    total_steps: int
    current_step: int

    # Processed data from each node
    processed_general: Optional[Dict[str, Any]]
    processed_characters: Optional[List[Dict[str, Any]]]
    processed_locations: Optional[List[Dict[str, Any]]]
    processed_backstory: Optional[Dict[str, Any]]
    processed_storyarc: Optional[Dict[str, Any]]
    processed_timeline: Optional[Dict[str, Any]]
    processed_notes: Optional[Dict[str, Any]]
    processed_custom_prompts: Optional[Dict[str, Any]]
    processed_fillin: Optional[Dict[str, Any]]

    # Context building
    narrative_context: Optional[Dict[str, Any]]
    character_context: Optional[Dict[str, Any]]
    location_context: Optional[Dict[str, Any]]

    # Final outputs
    final_prompt: Optional[str]
    generated_story: Optional[str]
    formatted_story: Optional[str]

    # LLM streaming configuration (set by story_generation_node, used by graph)
    llm_config: Optional[Dict[str, Any]]
    llm_payload: Optional[Dict[str, Any]]
    model_name: Optional[str]
    input_tokens: Optional[int]
    ready_for_streaming: Optional[bool]

    # Processing metadata
    streaming_events: List[Dict[str, Any]]
    processing_summary: Dict[str, Any]

    # Error handling
    error: Optional[str]
    complete: bool