from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional, Union
from fastapi import UploadFile

class CharacterGenerationRequest(BaseModel):
    """Request model for character generation"""
    scenario: Dict[str, Any] = Field(..., description="Scenario context for character generation")
    image_file: Optional[bytes] = Field(None, description="Binary image data for multimodal analysis")
    image_uri: Optional[str] = Field(None, description="URI to image for multimodal analysis")
    generate_image: bool = Field(False, description="Whether to generate a character portrait")
    image_generation_options: Optional[Dict[str, Any]] = Field(None, description="Options for image generation")

    class Config:
        extra = "allow"

class CharacterModificationRequest(BaseModel):
    """Request model for character modification"""
    scenario: Dict[str, Any] = Field(..., description="Scenario context")
    character_id: str = Field(..., description="ID of character to modify")
    fields_to_modify: List[str] = Field(..., description="List of character fields to modify")
    image_file: Optional[bytes] = Field(None, description="Binary image data for multimodal analysis")
    image_uri: Optional[str] = Field(None, description="URI to image for multimodal analysis")
    generate_image: bool = Field(False, description="Whether to generate a new character portrait")
    image_generation_options: Optional[Dict[str, Any]] = Field(None, description="Options for image generation")

    class Config:
        extra = "allow"

class CharacterField(BaseModel):
    """Individual character field with metadata"""
    field_name: str
    value: Any
    status: str = Field(default="generating", description="Status: generating, completed, error")
    error: Optional[str] = None

class CharacterResponse(BaseModel):
    """Response model for character operations"""
    character_id: Optional[str] = None
    fields: List[CharacterField] = Field(default_factory=list)
    image_uri: Optional[str] = None
    image_generation_status: Optional[str] = None
    complete: bool = False
    error: Optional[str] = None

class CharacterStreamingEvent(BaseModel):
    """Streaming event for character updates"""
    event_type: str = Field(..., description="Type: field_update, image_generated, complete, error")
    character_id: Optional[str] = None
    field: Optional[CharacterField] = None
    image_uri: Optional[str] = None
    error: Optional[str] = None
    complete: bool = False

class CharacterAgentError(BaseModel):
    """Error response for character agent"""
    error: str
    error_type: str
    details: Optional[Dict[str, Any]] = None