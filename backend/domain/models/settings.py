from pydantic import BaseModel
from typing import Dict, Any, Optional, List

class LLMConfig(BaseModel):
    # Allow any configuration fields since different backends have different configs
    class Config:
        extra = "allow"

class LLMSettingsRequest(BaseModel):
    backend_type: str
    config: Dict[str, Any] = {}
    default_model: Optional[str] = None
    user_id: Optional[str] = None
    showThinking: Optional[bool] = False

class LLMSettingsResponse(BaseModel):
    backend_type: Optional[str]
    config: Dict[str, Any] = {}
    default_model: Optional[str] = None
    showThinking: bool = False
    id: Optional[int] = None
    user_id: Optional[str] = None
    is_active: Optional[int] = None

class LLMTestRequest(BaseModel):
    backend_type: str
    config: Dict[str, Any] = {}

class LLMTestResponse(BaseModel):
    status: str
    error: Optional[str] = None
    # Allow additional fields from test results
    class Config:
        extra = "allow"

class LLMModelsResponse(BaseModel):
    models: List[str] = []
    error: Optional[str] = None
    refreshed: Optional[bool] = None

class LLMStatusResponse(BaseModel):
    status: str
    backend_type: Optional[str] = None
    error: Optional[str] = None

class CacheInfoResponse(BaseModel):
    # Allow any cache info fields
    class Config:
        extra = "allow"

class ClearCacheResponse(BaseModel):
    cleared: bool

class VisionSettingsRequest(BaseModel):
    backend_type: Optional[str] = None
    model: Optional[str] = None

class VisionSettingsResponse(BaseModel):
    status: str
    backend_type: Optional[str] = None
    vision_config: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    error: Optional[str] = None