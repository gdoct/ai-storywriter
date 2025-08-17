import logging
from fastapi import APIRouter, HTTPException, status, Depends, Query
from models.role import (
    UserRolesResponse, GrantRoleRequest, GrantRoleResponse, RevokeRoleRequest, RevokeRoleResponse,
    UsersWithRoleResponse, AllUsersResponse, UpdateUserTierRequest, UpdateUserTierResponse,
    FindUserResponse, DeleteUserResponse, CurrentUserProfileResponse
)
from data.repositories import UserRepository
from middleware.fastapi_auth import get_current_user, require_roles, require_authentication
from services.role_manager import RoleManager

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/admin/roles/users/{user_id}", response_model=UserRolesResponse)
async def get_user_roles(
    user_id: str,
    current_user: dict = Depends(require_roles(['admin']))
):
    """Get roles for a specific user"""
    try:
        # Check if user exists
        user = UserRepository.get_user_with_roles(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='User not found'
            )
        
        # Get role history
        role_history = RoleManager.get_role_history(user_id)
        
        return UserRolesResponse(
            user_id=user_id,
            username=user['username'],
            active_roles=user['roles'],
            role_history=role_history
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user roles: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Internal server error'
        )

@router.post("/admin/roles/grant", response_model=GrantRoleResponse)
async def grant_role(
    request_data: GrantRoleRequest,
    current_user: dict = Depends(require_roles(['admin']))
):
    """Grant a role to a user"""
    try:
        if request_data.role not in ['moderator', 'admin']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Invalid role. Must be moderator or admin'
            )
        
        # Check if target user exists
        target_user = UserRepository.get_user_with_roles(request_data.user_id)
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Target user not found'
            )
        
        granted_by = current_user['user_id']
        
        # Grant the role
        success = RoleManager.grant_role(request_data.user_id, request_data.role, granted_by)
        
        if success:
            logger.info(f"Role {request_data.role} granted to user {request_data.user_id} by {current_user['username']}")
            return GrantRoleResponse(
                message=f"Role {request_data.role} granted successfully",
                user_id=request_data.user_id,
                role=request_data.role,
                granted_by=current_user['username']
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail='Failed to grant role'
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error granting role: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Internal server error'
        )

@router.post("/admin/roles/revoke", response_model=RevokeRoleResponse)
async def revoke_role(
    request_data: RevokeRoleRequest,
    current_user: dict = Depends(require_roles(['admin']))
):
    """Revoke a role from a user"""
    try:
        # Check if target user exists
        target_user = UserRepository.get_user_with_roles(request_data.user_id)
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Target user not found'
            )
        
        revoked_by = current_user['user_id']
        
        # Prevent self-revocation of admin role (to avoid lockout)
        if request_data.user_id == current_user['user_id'] and request_data.role == 'admin':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Cannot revoke your own admin role'
            )
        
        # Revoke the role
        success = RoleManager.revoke_role(request_data.user_id, request_data.role, revoked_by)
        
        if success:
            logger.info(f"Role {request_data.role} revoked from user {request_data.user_id} by {current_user['username']}")
            return RevokeRoleResponse(
                message=f"Role {request_data.role} revoked successfully",
                user_id=request_data.user_id,
                role=request_data.role,
                revoked_by=current_user['username']
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Role not found or already revoked'
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error revoking role: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Internal server error'
        )

@router.get("/admin/roles/{role}/users", response_model=UsersWithRoleResponse)
async def list_users_with_role(
    role: str,
    current_user: dict = Depends(require_roles(['admin']))
):
    """List all users with a specific role"""
    try:
        if role not in ['moderator', 'admin']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Invalid role'
            )
        
        users = RoleManager.list_users_with_role(role)
        
        return UsersWithRoleResponse(
            role=role,
            users=users,
            count=len(users)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing users with role {role}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Internal server error'
        )

