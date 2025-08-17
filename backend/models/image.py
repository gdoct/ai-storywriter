from pydantic import BaseModel
from typing import Optional

class RandomImageResponse(BaseModel):
    url: str

class ErrorResponse(BaseModel):
    error: str