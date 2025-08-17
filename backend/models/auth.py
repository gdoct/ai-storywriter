from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    username: str = Field(..., min_length=3)

class AuthResponse(BaseModel):
    access_token: str
    username: str
    email: str
    tier: str = "free"
    roles: List[str] = []
    permissions: List[str] = []
    message: str

class ErrorResponse(BaseModel):
    error: str