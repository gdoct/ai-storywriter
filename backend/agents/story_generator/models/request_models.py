"""
Request models for Story Generator Agent
Based on ScenarioEditor tabs structure
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class StyleSettings(BaseModel):
    """Style settings from GeneralTab"""
    style: Optional[str] = None
    genre: Optional[str] = None
    tone: Optional[str] = None
    communication_style: Optional[str] = Field(None, alias="communicationStyle")
    theme: Optional[str] = None
    other: Optional[str] = None
    language: Optional[str] = None

    class Config:
        allow_population_by_field_name = True


class Character(BaseModel):
    """Character model from CharactersTab"""
    id: str
    name: Optional[str] = None
    alias: Optional[str] = None
    role: Optional[str] = None
    gender: Optional[str] = None
    appearance: Optional[str] = None
    backstory: Optional[str] = None
    extra_info: Optional[str] = Field(None, alias="extraInfo")
    photo_id: Optional[str] = Field(None, alias="photoId")
    photo_url: Optional[str] = Field(None, alias="photoUrl")
    photo_data: Optional[str] = Field(None, alias="photo_data")
    photo_mime_type: Optional[str] = Field(None, alias="photo_mime_type")

    class Config:
        allow_population_by_field_name = True


class Location(BaseModel):
    """Location model from LocationsTab"""
    id: str
    name: Optional[str] = None
    visual_description: Optional[str] = Field(None, alias="visualDescription")
    background: Optional[str] = None
    extra_info: Optional[str] = Field(None, alias="extraInfo")
    image_id: Optional[str] = Field(None, alias="imageId")
    image_url: Optional[str] = Field(None, alias="imageUrl")
    image_data: Optional[str] = Field(None, alias="image_data")
    image_mime_type: Optional[str] = Field(None, alias="image_mime_type")

    class Config:
        allow_population_by_field_name = True


class TimelineEventConnections(BaseModel):
    """Timeline event connections"""
    inputs: List[str] = []
    outputs: List[str] = []


class TimelineEventPosition(BaseModel):
    """Timeline event position"""
    x: float
    y: float


class TimelineEvent(BaseModel):
    """Timeline event from TimelineTab"""
    id: str
    title: str
    description: str
    date: str
    location: Optional[str] = None
    characters_involved: List[str] = Field(default_factory=list, alias="charactersInvolved")
    include_in_story: bool = Field(True, alias="includeInStory")
    position: TimelineEventPosition
    connections: TimelineEventConnections = Field(default_factory=TimelineEventConnections)
    parent_id: Optional[str] = Field(None, alias="parentId")
    row: Optional[int] = None

    class Config:
        allow_population_by_field_name = True


class PromptSettings(BaseModel):
    """Custom prompt settings from CustomPromptTab"""
    system_prompt_prefix: Optional[str] = Field(None, alias="systemPromptPrefix")
    user_prompt_prefix: Optional[str] = Field(None, alias="userPromptPrefix")
    keywords: Optional[str] = None

    class Config:
        allow_population_by_field_name = True


class FillIn(BaseModel):
    """Fill-in story segments from FillInTab"""
    beginning: Optional[str] = None
    ending: Optional[str] = None


class GenerationOptions(BaseModel):
    """Story generation options"""
    model: Optional[str] = None
    temperature: float = 0.8
    max_tokens: int = 2000
    seed: Optional[int] = None
    stream: bool = True


class Scenario(BaseModel):
    """Complete scenario model matching ScenarioEditor structure"""
    id: str
    user_id: str = Field(alias="userId")
    title: Optional[str] = None
    synopsis: Optional[str] = None
    writing_style: Optional[StyleSettings] = Field(None, alias="writingStyle")
    characters: List[Character] = Field(default_factory=list)
    locations: List[Location] = Field(default_factory=list)
    backstory: Optional[str] = None
    storyarc: Optional[str] = None
    timeline: List[TimelineEvent] = Field(default_factory=list)
    notes: Optional[str] = None
    prompt_settings: Optional[PromptSettings] = Field(None, alias="promptSettings")
    fill_in: Optional[FillIn] = Field(None, alias="fillIn")

    class Config:
        allow_population_by_field_name = True


class StoryGenerationRequest(BaseModel):
    """Main request model for story generation"""
    scenario: Scenario
    generation_options: GenerationOptions = Field(default_factory=GenerationOptions, alias="generationOptions")

    class Config:
        allow_population_by_field_name = True