from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class PublishStoryRequest(BaseModel):
    title: str = Field(..., min_length=1)
    allow_ai: bool = True
    terms_accepted: bool = Field(..., description="Must accept terms and conditions")

class PublishStoryResponse(BaseModel):
    success: bool
    market_story_id: int
    message: str

class MarketStoryListItem(BaseModel):
    id: int
    title: str
    author: str
    ai_summary: Optional[str] = None
    ai_genres: List[str] = []
    average_rating: float
    rating_count: int
    total_downloads: int
    total_donated_credits: int
    published_at: str
    is_staff_pick: bool
    image_uri: Optional[str] = None

class PaginationInfo(BaseModel):
    page: int
    per_page: int
    total: int
    pages: int

class MarketStoriesResponse(BaseModel):
    stories: List[MarketStoryListItem]
    pagination: PaginationInfo

class MarketStoryDetail(BaseModel):
    id: int
    title: str
    author: str
    content: str
    ai_summary: Optional[str] = None
    ai_genres: List[str] = []
    average_rating: float
    rating_count: int
    total_downloads: int
    total_donated_credits: int
    published_at: str
    is_staff_pick: bool
    author_id: str
    image_uri: Optional[str] = None
    scenario_json: Optional[str] = None
    user_rating: Optional[int] = None

class DownloadResponse(BaseModel):
    success: bool

class RatingRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)

class RatingResponse(BaseModel):
    success: bool
    average_rating: float
    rating_count: int

class DonationRequest(BaseModel):
    credits: int = Field(..., ge=1)

class DonationResponse(BaseModel):
    success: bool
    message: str

class StoriesListResponse(BaseModel):
    stories: List[MarketStoryListItem]

class Genre(BaseModel):
    name: str
    count: int

class GenresResponse(BaseModel):
    genres: List[Genre]

class UserCreditsResponse(BaseModel):
    credits: int
    cached: bool

class ClearCacheResponse(BaseModel):
    message: str