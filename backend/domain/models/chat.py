from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the message sender (user, assistant, system)")
    content: str = Field(..., description="Content of the message")

class ChatCompletionRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., description="List of messages in the conversation")
    model: Optional[str] = Field(default="default", description="Model to use for completion")
    temperature: Optional[float] = Field(default=0.8, ge=0.0, le=2.0, description="Sampling temperature")
    max_tokens: Optional[int] = Field(default=1024, ge=1, description="Maximum tokens in response")
    stream: Optional[bool] = Field(default=False, description="Whether to stream the response")
    top_p: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Nucleus sampling parameter")
    presence_penalty: Optional[float] = Field(default=None, ge=-2.0, le=2.0, description="Presence penalty")
    frequency_penalty: Optional[float] = Field(default=None, ge=-2.0, le=2.0, description="Frequency penalty")

class ChatCompletionResponse(BaseModel):
    choices: List[Dict[str, Any]]
    usage: Optional[Dict[str, Any]] = None
    model: str

class HealthResponse(BaseModel):
    status: str
    message: str