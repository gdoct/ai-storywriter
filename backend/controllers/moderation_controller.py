"""
Moderation Controller for StoryWriter
Handles content moderation and user management for moderators and admins.
"""

import logging
from datetime import datetime, timezone

from data.marketplace_repository import MarketplaceRepository
from data.repositories import UserRepository
from flask import Blueprint, jsonify, request
from middleware.auth_middleware import get_current_user, require_role

logger = logging.getLogger(__name__)

moderation_bp = Blueprint('moderation', __name__)

@moderation_bp.route('/api/moderate/stories/<int:story_id>', methods=['DELETE'])
@require_role(['moderator', 'admin'])
def remove_story(story_id):
    """Remove inappropriate story from marketplace"""
    try:
        # Check if story exists
        story = MarketplaceRepository.get_story_by_id(story_id)
        if not story:
            return jsonify({'error': 'Story not found'}), 404
        
        current_user = get_current_user()
        reason = request.json.get('reason', 'Content moderation') if request.json else 'Content moderation'
        
        # Remove the story
        success = MarketplaceRepository.remove_story(story_id)
        
        if success:
            # Log the moderation action
            logger.info(f"Story {story_id} removed by moderator {current_user['username']}: {reason}")
            
            # TODO: Add moderation log entry to database
            
            return jsonify({
                'message': 'Story removed successfully',
                'story_id': story_id,
                'moderated_by': current_user['username'],
                'reason': reason
            })
        else:
            return jsonify({'error': 'Failed to remove story'}), 500
            
    except Exception as e:
        logger.error(f"Error removing story {story_id}: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@moderation_bp.route('/api/moderate/stories/<int:story_id>/flag', methods=['POST'])
@require_role(['moderator', 'admin'])
def flag_story(story_id):
    """Flag story for admin review"""
    try:
        data = request.get_json()
        reason = data.get('reason', 'Flagged for review')
        
        # Check if story exists
        story = MarketplaceRepository.get_story_by_id(story_id)
        if not story:
            return jsonify({'error': 'Story not found'}), 404
        
        current_user = get_current_user()
        
        # TODO: Implement story flagging in database
        # For now, just log the action
        logger.info(f"Story {story_id} flagged by moderator {current_user['username']}: {reason}")
        
        return jsonify({
            'message': 'Story flagged successfully',
            'story_id': story_id,
            'flagged_by': current_user['username'],
            'reason': reason
        })
        
    except Exception as e:
        logger.error(f"Error flagging story {story_id}: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@moderation_bp.route('/api/moderate/users/<user_id>/suspend', methods=['POST'])
@require_role(['moderator', 'admin'])
def suspend_user(user_id):
    """Temporarily suspend user account"""
    try:
        data = request.get_json()
        duration_hours = data.get('duration_hours', 24)  # Default 24 hours
        reason = data.get('reason', 'Terms of service violation')
        
        # Check if user exists
        user = UserRepository.get_user_with_roles(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        current_user = get_current_user()
        
        # Prevent suspending admins or self-suspension
        if 'admin' in user['roles']:
            return jsonify({'error': 'Cannot suspend admin users'}), 400
        
        if user_id == current_user['user_id']:
            return jsonify({'error': 'Cannot suspend yourself'}), 400
        
        # TODO: Implement user suspension in database
        # For now, just log the action
        logger.info(f"User {user_id} suspended for {duration_hours} hours by moderator {current_user['username']}: {reason}")
        
        return jsonify({
            'message': 'User suspended successfully',
            'user_id': user_id,
            'username': user['username'],
            'duration_hours': duration_hours,
            'suspended_by': current_user['username'],
            'reason': reason
        })
        
    except Exception as e:
        logger.error(f"Error suspending user {user_id}: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@moderation_bp.route('/api/moderate/stories/<int:story_id>/staff-pick', methods=['POST'])
@require_role(['moderator', 'admin'])
def toggle_staff_pick(story_id):
    """Toggle staff pick status for a story"""
    try:
        # Check if story exists
        story = MarketplaceRepository.get_story_by_id(story_id)
        if not story:
            return jsonify({'error': 'Story not found'}), 404
        
        current_user = get_current_user()
        data = request.get_json() if request.json else {}
        is_staff_pick = data.get('is_staff_pick', not story.get('is_staff_pick', False))
        
        # Update staff pick status
        success = MarketplaceRepository.update_staff_pick_status(story_id, is_staff_pick)
        
        if success:
            action = 'added to' if is_staff_pick else 'removed from'
            logger.info(f"Story {story_id} {action} staff picks by {current_user['username']}")
            
            return jsonify({
                'message': f'Story {action} staff picks successfully',
                'story_id': story_id,
                'is_staff_pick': is_staff_pick,
                'moderated_by': current_user['username']
            })
        else:
            return jsonify({'error': 'Failed to update staff pick status'}), 500
            
    except Exception as e:
        logger.error(f"Error toggling staff pick for story {story_id}: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@moderation_bp.route('/api/moderate/dashboard', methods=['GET'])
@require_role(['moderator', 'admin'])
def get_moderation_dashboard():
    """Get moderation dashboard data"""
    try:
        # TODO: Implement comprehensive moderation dashboard
        # For now, return basic stats
        
        # Get recent stories that might need review
        recent_stories = MarketplaceRepository.get_recent_stories(limit=10)
        
        # TODO: Add flagged content, reported users, etc.
        
        return jsonify({
            'recent_stories': recent_stories,
            'flagged_content_count': 0,  # TODO: Implement
            'pending_reports': 0,  # TODO: Implement
            'recent_actions': []  # TODO: Implement moderation log
        })
        
    except Exception as e:
        logger.error(f"Error getting moderation dashboard: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@moderation_bp.route('/api/moderate/stories', methods=['GET'])
@require_role(['moderator', 'admin'])
def get_stories_for_moderation():
    """Get stories with moderation controls"""
    try:
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)
        
        # Get stories with additional moderation info
        stories = MarketplaceRepository.get_stories_with_details(
            page=page, 
            per_page=per_page,
            include_moderation_info=True
        )
        
        return jsonify(stories)
        
    except Exception as e:
        logger.error(f"Error getting stories for moderation: {e}")
        return jsonify({'error': 'Internal server error'}), 500
