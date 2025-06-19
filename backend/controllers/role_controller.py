"""
Role Management Controller for StoryWriter
Handles administrative role assignment and management endpoints.
"""

import logging

from data.repositories import UserRepository
from flask import Blueprint, jsonify, request
from middleware.auth_middleware import get_current_user, require_role
from services.role_manager import RoleManager

logger = logging.getLogger(__name__)

roles_bp = Blueprint('roles', __name__)

@roles_bp.route('/api/admin/roles/users/<user_id>', methods=['GET'])
@require_role(['admin'])
def get_user_roles(user_id):
    """Get roles for a specific user"""
    try:
        # Check if user exists
        user = UserRepository.get_user_with_roles(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get role history
        role_history = RoleManager.get_role_history(user_id)
        
        return jsonify({
            'user_id': user_id,
            'username': user['username'],
            'active_roles': user['roles'],
            'role_history': role_history
        })
        
    except Exception as e:
        logger.error(f"Error getting user roles: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@roles_bp.route('/api/admin/roles/grant', methods=['POST'])
@require_role(['admin'])
def grant_role():
    """Grant a role to a user"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        role = data.get('role')
        
        if not user_id or not role:
            return jsonify({'error': 'user_id and role are required'}), 400
        
        if role not in ['moderator', 'admin']:
            return jsonify({'error': 'Invalid role. Must be moderator or admin'}), 400
        
        # Check if target user exists
        target_user = UserRepository.get_user_with_roles(user_id)
        if not target_user:
            return jsonify({'error': 'Target user not found'}), 404
        
        # Get current admin user
        current_user = get_current_user()
        granted_by = current_user['user_id']
        
        # Grant the role
        success = RoleManager.grant_role(user_id, role, granted_by)
        
        if success:
            logger.info(f"Role {role} granted to user {user_id} by {current_user['username']}")
            return jsonify({
                'message': f'Role {role} granted successfully',
                'user_id': user_id,
                'role': role,
                'granted_by': current_user['username']
            })
        else:
            return jsonify({'error': 'Failed to grant role'}), 500
            
    except Exception as e:
        logger.error(f"Error granting role: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@roles_bp.route('/api/admin/roles/revoke', methods=['POST'])
@require_role(['admin'])
def revoke_role():
    """Revoke a role from a user"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        role = data.get('role')
        
        if not user_id or not role:
            return jsonify({'error': 'user_id and role are required'}), 400
        
        # Check if target user exists
        target_user = UserRepository.get_user_with_roles(user_id)
        if not target_user:
            return jsonify({'error': 'Target user not found'}), 404
        
        # Get current admin user
        current_user = get_current_user()
        revoked_by = current_user['user_id']
        
        # Prevent self-revocation of admin role (to avoid lockout)
        if user_id == current_user['user_id'] and role == 'admin':
            return jsonify({'error': 'Cannot revoke your own admin role'}), 400
        
        # Revoke the role
        success = RoleManager.revoke_role(user_id, role, revoked_by)
        
        if success:
            logger.info(f"Role {role} revoked from user {user_id} by {current_user['username']}")
            return jsonify({
                'message': f'Role {role} revoked successfully',
                'user_id': user_id,
                'role': role,
                'revoked_by': current_user['username']
            })
        else:
            return jsonify({'error': 'Role not found or already revoked'}), 404
            
    except Exception as e:
        logger.error(f"Error revoking role: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@roles_bp.route('/api/admin/roles/<role>/users', methods=['GET'])
@require_role(['admin'])
def list_users_with_role(role):
    """List all users with a specific role"""
    try:
        if role not in ['moderator', 'admin']:
            return jsonify({'error': 'Invalid role'}), 400
        
        users = RoleManager.list_users_with_role(role)
        
        return jsonify({
            'role': role,
            'users': users,
            'count': len(users)
        })
        
    except Exception as e:
        logger.error(f"Error listing users with role {role}: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@roles_bp.route('/api/admin/users', methods=['GET'])
@require_role(['admin'])
def list_all_users():
    """List all users with pagination"""
    try:
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)  # Max 100 per page
        include_deleted = request.args.get('include_deleted', 'false').lower() == 'true'
        
        offset = (page - 1) * per_page
        
        users = UserRepository.list_all_users(
            limit=per_page, 
            offset=offset, 
            include_deleted=include_deleted
        )
        total_count = UserRepository.count_users(include_deleted=include_deleted)
        
        return jsonify({
            'users': users,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total_count,
                'pages': (total_count + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@roles_bp.route('/api/admin/users/<user_id>/tier', methods=['PUT'])
@require_role(['admin'])
def update_user_tier(user_id):
    """Update a user's tier"""
    try:
        data = request.get_json()
        new_tier = data.get('tier')
        
        if not new_tier:
            return jsonify({'error': 'tier is required'}), 400
        
        if new_tier not in ['free', 'byok', 'premium']:
            return jsonify({'error': 'Invalid tier. Must be free, byok, or premium'}), 400
        
        # Check if user exists
        user = UserRepository.get_user_with_roles(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update tier
        UserRepository.update_user_tier(user_id, new_tier)
        
        current_user = get_current_user()
        logger.info(f"User {user_id} tier updated to {new_tier} by {current_user['username']}")
        
        return jsonify({
            'message': 'User tier updated successfully',
            'user_id': user_id,
            'old_tier': user['tier'],
            'new_tier': new_tier
        })
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error updating user tier: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@roles_bp.route('/api/admin/users/find/<email>', methods=['GET'])
@require_role(['admin'])
def find_user(email):
    """Find a user by email"""
    try:
        user = UserRepository.get_user_by_email(email)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user_id': user['user_id'],
            'username': user['username'],
            'email': user.get('email'),
            'tier': user['tier'],
            'roles': user['roles']
        })
        
    except Exception as e:
        logger.error(f"Error finding user: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@roles_bp.route('/api/admin/users/<user_id>', methods=['DELETE'])
@require_role(['admin'])
def delete_user(user_id):
    """Soft delete a user account"""
    try:
        # Check if user exists
        user = UserRepository.get_user_with_roles(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        current_user = get_current_user()
        
        # Prevent self-deletion
        if user_id == current_user['user_id']:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        # Soft delete the user
        UserRepository.delete_user(user_id)
        
        logger.info(f"User {user_id} deleted by {current_user['username']}")
        
        return jsonify({
            'message': 'User deleted successfully',
            'user_id': user_id
        })
        
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@roles_bp.route('/api/me/profile', methods=['GET'])
@require_role()  # Any authenticated user
def get_current_user_profile():
    """Get current user's profile with roles and permissions"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User context not available'}), 500
        
        return jsonify({
            'user_id': user['user_id'],
            'username': user['username'],
            'email': user.get('email'),
            'tier': user['tier'],
            'roles': user['roles'],
            'permissions': user['permissions'],
            'created_at': user['profile'].get('created_at') if user.get('profile') else None
        })
        
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        return jsonify({'error': 'Internal server error'}), 500
