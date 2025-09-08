import os
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from infrastructure.database.repositories import UserRepository
from domain.services.role_manager import RoleManager

# JWT Configuration
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "default-dev-secret-key")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=365)

security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + JWT_ACCESS_TOKEN_EXPIRES
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            # Try 'identity' field for compatibility with flask-jwt-extended
            username = payload.get("identity")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Get user from database with roles and permissions
    user = UserRepository.get_user_by_username_with_roles(username)
    if user is None:
        raise credentials_exception
    
    # Add permissions to user object
    user_permissions = RoleManager.get_user_permissions(user['id'])
    user['permissions'] = user_permissions
    
    # Add user_id field for FastAPI router compatibility
    # Ensure both 'id' and 'user_id' are available for maximum compatibility
    user['user_id'] = user['id']  # For newer FastAPI routers
    # Keep 'id' as-is for dashboard and other existing code
    
    return user

def get_current_user(user: dict = Depends(verify_token)):
    return user

def require_permissions(required_permissions: List[str]):
    def permission_dependency(user: dict = Depends(get_current_user)):
        user_permissions = RoleManager.get_user_permissions(user['id'])
        
        # Check if user has all required permissions
        for permission in required_permissions:
            if permission not in user_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission '{permission}' required"
                )
        return user
    return permission_dependency

def require_roles(required_roles: List[str]):
    def role_dependency(user: dict = Depends(get_current_user)):
        user_roles = RoleManager.get_user_roles(user['id'])
        
        # Check if user has any of the required roles
        if not any(role in user_roles for role in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"One of roles {required_roles} required"
            )
        return user
    return role_dependency

def require_authentication():
    """Require valid authentication - any authenticated user"""
    def auth_dependency(user: dict = Depends(get_current_user)):
        return user
    return auth_dependency

# Optional authentication - returns None if no token provided
def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    if credentials is None:
        return None
    
    try:
        return verify_token(credentials)
    except HTTPException:
        return None