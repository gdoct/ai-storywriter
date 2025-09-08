from pydantic import BaseModel
from typing import Optional, Dict, Any

class CharacterFromPhotoResponse(BaseModel):
    success: bool
    character: Dict[str, Any]
    photoId: str
    photoUrl: str
    message: str

class UploadPhotoResponse(BaseModel):
    photoId: str
    photoUrl: str
    message: str

class DeletePhotoResponse(BaseModel):
    success: bool
    message: str

class GenerateFieldResponse(BaseModel):
    success: bool
    field_value: str
    message: str

class ErrorResponse(BaseModel):
    error: str