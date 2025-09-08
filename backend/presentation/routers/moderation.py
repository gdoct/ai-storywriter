import logging
from fastapi import APIRouter, HTTPException, status, Depends, Query
from domain.models.moderation import (
    RemoveStoryRequest, RemoveStoryResponse, FlagStoryRequest, FlagStoryResponse,
    SuspendUserRequest, SuspendUserResponse, ToggleStaffPickRequest, ToggleStaffPickResponse,
    ModerationDashboardResponse, StoriesForModerationResponse
)
from infrastructure.database.marketplace_repository import MarketplaceRepository
from infrastructure.database.repositories import UserRepository
from api.middleware.fastapi_auth import get_current_user, require_roles

router = APIRouter()
logger = logging.getLogger(__name__)

@router.delete("/moderate/stories/{story_id}", response_model=RemoveStoryResponse)
async def remove_story(
    story_id: int,
    request_data: RemoveStoryRequest,
    current_user: dict = Depends(require_roles(['moderator', 'admin']))
):
    """Remove inappropriate story from marketplace"""
    try:
        # Check if story exists
        story = MarketplaceRepository.get_story_by_id(story_id)
        if not story:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Story not found'
            )
        
        # Remove the story
        success = MarketplaceRepository.remove_story(story_id)
        
        if success:
            # Log the moderation action
            logger.info(f"Story {story_id} removed by moderator {current_user['username']}: {request_data.reason}")
            
            # TODO: Add moderation log entry to database
            
            return RemoveStoryResponse(
                message="Story removed successfully",
                story_id=story_id,
                moderated_by=current_user['username'],
                reason=request_data.reason
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail='Failed to remove story'
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing story {story_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Internal server error'
        )

@router.post("/moderate/stories/{story_id}/flag", response_model=FlagStoryResponse)
async def flag_story(
    story_id: int,
    request_data: FlagStoryRequest,
    current_user: dict = Depends(require_roles(['moderator', 'admin']))
):
    """Flag story for admin review"""
    try:
        # Check if story exists
        story = MarketplaceRepository.get_story_by_id(story_id)
        if not story:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Story not found'
            )
        
        # TODO: Implement story flagging in database
        # For now, just log the action
        logger.info(f"Story {story_id} flagged by moderator {current_user['username']}: {request_data.reason}")
        
        return FlagStoryResponse(
            message="Story flagged successfully",
            story_id=story_id,
            flagged_by=current_user['username'],
            reason=request_data.reason
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error flagging story {story_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Internal server error'
        )

@router.post("/moderate/users/{user_id}/suspend", response_model=SuspendUserResponse)
async def suspend_user(
    user_id: str,
    request_data: SuspendUserRequest,
    current_user: dict = Depends(require_roles(['moderator', 'admin']))
):
    """Temporarily suspend user account"""
    try:
        # Check if user exists
        user = UserRepository.get_user_with_roles(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='User not found'
            )
        
        # Prevent suspending admins or self-suspension
        if 'admin' in user['roles']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Cannot suspend admin users'
            )
        
        if user_id == current_user['user_id']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Cannot suspend yourself'
            )
        
        # TODO: Implement user suspension in database
        # For now, just log the action
        logger.info(f"User {user_id} suspended for {request_data.duration_hours} hours by moderator {current_user['username']}: {request_data.reason}")
        
        return SuspendUserResponse(
            message="User suspended successfully",
            user_id=user_id,
            username=user['username'],
            duration_hours=request_data.duration_hours,
            suspended_by=current_user['username'],
            reason=request_data.reason
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error suspending user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Internal server error'
        )

@router.post("/moderate/stories/{story_id}/staff-pick", response_model=ToggleStaffPickResponse)
async def toggle_staff_pick(
    story_id: int,
    request_data: ToggleStaffPickRequest,
    current_user: dict = Depends(require_roles(['moderator', 'admin']))
):
    """Toggle staff pick status for a story"""
    try:
        # Check if story exists
        story = MarketplaceRepository.get_story_by_id(story_id)
        if not story:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Story not found'
            )
        
        # Determine new staff pick status
        is_staff_pick = request_data.is_staff_pick
        if is_staff_pick is None:
            is_staff_pick = not story.get('is_staff_pick', False)
        
        # Update staff pick status
        success = MarketplaceRepository.update_staff_pick_status(story_id, is_staff_pick)
        
        if success:
            action = 'added to' if is_staff_pick else 'removed from'
            logger.info(f"Story {story_id} {action} staff picks by {current_user['username']}")
            
            return ToggleStaffPickResponse(
                message=f"Story {action} staff picks successfully",
                story_id=story_id,
                is_staff_pick=is_staff_pick,
                moderated_by=current_user['username']
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail='Failed to update staff pick status'
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling staff pick for story {story_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Internal server error'
        )

@router.get("/moderate/dashboard", response_model=ModerationDashboardResponse)
async def get_moderation_dashboard(
    current_user: dict = Depends(require_roles(['moderator', 'admin']))
):
    """Get moderation dashboard data"""
    try:
        # TODO: Implement comprehensive moderation dashboard
        # For now, return basic stats
        
        # Get recent stories that might need review
        recent_stories = MarketplaceRepository.get_recent_stories(limit=10)
        
        # TODO: Add flagged content, reported users, etc.
        
        return ModerationDashboardResponse(
            recent_stories=recent_stories,
            flagged_content_count=0,  # TODO: Implement
            pending_reports=0,  # TODO: Implement
            recent_actions=[]  # TODO: Implement moderation log
        )
        
    except Exception as e:
        logger.error(f"Error getting moderation dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Internal server error'
        )

@router.get("/moderate/stories", response_model=StoriesForModerationResponse)
async def get_stories_for_moderation(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_roles(['moderator', 'admin']))
):
    """Get stories with moderation controls"""
    try:
        # Get stories with additional moderation info
        stories = MarketplaceRepository.get_stories_with_details(
            page=page, 
            per_page=per_page,
            include_moderation_info=True
        )
        
        return StoriesForModerationResponse(stories=stories)
        
    except Exception as e:
        logger.error(f"Error getting stories for moderation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Internal server error'
        )