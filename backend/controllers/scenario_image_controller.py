import json
import os

from data.repositories import UserRepository
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from services.scenario_image_service import ScenarioImageService

scenario_image_bp = Blueprint('scenario_image', __name__)

# Configuration
UPLOAD_FOLDER = 'uploads/scenario_images'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    """Check if the file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@scenario_image_bp.route('/api/scenario/<scenario_id>/upload-image', methods=['POST'])
@jwt_required()
def upload_scenario_image(scenario_id):
    """Upload an image for a scenario."""
    try:
        current_app.logger.info(f"Starting scenario image upload for scenario {scenario_id}")
        
        # Get authenticated user
        username = get_jwt_identity()
        user = UserRepository.get_user_by_username(username)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user['id']
        
        # Get uploaded file
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only PNG, JPG, JPEG, and GIF are allowed.'}), 400
        
        # Read file data
        file_data = file.read()
        
        # Use service to upload image
        result = ScenarioImageService.upload_image_for_scenario(
            scenario_id, user_id, file_data, file.filename
        )
        
        response_data = {
            'imageId': result['imageId'],
            'imageUrl': result['imageUrl'],
            'scenario': result['scenario'],
            'message': 'Image uploaded successfully'
        }
        
        return jsonify(response_data)
        
    except ValueError as e:
        current_app.logger.error(f"Validation error in upload_scenario_image: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Error in upload_scenario_image: {e}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to upload image'}), 500

@scenario_image_bp.route('/api/scenario-images/<image_id>', methods=['GET'])
def serve_scenario_image(image_id):
    """Serve scenario image files directly."""
    try:
        # Use service to serve the image
        return ScenarioImageService.serve_image_file(image_id)
        
    except FileNotFoundError:
        return jsonify({'error': 'Image not found'}), 404
    except Exception as e:
        current_app.logger.error(f"Error serving scenario image: {e}")
        return jsonify({'error': 'Failed to serve image'}), 500

@scenario_image_bp.route('/api/scenario/<scenario_id>/delete-image', methods=['DELETE'])
@jwt_required()
def delete_scenario_image(scenario_id):
    """Delete the image for a scenario."""
    try:
        current_app.logger.info(f"Deleting image for scenario {scenario_id}")
        
        # Get authenticated user
        username = get_jwt_identity()
        user = UserRepository.get_user_by_username(username)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user['id']
        
        # Use service to delete image
        result = ScenarioImageService.delete_image_from_scenario(scenario_id, user_id)
        
        return jsonify({
            'success': True, 
            'message': 'Image deleted successfully',
            'deletedFiles': len(result['deleted_files'])
        })
        
    except ValueError as e:
        current_app.logger.error(f"Validation error in delete_scenario_image: {e}")
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        current_app.logger.error(f"Error deleting scenario image: {e}")
        return jsonify({'error': 'Failed to delete image'}), 500

@scenario_image_bp.route('/api/scenario/upload-image-with-data', methods=['POST'])
@jwt_required()
def upload_image_with_scenario_data():
    """Upload an image along with scenario data - saves/updates the scenario with image."""
    try:
        current_app.logger.info("Starting image upload with scenario data")
        
        # Get authenticated user
        username = get_jwt_identity()
        user = UserRepository.get_user_by_username(username)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_id = user['id']
        
        # Get scenario data from form
        scenario_data_str = request.form.get('scenarioData')
        if not scenario_data_str:
            return jsonify({'error': 'Scenario data is required'}), 400
        
        try:
            scenario_data = json.loads(scenario_data_str)
        except json.JSONDecodeError:
            return jsonify({'error': 'Invalid scenario data format'}), 400
        
        # Get uploaded file
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only PNG, JPG, JPEG, and GIF are allowed.'}), 400
        
        # Read file data
        file_data = file.read()
        
        # Use service to upload image with scenario data
        result = ScenarioImageService.upload_image_with_scenario_data(
            user_id, scenario_data, file_data, file.filename
        )
        
        response_data = {
            'scenario': result['scenario'],
            'imageId': result['imageId'],
            'imageUrl': result['imageUrl'],
            'message': 'Image uploaded and scenario saved successfully'
        }
        
        return jsonify(response_data)
        
    except ValueError as e:
        current_app.logger.error(f"Validation error in upload_image_with_scenario_data: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Error in upload_image_with_scenario_data: {e}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to upload image and save scenario'}), 500
