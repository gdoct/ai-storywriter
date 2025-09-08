from pydantic import BaseModel
from typing import Dict, Any

class UploadScenarioImageResponse(BaseModel):
    imageId: str
    imageUrl: str
    scenario: Dict[str, Any]
    message: str

class DeleteScenarioImageResponse(BaseModel):
    success: bool
    message: str
    deletedFiles: int

class UploadImageWithDataResponse(BaseModel):
    scenario: Dict[str, Any]
    imageId: str
    imageUrl: str
    message: str

class ErrorResponse(BaseModel):
    error: str