"""
Character Appearance Controller
Handles generation of character appearance descriptions from photos.
"""

import os
from io import BytesIO

from controllers.character_photo_controller import (UPLOAD_FOLDER,
                                                    allowed_file,
                                                    compress_image_if_needed,
                                                    validate_image_size)
from data.repositories import UserRepository
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from PIL import Image

character_appearance_bp = Blueprint('character_appearance', __name__)

@character_appearance_bp.route('/api/characters/generate-appearance-from-photo', methods=['POST'])
@jwt_required()
def generate_appearance_from_photo():
    """Generate a detailed appearance description for a character based on their photo."""
    try:
        current_app.logger.info("Starting appearance generation from photo")
        
        # Get authenticated user
        username = get_jwt_identity()
        user = UserRepository.get_user_by_username(username)
        if not user:
            current_app.logger.error(f"User not found: {username}")
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user['id']
        
        # Get prompt and character data
        prompt = request.form.get('prompt', '').strip()
        if not prompt:
            current_app.logger.error("Missing prompt")
            return jsonify({'error': 'Prompt is required for appearance generation'}), 400
            
        # Get the photo ID
        photo_id = request.form.get('photoId', '').strip()
        if not photo_id:
            current_app.logger.error("Missing photoId")
            return jsonify({'error': 'Photo ID is required'}), 400
            
        # Find the photo file
        user_upload_dir = os.path.join(current_app.root_path, UPLOAD_FOLDER, str(user_id))
        file_path = None
        
        # Look for the file with photoId prefix
        if os.path.exists(user_upload_dir):
            for filename in os.listdir(user_upload_dir):
                if filename.startswith(photo_id + '.'):
                    file_path = os.path.join(user_upload_dir, filename)
                    break
        
        if not file_path or not os.path.exists(file_path):
            current_app.logger.error(f"Photo not found: {photo_id}")
            return jsonify({'error': 'Photo not found'}), 404
        
        # Read the file data
        with open(file_path, 'rb') as f:
            file_data = f.read()
        
        # Compress image if needed
        compressed_data = compress_image_if_needed(file_data)
        
        # Get the active LLM service
        from llm_services.llm_service import get_active_llm_service
        llm_service = get_active_llm_service()
        
        # Process the image with the LLM service
        try:
            # Call the vision model with the prompt
            raw_response = llm_service.vision_completion(compressed_data, prompt)
            
            # Clean up the response
            if isinstance(raw_response, str):
                appearance = raw_response.strip()
            elif isinstance(raw_response, dict) and 'appearance' in raw_response:
                appearance = raw_response['appearance']
            else:
                appearance = str(raw_response)
                
            return jsonify({
                'success': True,
                'appearance': appearance,
                'message': 'Appearance generated successfully'
            })
            
        except Exception as e:
            current_app.logger.error(f"Vision processing error: {e}")
            return jsonify({
                'success': False,
                'error': str(e),
                'message': 'Failed to process image with vision model'
            }), 500
            
    except Exception as e:
        current_app.logger.error(f"Error in generate_appearance_from_photo: {e}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500
