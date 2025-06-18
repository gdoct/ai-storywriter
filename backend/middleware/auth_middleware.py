"""
Enhanced Authentication Middleware for StoryWriter
Provides role-based access control decorators and user context injection.
"""

import logging
from functools import wraps
from typing import Any, Dict, List, Optional

from data.repositories import UserRepository
from flask import g, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from services.role_manager import RoleManager

logger = logging.getLogger(__name__)

def require_role(required_roles: Optional[List[str]] = None, required_permissions: Optional[List[str]] = None):
    """
    Decorator that requires specific roles or permissions
    
    Args:
        required_roles: List of roles that can access this endpoint (e.g., ['admin', 'moderator'])
        required_permissions: List of permissions required (e.g., ['moderate_content'])
    """
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            try:
                # Get user identity from JWT
                username = get_jwt_identity()
                if not username:
                    return jsonify({'error': 'Invalid token'}), 401
                
                # Get user from database
                user = UserRepository.get_user_by_username(username)
                if not user:
                    return jsonify({'error': 'User not found'}), 404
                
                # Get user roles and permissions
                user_roles = RoleManager.get_user_roles(user['id'])
                user_permissions = RoleManager.get_user_permissions(user['id'])
                
                # Check role requirements
                if required_roles:
                    if not any(role in user_roles for role in required_roles):
                        logger.warning(f"User {username} attempted to access {request.endpoint} without required roles: {required_roles}")
                        return jsonify({
                            'error': 'Insufficient permissions',
                            'required_roles': required_roles,
                            'user_roles': user_roles
                        }), 403
                
                # Check permission requirements
                if required_permissions:
                    if not any(permission in user_permissions for permission in required_permissions):
                        logger.warning(f"User {username} attempted to access {request.endpoint} without required permissions: {required_permissions}")
                        return jsonify({
                            'error': 'Insufficient permissions',
                            'required_permissions': required_permissions,
                            'user_permissions': user_permissions
                        }), 403
                
                # Inject user context into request
                request.user_context = {
                    'user_id': user['id'],
                    'username': user['username'],
                    'email': user['email'],
                    'tier': user['tier'] if user['tier'] else 'free',
                    'roles': user_roles,
                    'permissions': user_permissions,
                    'profile': dict(user)
                }
                
                # Also add to Flask's g object for convenience
                g.user = request.user_context
                
                return f(*args, **kwargs)
                
            except Exception as e:
                logger.error(f"Error in role authentication for {request.endpoint}: {e}")
                return jsonify({'error': 'Authentication error'}), 500
                
        return decorated_function
    return decorator

def require_tier(required_tier: str):
    """
    Decorator that requires a specific user tier
    
    Args:
        required_tier: Required tier ('free', 'byok', 'premium')
    """
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            try:
                username = get_jwt_identity()
                user = UserRepository.get_user_by_username(username)
                
                if not user:
                    return jsonify({'error': 'User not found'}), 404
                
                user_tier = user['tier'] if user['tier'] else 'free'
                
                # Define tier hierarchy for upgrades
                tier_hierarchy = {'free': 0, 'byok': 1, 'premium': 2}
                
                if tier_hierarchy.get(user_tier, 0) < tier_hierarchy.get(required_tier, 0):
                    return jsonify({
                        'error': 'Insufficient tier',
                        'required_tier': required_tier,
                        'user_tier': user_tier
                    }), 403
                
                # Inject user context
                user_roles = RoleManager.get_user_roles(user['id'])
                user_permissions = RoleManager.get_user_permissions(user['id'])
                
                request.user_context = {
                    'user_id': user['id'],
                    'username': user['username'],
                    'email': user['email'],
                    'tier': user_tier,
                    'roles': user_roles,
                    'permissions': user_permissions,
                    'profile': dict(user)
                }
                
                g.user = request.user_context
                
                return f(*args, **kwargs)
                
            except Exception as e:
                logger.error(f"Error in tier authentication: {e}")
                return jsonify({'error': 'Authentication error'}), 500
                
        return decorated_function
    return decorator

def enhanced_jwt_required(optional_roles: Optional[List[str]] = None):
    """
    Enhanced version of jwt_required that also injects user context
    This is useful for endpoints that don't require specific roles but need user info
    
    Args:
        optional_roles: If provided, adds role info to context but doesn't enforce
    """
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            try:
                username = get_jwt_identity()
                user = UserRepository.get_user_by_username(username)
                
                if not user:
                    return jsonify({'error': 'User not found'}), 404
                
                user_roles = RoleManager.get_user_roles(user['id'])
                user_permissions = RoleManager.get_user_permissions(user['id'])
                
                request.user_context = {
                    'user_id': user['id'],
                    'username': user['username'],
                    'email': user['email'],
                    'tier': user['tier'] if user['tier'] else 'free',
                    'roles': user_roles,
                    'permissions': user_permissions,
                    'profile': dict(user)
                }
                
                g.user = request.user_context
                
                return f(*args, **kwargs)
                
            except Exception as e:
                logger.error(f"Error in enhanced JWT authentication: {e}")
                return jsonify({'error': 'Authentication error'}), 500
                
        return decorated_function
    return decorator

def get_current_user() -> Optional[Dict[str, Any]]:
    """
    Utility function to get current user context from request
    Returns None if no user context is available
    """
    return getattr(request, 'user_context', None) or getattr(g, 'user', None)

def check_user_permission(permission: str) -> bool:
    """
    Check if current user has a specific permission
    
    Args:
        permission: Permission to check
        
    Returns:
        True if user has permission, False otherwise
    """
    user = get_current_user()
    if not user:
        return False
    
    return permission in user.get('permissions', [])

def check_user_role(role: str) -> bool:
    """
    Check if current user has a specific role
    
    Args:
        role: Role to check
        
    Returns:
        True if user has role, False otherwise
    """
    user = get_current_user()
    if not user:
        return False
    
    return role in user.get('roles', [])

def check_user_tier(tier: str) -> bool:
    """
    Check if current user has at least the specified tier
    
    Args:
        tier: Minimum tier required
        
    Returns:
        True if user has sufficient tier, False otherwise
    """
    user = get_current_user()
    if not user:
        return False
    
    tier_hierarchy = {'free': 0, 'byok': 1, 'premium': 2}
    user_tier = user.get('tier', 'free')
    
    return tier_hierarchy.get(user_tier, 0) >= tier_hierarchy.get(tier, 0)
