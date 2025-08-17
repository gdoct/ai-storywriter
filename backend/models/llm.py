from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class LLMMessage(BaseModel):
    role: str = Field(..., description="Role of the message sender")
    content: str = Field(..., description="Content of the message")

class LLMCompletionRequest(BaseModel):
    messages: List[LLMMessage] = Field(..., description="List of messages")
    model: Optional[str] = Field(default="gpt-3.5-turbo", description="Model to use")
    temperature: Optional[float] = Field(default=0.8, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=1024, ge=1)
    stream: Optional[bool] = Field(default=True, description="Whether to stream response")
    top_p: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    presence_penalty: Optional[float] = Field(default=None, ge=-2.0, le=2.0)
    frequency_penalty: Optional[float] = Field(default=None, ge=-2.0, le=2.0)

class LLMModel(BaseModel):
    id: str

class LLMModelsResponse(BaseModel):
    data: List[LLMModel]

class LLMStatusResponse(BaseModel):
    busy: bool

class LLMErrorResponse(BaseModel):
    error: str