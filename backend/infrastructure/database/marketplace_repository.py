"""
Marketplace Repository for StoryWriter
Handles marketplace-related database operations including moderation support.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from infrastructure.database.db import get_db_connection

logger = logging.getLogger(__name__)

class MarketplaceRepository:
    """Repository class for marketplace operations"""
    
    @staticmethod
    def get_story_by_id(story_id: int) -> Optional[Dict[str, Any]]:
        """Get a marketplace story by ID"""
        try:
            conn = get_db_connection()
            cursor = conn.execute('''
                SELECT ms.*, u.username as author_username
                FROM market_stories ms
                JOIN users u ON ms.user_id = u.id
                WHERE ms.id = ?
            ''', (story_id,))
            story = cursor.fetchone()
            conn.close()
            return dict(story) if story else None
        except Exception as e:
            logger.error(f"Error getting story {story_id}: {e}")
            return None
    
    @staticmethod
    def remove_story(story_id: int) -> bool:
        """Remove a story from the marketplace (soft delete)"""
        try:
            conn = get_db_connection()
            # For now, we'll actually delete the story
            # In a production system, you might want to add a 'deleted' flag instead
            cursor = conn.execute('DELETE FROM market_stories WHERE id = ?', (story_id,))
            success = cursor.rowcount > 0
            conn.commit()
            conn.close()
            return success
        except Exception as e:
            logger.error(f"Error removing story {story_id}: {e}")
            return False
    
    @staticmethod
    def update_staff_pick_status(story_id: int, is_staff_pick: bool) -> bool:
        """Update the staff pick status of a story"""
        try:
            conn = get_db_connection()
            cursor = conn.execute(
                'UPDATE market_stories SET is_staff_pick = ? WHERE id = ?',
                (1 if is_staff_pick else 0, story_id)
            )
            success = cursor.rowcount > 0
            conn.commit()
            conn.close()
            return success
        except Exception as e:
            logger.error(f"Error updating staff pick status for story {story_id}: {e}")
            return False
    
    @staticmethod
    def get_recent_stories(limit: int = 10) -> List[Dict[str, Any]]:
        """Get recently published stories"""
        try:
            conn = get_db_connection()
            cursor = conn.execute('''
                SELECT ms.*, u.username as author_username
                FROM market_stories ms
                JOIN users u ON ms.user_id = u.id
                ORDER BY ms.published_at DESC
                LIMIT ?
            ''', (limit,))
            stories = [dict(row) for row in cursor.fetchall()]
            conn.close()
            return stories
        except Exception as e:
            logger.error(f"Error getting recent stories: {e}")
            return []
    
    @staticmethod
    def get_stories_with_details(page: int = 1, per_page: int = 20, include_moderation_info: bool = False) -> Dict[str, Any]:
        """Get stories with pagination and optional moderation info"""
        try:
            conn = get_db_connection()
            offset = (page - 1) * per_page
            
            # Get stories
            cursor = conn.execute('''
                SELECT ms.*, u.username as author_username
                FROM market_stories ms
                JOIN users u ON ms.user_id = u.id
                ORDER BY ms.published_at DESC
                LIMIT ? OFFSET ?
            ''', (per_page, offset))
            stories = [dict(row) for row in cursor.fetchall()]
            
            # Get total count
            count_cursor = conn.execute('SELECT COUNT(*) as count FROM market_stories')
            total_count = count_cursor.fetchone()['count']
            
            conn.close()
            
            return {
                'stories': stories,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total_count,
                    'pages': (total_count + per_page - 1) // per_page
                }
            }
        except Exception as e:
            logger.error(f"Error getting stories with details: {e}")
            return {'stories': [], 'pagination': {'page': 1, 'per_page': per_page, 'total': 0, 'pages': 0}}
    
    @staticmethod
    def flag_story(story_id: int, flagged_by: str, reason: str) -> bool:
        """Flag a story for review (placeholder for future implementation)"""
        # TODO: Implement story flagging system with dedicated table
        logger.info(f"Story {story_id} flagged by {flagged_by}: {reason}")
        return True
    
    @staticmethod
    def get_flagged_stories() -> List[Dict[str, Any]]:
        """Get stories that have been flagged for review"""
        # TODO: Implement when flagging system is in place
        return []
    
    @staticmethod
    def get_story_by_user(user_id: str) -> List[Dict[str, Any]]:
        """Get all stories published by a specific user"""
        try:
            conn = get_db_connection()
            cursor = conn.execute('''
                SELECT * FROM market_stories
                WHERE user_id = ?
                ORDER BY published_at DESC
            ''', (user_id,))
            stories = [dict(row) for row in cursor.fetchall()]
            conn.close()
            return stories
        except Exception as e:
            logger.error(f"Error getting stories for user {user_id}: {e}")
            return []
