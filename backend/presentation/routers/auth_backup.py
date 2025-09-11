from datetime import timedelta
from fastapi import APIRouter, HTTPException, status
from domain.models.auth import LoginRequest, SignupRequest, AuthResponse, ErrorResponse, GoogleOAuthRequest, GoogleOAuthResponse, EmailConflictResponse
from infrastructure.database.repositories import UserRepository
from domain.services.role_manager import RoleManager
from domain.services.security_utils import hash_password
from domain.services.google_oauth_service import GoogleOAuthService
from api.middleware.fastapi_auth import create_access_token

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

@router.post("/google", response_model=GoogleOAuthResponse)
async def google_oauth_login(oauth_data: GoogleOAuthRequest):
    """
    Authenticate user with Google OAuth token
    """
    google_service = GoogleOAuthService()
    
    # Verify Google token and get user info
    google_info = google_service.verify_google_token(oauth_data.token)
    
    if not google_info.get('email_verified'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google email not verified"
        )
    
    google_id = google_info['google_id']
    email = google_info['email']
    
    # Check if user exists by Google ID
    user = UserRepository.get_user_by_google_id(google_id)
    is_new_user = False
    
    if not user:
        # Check if user exists by email (might be a local account)
        existing_user = UserRepository.get_user_by_email(email)
        if existing_user and existing_user['auth_provider'] == 'local':
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists. Please use regular login."
            )
        
        # Create new Google user
        username = google_service.generate_username_from_email(email, google_info)
        
        # Ensure username is unique
        counter = 1
        original_username = username
        while UserRepository.get_user_by_username(username):
            username = f"{original_username}{counter}"
            counter += 1
        
        user = UserRepository.create_google_user(
            username=username,
            email=email,
            google_id=google_id,
            profile_picture=google_info.get('picture'),
            agreed_to_terms=True  # Assume consent through Google OAuth
        )
        is_new_user = True
        
        if not user or not user['id']:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user account"
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
    
    return GoogleOAuthResponse(
        access_token=access_token,
        username=user['username'],
        email=user['email'],
        tier=user['tier'] if user['tier'] else 'free',
        roles=user_roles,
        permissions=user_permissions,
        message="Google login successful",
        is_new_user=is_new_user
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

@router.post("/google", response_model=GoogleOAuthResponse)
async def google_oauth_login(oauth_data: GoogleOAuthRequest):
    """
    Authenticate user with Google OAuth token
    """
    google_service = GoogleOAuthService()
    
    # Verify Google token and get user info
    google_info = google_service.verify_google_token(oauth_data.token)
    
    if not google_info.get('email_verified'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google email not verified"
        )
    
    google_id = google_info['google_id']
    email = google_info['email']
    
    # Check if user exists by Google ID
    user = UserRepository.get_user_by_google_id(google_id)
    is_new_user = False
    
    if not user:
        # Check if user exists by email (might be a local account)
        existing_user = UserRepository.get_user_by_email(email)
        if existing_user and existing_user['auth_provider'] == 'local':
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists. Please use regular login."
            )
        
        # Create new Google user
        username = google_service.generate_username_from_email(email, google_info)
        
        # Ensure username is unique
        counter = 1
        original_username = username
        while UserRepository.get_user_by_username(username):
            username = f"{original_username}{counter}"
            counter += 1
        
        user = UserRepository.create_google_user(
            username=username,
            email=email,
            google_id=google_id,
            profile_picture=google_info.get('picture'),
            agreed_to_terms=True  # Assume consent through Google OAuth
        )
        is_new_user = True
        
        if not user or not user['id']:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user account"
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
    
    return GoogleOAuthResponse(
        access_token=access_token,
        username=user['username'],
        email=user['email'],
        tier=user['tier'] if user['tier'] else 'free',
        roles=user_roles,
        permissions=user_permissions,
        message="Google login successful",
        is_new_user=is_new_user
    )