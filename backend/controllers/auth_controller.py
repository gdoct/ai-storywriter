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
    if not request_data or 'email' not in request_data:
        return jsonify({"error": "Email is required"}), 400
    
    # Extract username and other fields
    email = request_data.get('email')

    # Check if user exists, return error if not
    user = UserRepository.get_user_by_email(email)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Create JWT token with 1-year expiration
    token_expiry = timedelta(days=365)  # 1 year
    access_token = create_access_token(identity=user['username'], expires_delta=token_expiry)
    
    # Return token in response
    return jsonify({
        "access_token": access_token,
        "username": user['username'],
        "email": user['email'],
        "message": "Login successful"
    }), 200
