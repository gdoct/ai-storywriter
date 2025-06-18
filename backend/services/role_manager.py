"""
Role Management Service for StoryWriter
Handles role assignment, permission checking, and administrative role management.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from data.db import get_db_connection

logger = logging.getLogger(__name__)

class RoleManager:
    """Service class for managing user roles and permissions"""
    
    # Define permission mappings for each role
    ROLE_PERMISSIONS = {
        'moderator': [
            'moderate_content',
            'remove_stories',
            'suspend_users',
            'view_moderation_logs',
            'manage_user_reports'
        ],
        'admin': [
            'moderate_content',
            'remove_stories', 
            'suspend_users',
            'view_moderation_logs',
            'manage_user_reports',
            'manage_users',
            'configure_ai_backends',
            'manage_system_settings',
            'view_analytics',
            'manage_database',
            'create_announcements',
            'assign_roles'
        ]
    }
    
    @staticmethod
    def get_user_roles(user_id: str) -> List[str]:
        """Get all active roles for a user"""
        try:
            conn = get_db_connection()
            cursor = conn.execute('''
                SELECT role 
                FROM user_roles 
                WHERE user_id = ? AND revoked_at IS NULL
            ''', (user_id,))
            roles = [row['role'] for row in cursor.fetchall()]
            conn.close()
            return roles
        except Exception as e:
            logger.error(f"Error getting user roles for {user_id}: {e}")
            return []
    
    @staticmethod
    def has_role(user_id: str, role: str) -> bool:
        """Check if user has a specific role"""
        user_roles = RoleManager.get_user_roles(user_id)
        return role in user_roles
    
    @staticmethod
    def has_permission(user_id: str, permission: str) -> bool:
        """Check if user has a specific permission"""
        user_roles = RoleManager.get_user_roles(user_id)
        
        for role in user_roles:
            if permission in RoleManager.ROLE_PERMISSIONS.get(role, []):
                return True
        
        return False
    
    @staticmethod
    def get_user_permissions(user_id: str) -> List[str]:
        """Get all permissions for a user based on their roles"""
        user_roles = RoleManager.get_user_roles(user_id)
        permissions = set()
        
        for role in user_roles:
            role_permissions = RoleManager.ROLE_PERMISSIONS.get(role, [])
            permissions.update(role_permissions)
        
        return list(permissions)
    
    @staticmethod
    def grant_role(user_id: str, role: str, granted_by: str) -> bool:
        """Grant administrative role to user"""
        if role not in ['moderator', 'admin']:
            logger.warning(f"Attempted to grant invalid role: {role}")
            return False
        
        try:
            conn = get_db_connection()
            
            # Check if user already has this role
            existing = conn.execute('''
                SELECT id FROM user_roles 
                WHERE user_id = ? AND role = ? AND revoked_at IS NULL
            ''', (user_id, role)).fetchone()
            
            if existing:
                logger.info(f"User {user_id} already has role {role}")
                conn.close()
                return True
            
            # Grant the role
            now = datetime.now(timezone.utc).isoformat()
            conn.execute('''
                INSERT INTO user_roles (user_id, role, granted_by, granted_at)
                VALUES (?, ?, ?, ?)
            ''', (user_id, role, granted_by, now))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Role {role} granted to user {user_id} by {granted_by}")
            return True
            
        except Exception as e:
            logger.error(f"Error granting role {role} to user {user_id}: {e}")
            return False
    
    @staticmethod
    def revoke_role(user_id: str, role: str, revoked_by: str) -> bool:
        """Revoke administrative role from user"""
        try:
            conn = get_db_connection()
            
            # Update the role record to mark it as revoked
            now = datetime.now(timezone.utc).isoformat()
            cursor = conn.execute('''
                UPDATE user_roles 
                SET revoked_at = ?
                WHERE user_id = ? AND role = ? AND revoked_at IS NULL
            ''', (now, user_id, role))
            
            if cursor.rowcount == 0:
                logger.info(f"No active role {role} found for user {user_id}")
                conn.close()
                return False
            
            conn.commit()
            conn.close()
            
            logger.info(f"Role {role} revoked from user {user_id} by {revoked_by}")
            return True
            
        except Exception as e:
            logger.error(f"Error revoking role {role} from user {user_id}: {e}")
            return False
    
    @staticmethod
    def get_role_history(user_id: str) -> List[Dict[str, Any]]:
        """Get role assignment history for a user"""
        try:
            conn = get_db_connection()
            cursor = conn.execute('''
                SELECT ur.role, ur.granted_by, ur.granted_at, ur.revoked_at,
                       u_granted.username as granted_by_username
                FROM user_roles ur
                LEFT JOIN users u_granted ON ur.granted_by = u_granted.id
                WHERE ur.user_id = ?
                ORDER BY ur.granted_at DESC
            ''', (user_id,))
            
            history = []
            for row in cursor.fetchall():
                history.append({
                    'role': row['role'],
                    'granted_by': row['granted_by'],
                    'granted_by_username': row['granted_by_username'],
                    'granted_at': row['granted_at'],
                    'revoked_at': row['revoked_at'],
                    'is_active': row['revoked_at'] is None
                })
            
            conn.close()
            return history
            
        except Exception as e:
            logger.error(f"Error getting role history for user {user_id}: {e}")
            return []
    
    @staticmethod
    def list_users_with_role(role: str) -> List[Dict[str, Any]]:
        """List all users with a specific role"""
        try:
            conn = get_db_connection()
            cursor = conn.execute('''
                SELECT u.id, u.username, u.email, ur.granted_at, ur.granted_by
                FROM users u
                JOIN user_roles ur ON u.id = ur.user_id
                WHERE ur.role = ? AND ur.revoked_at IS NULL AND u.is_deleted = 0
                ORDER BY ur.granted_at DESC
            ''', (role,))
            
            users = []
            for row in cursor.fetchall():
                users.append({
                    'user_id': row['id'],
                    'username': row['username'],
                    'email': row['email'],
                    'granted_at': row['granted_at'],
                    'granted_by': row['granted_by']
                })
            
            conn.close()
            return users
            
        except Exception as e:
            logger.error(f"Error listing users with role {role}: {e}")
            return []
    
    @staticmethod
    def initialize_default_admin(admin_user_id: str) -> bool:
        """Initialize the first admin user (for bootstrapping)"""
        try:
            # Check if there are any existing admins
            conn = get_db_connection()
            existing_admin = conn.execute('''
                SELECT id FROM user_roles 
                WHERE role = 'admin' AND revoked_at IS NULL
                LIMIT 1
            ''').fetchone()
            
            if existing_admin:
                logger.info("Admin user already exists, skipping initialization")
                conn.close()
                return False
            
            # Grant admin role to the specified user
            now = datetime.now(timezone.utc).isoformat()
            conn.execute('''
                INSERT INTO user_roles (user_id, role, granted_by, granted_at)
                VALUES (?, ?, ?, ?)
            ''', (admin_user_id, 'admin', admin_user_id, now))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Default admin role granted to user {admin_user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error initializing default admin: {e}")
            return False