@router.get("/admin/users", response_model=AllUsersResponse)
async def list_all_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    include_deleted: bool = Query(False),
    current_user: dict = Depends(require_roles(['admin']))
):
    """List all users with pagination"""
    try:
        offset = (page - 1) * per_page
        
        users = UserRepository.list_all_users(
            limit=per_page, 
            offset=offset, 
            include_deleted=include_deleted
        )
        total_count = UserRepository.count_users(include_deleted=include_deleted)
        
        return AllUsersResponse(
            users=users,
            pagination={
                'page': page,
                'per_page': per_page,
                'total': total_count,
                'pages': (total_count + per_page - 1) // per_page
            }
        )
        
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Internal server error'
        )

@router.put("/admin/users/{user_id}/tier", response_model=UpdateUserTierResponse)
async def update_user_tier(
    user_id: str,
    request_data: UpdateUserTierRequest,
    current_user: dict = Depends(require_roles(['admin']))
):
    """Update a user's tier"""
    try:
        if request_data.tier not in ['free', 'byok', 'premium']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Invalid tier. Must be free, byok, or premium'
            )
        
        # Check if user exists
        user = UserRepository.get_user_with_roles(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='User not found'
            )
        
        old_tier = user['tier']
        
        # Update tier
        UserRepository.update_user_tier(user_id, request_data.tier)
        
        logger.info(f"User {user_id} tier updated to {request_data.tier} by {current_user['username']}")
        
        return UpdateUserTierResponse(
            message="User tier updated successfully",
            user_id=user_id,
            old_tier=old_tier,
            new_tier=request_data.tier
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user tier: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Internal server error'
        )

@router.get("/admin/users/find/{email}", response_model=FindUserResponse)
async def find_user(
    email: str,
    current_user: dict = Depends(require_roles(['admin']))
):
    """Find a user by email"""
    try:
        logger.info(f"Searching for user with email: {email}")
        user = UserRepository.get_user_by_email_with_roles(email)
        if not user:
            logger.warning(f"User not found with email: {email}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'User not found : {email}'
            )
        
        logger.info(f"Found user: {user.get('username', 'unknown')} with ID: {user.get('user_id', 'unknown')}")
        
        # Safely access keys with fallback
        return FindUserResponse(
            id=user.get('user_id'),  # Add 'id' field for compatibility
            user_id=user.get('user_id'),
            username=user.get('username'),
            email=user.get('email', email),
            tier=user.get('tier'),
            roles=user.get('roles', [])
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding user: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Internal server error: {str(e)}'
        )

@router.delete("/admin/users/{user_id}", response_model=DeleteUserResponse)
async def delete_user(
    user_id: str,
    current_user: dict = Depends(require_roles(['admin']))
):
    """Soft delete a user account"""
    try:
        # Check if user exists
        user = UserRepository.get_user_with_roles(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='User not found'
            )
        
        # Prevent self-deletion
        if user_id == current_user['user_id']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Cannot delete your own account'
            )
        
        # Soft delete the user
        try:
            deleted = UserRepository.delete_user(user_id)
        except Exception as e:
            logger.error(f"Error in UserRepository.delete_user: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Failed to delete user'
            )
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'User {user_id} could not be deleted or already deleted'
            )

        logger.info(f"User {user_id} deleted by {current_user['username']}")
        
        return DeleteUserResponse(
            message="User deleted successfully",
            user_id=user_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Internal server error'
        )

@router.get("/me/profile", response_model=CurrentUserProfileResponse)
async def get_current_user_profile(
    current_user: dict = Depends(require_authentication())
):
    """Get current user's profile with roles and permissions"""
    try:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail='User context not available'
            )
        
        return CurrentUserProfileResponse(
            user_id=current_user['user_id'],
            username=current_user['username'],
            email=current_user.get('email'),
            tier=current_user['tier'],
            roles=current_user['roles'],
            permissions=current_user['permissions'],
            created_at=current_user['profile'].get('created_at') if current_user.get('profile') else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Internal server error'
        )