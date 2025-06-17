"""
Character Photo Controller
Handles photo upload and AI-powered character generation from images.
"""

import os
import uuid
from datetime import datetime
from io import BytesIO

from data.db import get_db_connection
from data.repositories import UserRepository
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from PIL import Image

character_photo_bp = Blueprint('character_photo', __name__)

# Configuration
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB max file size
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
UPLOAD_FOLDER = 'uploads/photos'  # Changed from character_photos to photos

def allowed_file(filename):
    """Check if the file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_image_size(file_data):
    """Validate that the image file size is within limits."""
    return len(file_data) <= MAX_FILE_SIZE

def compress_image_if_needed(image_data, max_size_kb=300):
    """Compress image if it exceeds the max size."""
    try:
        # Open the image
        img = Image.open(BytesIO(image_data))
        
        # Convert to RGB if necessary (for JPEG)
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
        
        # Calculate current size
        current_size = len(image_data) / 1024  # KB
        
        if current_size <= max_size_kb:
            return image_data
        
        # Calculate compression ratio needed
        compression_ratio = max_size_kb / current_size
        
        # Reduce image dimensions while maintaining aspect ratio
        width, height = img.size
        new_width = int(width * (compression_ratio ** 0.5))
        new_height = int(height * (compression_ratio ** 0.5))
        
        # Resize the image
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Save to bytes with quality adjustment
        output = BytesIO()
        quality = max(30, int(85 * compression_ratio))  # Reduce quality if needed
        img.save(output, format='JPEG', quality=quality, optimize=True)
        
        return output.getvalue()
    except Exception as e:
        current_app.logger.error(f"Error compressing image: {e}")
        return image_data

def save_uploaded_file(file_data, filename, user_id, photo_id=None):
    """Save uploaded file to disk and return the file path."""
    # Create user-specific upload directory
    user_upload_dir = os.path.join(current_app.root_path, UPLOAD_FOLDER, str(user_id))
    os.makedirs(user_upload_dir, exist_ok=True)
    
    # Generate filename with photo_id prefix if provided
    file_extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'jpg'
    if photo_id:
        unique_filename = f"{photo_id}.{file_extension}"
    else:
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
    
    file_path = os.path.join(user_upload_dir, unique_filename)
    
    # Write file to disk
    with open(file_path, 'wb') as f:
        f.write(file_data)
    
    # Return relative path from uploads folder
    return os.path.join(UPLOAD_FOLDER, str(user_id), unique_filename)

def generate_character_from_image(image_data, user_prompt=""):
    """Use AI to generate character data from image using the configured LLM service."""
    from llm_services.llm_service import \
        generate_character_from_image as llm_generate_character
    
    return llm_generate_character(image_data, user_prompt)

@character_photo_bp.route('/api/characters/create-from-photo', methods=['POST'])
@jwt_required()
def create_character_from_photo():
    """Create a character from an uploaded photo."""
    try:
        current_app.logger.info("Starting character photo upload process")
        
        # Get authenticated user
        username = get_jwt_identity()
        current_app.logger.info(f"Authenticated user: {username}")
        
        user = UserRepository.get_user_by_username(username)
        if not user:
            current_app.logger.error(f"User not found: {username}")
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user['id']
        current_app.logger.info(f"User ID: {user_id}")
        
        # Get the prompt from form data
        user_prompt = request.form.get('prompt', '').strip()
        if not user_prompt:
            current_app.logger.error("No prompt provided")
            return jsonify({'error': 'Prompt is required for character generation'}), 400
        
        # Get uploaded file
        if 'photo' not in request.files:
            current_app.logger.error("No photo file in request")
            return jsonify({'error': 'No photo file provided'}), 400
        
        file = request.files['photo']
        if file.filename == '':
            current_app.logger.error("Empty filename")
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            current_app.logger.error(f"Invalid file type: {file.filename}")
            return jsonify({'error': 'Invalid file type. Only PNG, JPG, and JPEG are allowed.'}), 400
        
        current_app.logger.info(f"Processing file: {file.filename}")
        
        # Read file data
        file_data = file.read()
        current_app.logger.info(f"File size: {len(file_data)} bytes")
        
        # Validate file size
        if not validate_image_size(file_data):
            current_app.logger.error(f"File too large: {len(file_data)} bytes")
            return jsonify({'error': f'File size too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB.'}), 400
        
        # Compress image if needed
        current_app.logger.info("Compressing image...")
        compressed_data = compress_image_if_needed(file_data)
        current_app.logger.info(f"Compressed size: {len(compressed_data)} bytes")
        
        # Generate character from image
        current_app.logger.info("Generating character from image...")
        character_data = generate_character_from_image(compressed_data, user_prompt)
        
        current_app.logger.info(f"Generated character: {character_data.get('name', 'Unknown')}")
        
        # Generate unique IDs
        photo_id = str(uuid.uuid4())
        character_id = str(uuid.uuid4())
        
        # Save the image file with photo_id as filename prefix
        file_path = save_uploaded_file(compressed_data, file.filename, user_id, photo_id)
        current_app.logger.info(f"Saved file to: {file_path}")
        
        # Add character_id to character_data
        character_data['id'] = character_id
        
        # TODO: Save photo metadata to database once schema is updated
        # For now, skip database save due to NOT NULL constraint on scenario_id
        current_app.logger.info(f"Skipping database save due to schema constraints")
        
        # Add photo data and reference to character data
        character_data['photoId'] = photo_id
        character_data['photoUrl'] = f"/api/photos/{photo_id}"
        
        # Return the generated character data with photo info
        current_app.logger.info("Sending success response")
        response_data = {
            'success': True,
            'character': character_data,
            'photoId': photo_id,
            'photoUrl': f"/api/photos/{photo_id}",
            'message': 'Character generated successfully from photo'
        }
        current_app.logger.info(f"Response data keys: {list(response_data.keys())}")
        
        return jsonify(response_data)
        
    except Exception as e:
        current_app.logger.error(f"Error in create_character_from_photo: {e}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to process photo and generate character'}), 500

@character_photo_bp.route('/api/character-photos/<photo_id>', methods=['DELETE'])
@jwt_required()
def delete_character_photo(photo_id):
    """Delete a character photo."""
    try:
        # Get authenticated user
        username = get_jwt_identity()
        user = UserRepository.get_user_by_username(username)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user['id']
        
        # Get photo metadata
        conn = get_db_connection()
        c = conn.cursor()
        photo = c.execute('''
            SELECT * FROM character_photos 
            WHERE id = ? AND user_id = ?
        ''', (photo_id, user_id)).fetchone()
        
        if not photo:
            conn.close()
            return jsonify({'error': 'Photo not found'}), 404
        
        # Delete photo file from disk (handle both old and new structure)
        upload_dir = os.path.join(current_app.root_path, UPLOAD_FOLDER)
        
        # Try new structure first (uploads/photos/user_id/filename)
        file_path = os.path.join(upload_dir, str(user_id), photo['filename'])
        if not os.path.exists(file_path):
            # Fallback to old structure (uploads/photos/filename) for existing files
            file_path = os.path.join(upload_dir, photo['filename'])
            
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Delete photo record from database
        c.execute('DELETE FROM character_photos WHERE id = ?', (photo_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Photo deleted successfully'})
        
    except Exception as e:
        current_app.logger.error(f"Error deleting character photo: {e}")
        return jsonify({'error': 'Failed to delete photo'}), 500

@character_photo_bp.route('/api/photos/<photo_id>', methods=['GET'])
def serve_photo(photo_id):
    """Serve character photo files directly."""
    try:
        # Get the upload directory
        upload_dir = os.path.join(current_app.root_path, UPLOAD_FOLDER)
        
        # Search for files that start with the photo_id in all user directories
        for user_folder in os.listdir(upload_dir):
            user_path = os.path.join(upload_dir, user_folder)
            if os.path.isdir(user_path):
                # Look for file with photo_id as filename (with any extension)
                for filename in os.listdir(user_path):
                    if filename.startswith(f"{photo_id}."):
                        file_path = os.path.join(user_path, filename)
                        if os.path.exists(file_path):
                            # Determine MIME type based on file extension
                            file_extension = filename.lower().split('.')[-1]
                            mime_type = 'image/jpeg'
                            if file_extension == 'png':
                                mime_type = 'image/png'
                            elif file_extension == 'gif':
                                mime_type = 'image/gif'
                            
                            # Serve the file
                            from flask import send_file
                            return send_file(file_path, mimetype=mime_type)
        
        # If not found, return 404
        return jsonify({'error': 'Photo not found'}), 404
        
    except Exception as e:
        current_app.logger.error(f"Error serving photo: {e}")
        return jsonify({'error': 'Failed to serve photo'}), 500
    except Exception as e:
        current_app.logger.error(f"Error serving character photo: {e}")
        return jsonify({'error': 'Failed to serve photo'}), 500

@character_photo_bp.route('/api/characters/upload-photo', methods=['POST'])
@jwt_required()
def upload_character_photo():
    """Upload a photo for an existing character."""
    try:
        current_app.logger.info("Starting character photo upload process")
        
        # Get authenticated user
        username = get_jwt_identity()
        current_app.logger.info(f"Authenticated user: {username}")
        
        user = UserRepository.get_user_by_username(username)
        if not user:
            current_app.logger.error(f"User not found: {username}")
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user['id']
        current_app.logger.info(f"User ID: {user_id}")
        
        # Get character ID from form data
        character_id = request.form.get('characterId', '').strip()
        if not character_id:
            current_app.logger.error("No character ID provided")
            return jsonify({'error': 'Character ID is required'}), 400
        
        # Get uploaded file
        if 'photo' not in request.files:
            current_app.logger.error("No photo file in request")
            return jsonify({'error': 'No photo file provided'}), 400
        
        file = request.files['photo']
        if file.filename == '':
            current_app.logger.error("Empty filename")
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            current_app.logger.error(f"Invalid file type: {file.filename}")
            return jsonify({'error': 'Invalid file type. Only PNG, JPG, and JPEG are allowed.'}), 400
        
        current_app.logger.info(f"Processing file: {file.filename}")
        
        # Read file data
        file_data = file.read()
        current_app.logger.info(f"File size: {len(file_data)} bytes")
        
        # Validate file size
        if not validate_image_size(file_data):
            current_app.logger.error(f"File too large: {len(file_data)} bytes")
            return jsonify({'error': f'File size too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB.'}), 400
        
        # Compress image if needed
        current_app.logger.info("Compressing image...")
        compressed_data = compress_image_if_needed(file_data)
        current_app.logger.info(f"Compressed size: {len(compressed_data)} bytes")
        
        # Generate unique photo ID
        photo_id = str(uuid.uuid4())
        
        # Save the image file with photo_id as filename prefix
        file_path = save_uploaded_file(compressed_data, file.filename, user_id, photo_id)
        current_app.logger.info(f"Saved file to: {file_path}")
        
        # TODO: Save photo metadata to database once schema is updated
        # For now, skip database save due to NOT NULL constraint on scenario_id
        current_app.logger.info(f"Skipping database save due to schema constraints")
        
        # Return photo information
        current_app.logger.info("Sending success response")
        response_data = {
            'photoId': photo_id,
            'photoUrl': f"/api/photos/{photo_id}",
            'message': 'Photo uploaded successfully'
        }
        current_app.logger.info(f"Response data: {response_data}")
        
        return jsonify(response_data)
        
    except Exception as e:
        current_app.logger.error(f"Error in upload_character_photo: {e}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to upload photo'}), 500

@character_photo_bp.route('/api/characters/generate-field-from-photo', methods=['POST'])
@jwt_required()
def generate_field_from_photo():
    """Generate a specific field for a character from a photo."""
    try:
        current_app.logger.info("Starting field generation from photo process")
        
        # Get authenticated user
        username = get_jwt_identity()
        current_app.logger.info(f"Authenticated user: {username}")
        
        user = UserRepository.get_user_by_username(username)
        if not user:
            current_app.logger.error(f"User not found: {username}")
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user['id']
        
        # Get the field name and character context from form data
        field_name = request.form.get('field', 'appearance').strip()
        character_context = request.form.get('characterContext', '').strip()
        user_prompt = request.form.get('prompt', '').strip()
        
        # Get the photo - either from an uploaded file or a photoId
        photo_id = request.form.get('photoId', '').strip()
        
        if photo_id:
            # Find the photo path from the database if needed
            # For now, assume the photo path is based on the photoId format
            file_path = None
            
            # Search for the file in the user's upload directory
            user_upload_dir = os.path.join(current_app.root_path, UPLOAD_FOLDER, str(user_id))
            
            # Look for files with the photoId prefix
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
        elif 'photo' in request.files:
            # Get uploaded file
            file = request.files['photo']
            if file.filename == '':
                current_app.logger.error("Empty filename")
                return jsonify({'error': 'No file selected'}), 400
            
            if not allowed_file(file.filename):
                current_app.logger.error(f"Invalid file type: {file.filename}")
                return jsonify({'error': 'Invalid file type. Only PNG, JPG, and JPEG are allowed.'}), 400
                
            # Read file data
            file_data = file.read()
        else:
            current_app.logger.error("No photo provided")
            return jsonify({'error': 'No photo file or photoId provided'}), 400
        
        # Validate file size
        if not validate_image_size(file_data):
            current_app.logger.error(f"File too large: {len(file_data)} bytes")
            return jsonify({'error': f'File size too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB.'}), 400
            
        # Compress image if needed
        current_app.logger.info("Compressing image...")
        compressed_data = compress_image_if_needed(file_data)
        
        # Generate the requested field from image
        current_app.logger.info(f"Generating {field_name} from image...")
        
        # Import here to avoid circular imports
        from llm_services.llm_service import generate_field_from_image
        
        field_value = generate_field_from_image(
            compressed_data, 
            field_name, 
            character_context,
            user_prompt
        )
        
        current_app.logger.info(f"Generated {field_name} successfully")
        
        # Return the generated field value
        return jsonify({
            'success': True,
            'fieldName': field_name,
            'fieldValue': field_value,
            'message': f'{field_name.capitalize()} generated successfully from photo'
        })
        
    except Exception as e:
        current_app.logger.error(f"Error in generate_field_from_photo: {e}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to generate {request.form.get("field", "field")} from photo'}), 500
