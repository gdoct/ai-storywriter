from datetime import timedelta
from fastapi import APIRouter, HTTPException, status
from models.auth import LoginRequest, SignupRequest, AuthResponse, ErrorResponse
from data.repositories import UserRepository
from services.role_manager import RoleManager
from services.security_utils import hash_password
from middleware.fastapi_auth import create_access_token

router = APIRouter()

@router.post("/login", response_model=AuthResponse)
async def login(credentials: LoginRequest):
    """
    Authenticate user and return JWT token
    """
    # Hash the password for comparison
    password_hash = hash_password(credentials.password)
    
    # Check if user exists
    user = UserRepository.get_user_by_email(credentials.email)
    if not user or user['password_hash'] != password_hash:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Create JWT token with 1-year expiration
    token_expiry = timedelta(days=365)
    access_token = create_access_token(
        data={"sub": user['username'], "identity": user['username']}, 
        expires_delta=token_expiry
    )
    
    # Get user roles and permissions
    user_roles = RoleManager.get_user_roles(user['id'])
    user_permissions = RoleManager.get_user_permissions(user['id'])
    
    return AuthResponse(
        access_token=access_token,
        username=user['username'],
        email=user['email'],
        tier=user['tier'] if user['tier'] else 'free',
        roles=user_roles,
        permissions=user_permissions,
        message="Login successful"
    )

@router.post("/signup", response_model=AuthResponse)
async def signup(user_data: SignupRequest):
    """
    Register new user and return JWT token
    """
    # Check if user already exists
    existing_user = UserRepository.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account unavailable"
        )

    # Hash password
    password_hash = hash_password(user_data.password)
    
    # Create new user
    user = UserRepository.create_user(
        username=user_data.username, 
        email=user_data.email, 
        password_hash=password_hash
    )
    
    if not user or not user['id']:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )

    # Create JWT token with 1-year expiration
    token_expiry = timedelta(days=365)
    access_token = create_access_token(
        data={"sub": user['username'], "identity": user['username']}, 
        expires_delta=token_expiry
    )
    
    # Get user roles and permissions
    user_roles = RoleManager.get_user_roles(user['id'])
    user_permissions = RoleManager.get_user_permissions(user['id'])
    
    return AuthResponse(
        access_token=access_token,
        username=user['username'],
        email=user['email'],
        tier=user['tier'] if user['tier'] else 'free',
        roles=user_roles,
        permissions=user_permissions,
        message="Login successful"
    )