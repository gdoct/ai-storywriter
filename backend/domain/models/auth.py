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

class GoogleOAuthRequest(BaseModel):
    token: str = Field(..., description="Google OAuth ID token")

class GoogleOAuthResponse(BaseModel):
    access_token: str
    username: str
    email: str
    tier: str = "free"
    roles: List[str] = []
    permissions: List[str] = []
    message: str
    is_new_user: bool = False

class EmailConflictResponse(BaseModel):
    error: str = "email_conflict"
    email: str
    message: str
    existing_user_info: dict