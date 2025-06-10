from datetime import timedelta

from data.repositories import UserRepository
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from flask_jwt_extended import create_access_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/login', methods=['POST'])
@cross_origin()
def login():
    # Get username and password from request
    request_data = request.get_json()
    
    # Check if username is present in request
    if not request_data or 'username' not in request_data:
        return jsonify({"error": "Username is required"}), 400
    
    # Extract username (password validation is skipped as per requirements)
    username = request_data.get('username')
    email = request_data.get('email')

    # Check if user exists, create if not
    user = UserRepository.get_user_by_username(username)
    if not user:
        user = UserRepository.create_user(username, email)

    # Create JWT token with 1-year expiration
    token_expiry = timedelta(days=365)  # 1 year
    access_token = create_access_token(identity=username, expires_delta=token_expiry)
    
    # Return token in response
    return jsonify({
        "access_token": access_token,
        "username": username,
        "message": "Login successful"
    }), 200
