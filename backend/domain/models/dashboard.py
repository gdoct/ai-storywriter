from pydantic import BaseModel
from typing import List, Optional, Any

class DashboardStats(BaseModel):
    scenariosCreated: int
    storiesGenerated: int
    storiesPublished: int
    scenariosPublished: int = 0
    modelsUsed: int = 0
    lastActivity: Optional[str] = None

class PaginationInfo(BaseModel):
    total: int
    limit: int
    offset: int
    hasMore: bool

class RecentScenario(BaseModel):
    id: str
    title: str
    created: str
    generatedStoryCount: int
    lastModified: str
    imageUrl: Optional[str] = None
    synopsis: Optional[str] = None
    characters: Optional[List[Any]] = None

class RecentScenariosResponse(BaseModel):
    scenarios: List[RecentScenario]
    pagination: PaginationInfo

class RecentStory(BaseModel):
    id: int
    scenarioId: str
    scenarioTitle: str
    created: str
    wordCount: int
    preview: str
    isPublished: bool
    imageUrl: Optional[str] = None

class RecentStoriesResponse(BaseModel):
    stories: List[RecentStory]
    pagination: PaginationInfo

class LastActivity(BaseModel):
    lastActivity: Optional[str] = None
    activityType: Optional[str] = None
    description: str