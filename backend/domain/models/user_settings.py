from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from enum import Enum

class LLMMode(str, Enum):
    MEMBER = "member"
    BYOK = "byok"

class BYOKProvider(str, Enum):
    OPENAI = "openai"
    GITHUB = "github"

class NotificationPreferences(BaseModel):
    email: bool = True
    marketing: bool = False

class UserSettingsRequest(BaseModel):
    username: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[str] = Field(None, pattern=r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    notifications: Optional[NotificationPreferences] = None
    llm_mode: Optional[LLMMode] = None
    byok_provider: Optional[BYOKProvider] = None

class UserSettingsResponse(BaseModel):
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    notifications: NotificationPreferences
    llm_mode: LLMMode
    byok_provider: Optional[BYOKProvider] = None

class LLMProviderPresetRequest(BaseModel):
    provider_name: str = Field(..., min_length=1)
    display_name: str = Field(..., min_length=1)
    base_url: Optional[str] = None
    is_enabled: bool = True
    credit_multiplier: float = Field(1.0, ge=0.0)
    config_json: Optional[str] = None

class LLMProviderPresetResponse(BaseModel):
    id: int
    provider_name: str
    display_name: str
    base_url: Optional[str]
    is_enabled: bool
    credit_multiplier: float
    config_json: Optional[str]
    created_at: str
    updated_at: str

class LLMAdminKeyRequest(BaseModel):
    provider_preset_id: int
    key_name: str
    encrypted_value: str

class LLMRequestLogRequest(BaseModel):
    endpoint_url: str
    provider: str
    mode: LLMMode
    tokens_sent: int = 0
    tokens_received: int = 0
    credits_used: int = 0
    duration_ms: Optional[int] = None
    status: str = "success"
    error_message: Optional[str] = None

class LLMRequestLogResponse(BaseModel):
    id: int
    user_id: str
    endpoint_url: str
    provider: str
    mode: str
    tokens_sent: int
    tokens_received: int
    total_tokens: int
    credits_used: int
    request_timestamp: str
    response_timestamp: Optional[str]
    duration_ms: Optional[int]
    status: str
    error_message: Optional[str]