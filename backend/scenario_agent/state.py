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