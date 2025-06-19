from datetime import timedelta

from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from flask_jwt_extended import create_access_token

from data.repositories import UserRepository
from services.role_manager import RoleManager
from services.security_utils import hash_password

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/login', methods=['POST'])
@cross_origin()
def login():
    # Get username and password from request
    request_data = request.get_json()
    
    # Check if username is present in request
    if not request_data or 'email' not in request_data:
        return jsonify({"error": "Email is required"}), 400
    
    # Extract username and other fields
    email = request_data.get('email')
    password = request_data.get('password')
    password_hash = hash_password(password) if password else None
    if not email or not password_hash:
        return jsonify({"error": "Email and password are required"}), 400
    # Check if user exists, return error if not
    user = UserRepository.get_user_by_email(email)
    if not user or user['password_hash'] != password_hash:
        return jsonify({"error": "User not found"}), 404

    # Create JWT token with 1-year expiration
    token_expiry = timedelta(days=365)  # 1 year
    access_token = create_access_token(identity=user['username'], expires_delta=token_expiry)
    
    # Get user roles and permissions
    user_roles = RoleManager.get_user_roles(user['id'])
    user_permissions = RoleManager.get_user_permissions(user['id'])
    
    # Return token in response with user profile
    return jsonify({
        "access_token": access_token,
        "username": user['username'],
        "email": user['email'],
        "tier": user['tier'] if user['tier'] else 'free',
        "roles": user_roles,
        "permissions": user_permissions,
        "message": "Login successful"
    }), 200
    
@auth_bp.route('/api/signup', methods=['POST'])
@cross_origin()
def signup():
    # Get username, email and password from request
    request_data = request.get_json()
    
    # Extract username and other fields
    email = request_data.get('email')
    password = request_data.get('password')
    username = request_data.get('username')
    if not email or not password or not username:
        return jsonify({"error": "Email, password, and username are required"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters long"}), 400
    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters long"}), 400

    # Check if user exists, return error if not
    user = UserRepository.get_user_by_email(email)
    if user:
        return jsonify({"error": "Account unavailable"}), 403

    password_hash = hash_password(password) if password else None
    # Create new user
    user = UserRepository.create_user(username=username, email=email, password_hash=password_hash)
    if not user:
        return jsonify({"error": "Failed to create user"}), 500
    if not user['id']:
        return jsonify({"error": "Failed to create user"}), 500
    # Create JWT token with 1-year expiration
    token_expiry = timedelta(days=365)  # 1 year
    access_token = create_access_token(identity=user['username'], expires_delta=token_expiry)
    
    # Get user roles and permissions
    user_roles = RoleManager.get_user_roles(user['id'])
    user_permissions = RoleManager.get_user_permissions(user['id'])
    
    # Return token in response with user profile
    return jsonify({
        "access_token": access_token,
        "username": user['username'],
        "email": user['email'],
        "tier": user['tier'] if user['tier'] else 'free',
        "roles": user_roles,
        "permissions": user_permissions,
        "message": "Login successful"
    }), 200
