from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class UserRolesResponse(BaseModel):
    user_id: str
    username: str
    active_roles: List[str]
    role_history: List[Dict[str, Any]]

class GrantRoleRequest(BaseModel):
    user_id: str
    role: str

class GrantRoleResponse(BaseModel):
    message: str
    user_id: str
    role: str
    granted_by: str

class RevokeRoleRequest(BaseModel):
    user_id: str
    role: str

class RevokeRoleResponse(BaseModel):
    message: str
    user_id: str
    role: str
    revoked_by: str

class UsersWithRoleResponse(BaseModel):
    role: str
    users: List[Dict[str, Any]]
    count: int

class Pagination(BaseModel):
    page: int
    per_page: int
    total: int
    pages: int

class AllUsersResponse(BaseModel):
    users: List[Dict[str, Any]]
    pagination: Pagination

class UpdateUserTierRequest(BaseModel):
    tier: str

class UpdateUserTierResponse(BaseModel):
    message: str
    user_id: str
    old_tier: str
    new_tier: str

class FindUserResponse(BaseModel):
    id: str
    user_id: str
    username: str
    email: str
    tier: str
    roles: List[str]

class DeleteUserResponse(BaseModel):
    message: str
    user_id: str

class CurrentUserProfileResponse(BaseModel):
    user_id: str
    username: str
    email: Optional[str] = None
    tier: str
    roles: List[str]
    permissions: List[str]
    created_at: Optional[str] = None

class ErrorResponse(BaseModel):
    error: str