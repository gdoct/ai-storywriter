from typing import Any, Dict, List, Optional, TypedDict

class CharacterAgentState(TypedDict, total=False):
    """State object for the character agent workflow"""

    # Operation configuration
    operation_type: str  # "generate" or "modify"
    scenario: Dict[str, Any]
    user_id: str
    character_id: Optional[str]
    fields_to_modify: List[str]

    # Input data
    image_data: Optional[bytes]
    image_uri: Optional[str]
    generate_image: bool
    image_generation_options: Dict[str, Any]

    # Character data
    character_fields: List[Dict[str, Any]]  # List of {field_name, value, status}
    completed_fields: List[str]  # List of completed field names

    # Image analysis results
    multimodal_analysis: Optional[str]
    multimodal_error: Optional[str]

    # Image generation results
    generated_image_uri: Optional[str]
    image_generation_error: Optional[str]

    # Workflow control
    current_step: str
    streaming_events: List[Dict[str, Any]]

    # Error handling
    validation_error: Optional[str]
    character_error: Optional[str]
    error: Optional[str]