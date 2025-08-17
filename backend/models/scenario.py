from pydantic import BaseModel
from typing import Any, Dict, List, Optional

class ScenarioBase(BaseModel):
    title: str
    synopsis: Optional[str] = ""

class ScenarioCreate(BaseModel):
    title: str
    # Allow any additional fields for scenario data
    class Config:
        extra = "allow"

class ScenarioUpdate(BaseModel):
    title: Optional[str] = None
    # Allow any additional fields for scenario data
    class Config:
        extra = "allow"

class ScenarioListItem(BaseModel):
    id: str
    title: str
    synopsis: str

class ScenarioResponse(BaseModel):
    id: str
    title: str
    # Allow any additional fields from the stored JSON
    class Config:
        extra = "allow"

class StoryPreview(BaseModel):
    id: str
    preview_text: str
    word_count: int
    created_at: str

class StoryDetail(BaseModel):
    id: str
    text: str
    word_count: int
    created_at: str
    scenario_id: str

class DeleteResponse(BaseModel):
    success: bool