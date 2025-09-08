from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class RemoveStoryRequest(BaseModel):
    reason: Optional[str] = "Content moderation"

class RemoveStoryResponse(BaseModel):
    message: str
    story_id: int
    moderated_by: str
    reason: str

class FlagStoryRequest(BaseModel):
    reason: Optional[str] = "Flagged for review"

class FlagStoryResponse(BaseModel):
    message: str
    story_id: int
    flagged_by: str
    reason: str

class SuspendUserRequest(BaseModel):
    duration_hours: Optional[int] = 24
    reason: Optional[str] = "Terms of service violation"

class SuspendUserResponse(BaseModel):
    message: str
    user_id: str
    username: str
    duration_hours: int
    suspended_by: str
    reason: str

class ToggleStaffPickRequest(BaseModel):
    is_staff_pick: Optional[bool] = None

class ToggleStaffPickResponse(BaseModel):
    message: str
    story_id: int
    is_staff_pick: bool
    moderated_by: str

class ModerationDashboardResponse(BaseModel):
    recent_stories: List[Dict[str, Any]]
    flagged_content_count: int
    pending_reports: int
    recent_actions: List[Dict[str, Any]]

class StoriesForModerationResponse(BaseModel):
    stories: List[Dict[str, Any]]
    pagination: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseModel):
    error: str