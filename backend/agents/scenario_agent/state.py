from typing import Any, Dict, List, Optional, TypedDict
from pydantic import BaseModel


class AgentState(TypedDict):
    """State object for the scenario agent"""
    messages: List[Dict[str, Any]]
    scenario: Optional[Dict[str, Any]]
    user_input: str
    current_response: str
    next_node: Optional[str]
    streaming_response: List[str]
    tool_calls: List[Dict[str, Any]]
    category: Optional[str]
    classification_result: Optional[Dict[str, Any]]
    classification_attempts: Optional[int]
    user_id: Optional[str]
    follow_up_questions: Optional[List[str]]
    streaming_action: Optional[str]
    # New detailed classification fields
    action: Optional[str]  # "details", "modification", "creation", "general_conversation"
    target: Optional[str]  # "scenario", "character", "location", "backstory", "storyarc", "writingStyle", "notes", "general"
    classified_prompt: Optional[str]  # The cleaned/processed prompt text
    # Multi-operation support
    operations: Optional[List[Dict[str, Any]]]  # Array of operations to execute
    current_operation_index: Optional[int]  # Index of currently executing operation
    is_multi_operation: Optional[bool]  # Whether this is a multi-operation request
    # Context tracking
    conversation_context: Optional[Dict[str, Any]]  # Extracted context from conversation history
    referenced_entities: Optional[Dict[str, Any]]  # Entities mentioned in recent conversation


class StreamingMessage(BaseModel):
    """Message for streaming responses to client"""
    type: str  # "status", "chat", "tool_call"
    content: str
    metadata: Optional[Dict[str, Any]] = None


class ToolCall(BaseModel):
    """Tool call for scenario operations"""
    action: str  # "update_scenario", "generate_character", "generate_location", "create_scenario"
    parameters: Dict[str, Any]
    status: str = "pending"  # "pending", "executing", "completed", "failed"