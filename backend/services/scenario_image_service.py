import glob
import json
import os
import uuid
from io import BytesIO

from data.repositories import ScenarioRepository
# Removed Flask dependency - using direct path configuration
from PIL import Image

# Configuration
UPLOAD_FOLDER = 'uploads/scenario_images'
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

class ScenarioImageService:
    
    @staticmethod
    def validate_image_file(file_data, filename):
        """Validate image file size and type."""
        # Check file size
        if len(file_data) > MAX_FILE_SIZE:
            raise ValueError(f'File size too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB.')
        
        # Check file extension
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
        if '.' not in filename or filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            raise ValueError('Invalid file type. Only PNG, JPG, JPEG, and GIF are allowed.')
    
    @staticmethod
    def compress_image_if_needed(image_data, max_size=2 * 1024 * 1024):
        """Compress image if it's larger than max_size."""
        if len(image_data) <= max_size:
            return image_data
        
        try:
            # Open image with PIL
            img = Image.open(BytesIO(image_data))
            
            # Convert to RGB if necessary (for JPEG compatibility)
            if img.mode not in ('RGB', 'L'):
                img = img.convert('RGB')
            
            # Calculate compression ratio
            compression_ratio = max_size / len(image_data)
            
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
    
    @staticmethod
    def save_image_file(file_data, filename, user_id, image_id):
        """Save image file to disk and return the file path."""
        # Create user-specific upload directory
        # Get backend directory and create upload path
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        user_upload_dir = os.path.join(backend_dir, UPLOAD_FOLDER, str(user_id))
        os.makedirs(user_upload_dir, exist_ok=True)
        
        # Generate filename with image_id prefix
        file_extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'jpg'
        unique_filename = f"{image_id}.{file_extension}"
        
        file_path = os.path.join(user_upload_dir, unique_filename)
        
        # Write file to disk
        with open(file_path, 'wb') as f:
            f.write(file_data)
        
        # Return relative path from uploads folder
        return os.path.join(UPLOAD_FOLDER, str(user_id), unique_filename)
    
    @staticmethod
    def delete_image_file(image_id, user_id):
        """Delete image file from disk."""
        # Get backend directory and create upload path
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        user_upload_dir = os.path.join(backend_dir, UPLOAD_FOLDER, str(user_id))
        image_files = glob.glob(os.path.join(user_upload_dir, f"{image_id}.*"))
        
        deleted_files = []
        for image_file in image_files:
            try:
                os.remove(image_file)
                deleted_files.append(image_file)
                current_app.logger.info(f"Deleted image file: {image_file}")
            except OSError as e:
                current_app.logger.warning(f"Could not delete image file {image_file}: {e}")
        
        return deleted_files
    
    @staticmethod
    def upload_image_for_scenario(scenario_id, user_id, file_data, filename):
        """Upload and attach image to an existing scenario."""
        # Validate the file
        ScenarioImageService.validate_image_file(file_data, filename)
        
        # Verify scenario exists and belongs to user
        scenario = ScenarioRepository.get_scenario_by_id(scenario_id, user_id)
        if not scenario:
            raise ValueError('Scenario not found')
        
        # Compress image if needed
        compressed_data = ScenarioImageService.compress_image_if_needed(file_data)
        
        # Generate unique image ID
        image_id = str(uuid.uuid4())
        image_url = f"/api/scenario-images/{image_id}"
        
        # Get existing scenario data to check for old image
        scenario_data = json.loads(scenario['jsondata'])
        old_image_id = scenario_data.get('imageId')
        
        # Save the new image file
        file_path = ScenarioImageService.save_image_file(compressed_data, filename, user_id, image_id)
        
        try:
            # Update scenario with image information
            updated_scenario = ScenarioRepository.update_scenario_with_image(scenario_id, image_id, image_url)
            
            # Delete old image file if it exists
            if old_image_id and old_image_id != image_id:
                ScenarioImageService.delete_image_file(old_image_id, user_id)
            
            return {
                'imageId': image_id,
                'imageUrl': image_url,
                'scenario': json.loads(updated_scenario['jsondata']) if updated_scenario else None
            }
            
        except Exception as e:
            # Clean up the uploaded file if scenario update failed
            try:
                backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                os.remove(os.path.join(backend_dir, file_path))
            except:
                pass
            raise e
    
    @staticmethod
    def upload_image_with_scenario_data(user_id, scenario_data, file_data, filename):
        """Upload image and create/update scenario with the image."""
        # Validate the file
        ScenarioImageService.validate_image_file(file_data, filename)
        
        # Compress image if needed
        compressed_data = ScenarioImageService.compress_image_if_needed(file_data)
        
        # Generate unique image ID
        image_id = str(uuid.uuid4())
        image_url = f"/api/scenario-images/{image_id}"
        
        # Save the image file
        file_path = ScenarioImageService.save_image_file(compressed_data, filename, user_id, image_id)
        
        try:
            scenario_id = scenario_data.get('id')
            if scenario_id:
                # Update existing scenario
                scenario = ScenarioRepository.get_scenario_by_id(scenario_id, user_id)
                if not scenario:
                    raise ValueError('Scenario not found')
                
                # Get old image ID for cleanup
                existing_data = json.loads(scenario['jsondata'])
                old_image_id = existing_data.get('imageId')
                
                # Update scenario with new data and image
                scenario_data['imageId'] = image_id
                scenario_data['imageUrl'] = image_url
                
                ScenarioRepository.update_scenario(scenario_id, 
                                                 title=scenario_data.get('title', ''), 
                                                 jsondata=json.dumps(scenario_data))
                
                # Clean up old image
                if old_image_id and old_image_id != image_id:
                    ScenarioImageService.delete_image_file(old_image_id, user_id)
                
                updated_scenario = ScenarioRepository.get_scenario_by_id(scenario_id, user_id)
                result_data = json.loads(updated_scenario['jsondata'])
            else:
                # Create new scenario with image
                result_scenario = ScenarioRepository.create_scenario_with_image(
                    user_id, 
                    scenario_data.get('title', ''), 
                    scenario_data, 
                    image_id, 
                    image_url
                )
                result_data = json.loads(result_scenario['jsondata'])
            
            return {
                'imageId': image_id,
                'imageUrl': image_url,
                'scenario': result_data
            }
            
        except Exception as e:
            # Clean up the uploaded file if scenario operations failed
            try:
                backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                os.remove(os.path.join(backend_dir, file_path))
            except:
                pass
            raise e
    
    @staticmethod
    def delete_image_from_scenario(scenario_id, user_id):
        """Delete image from scenario."""
        # Verify scenario exists and belongs to user
        scenario = ScenarioRepository.get_scenario_by_id(scenario_id, user_id)
        if not scenario:
            raise ValueError('Scenario not found')
        
        # Remove image from scenario and get the old image ID
        old_image_id = ScenarioRepository.remove_image_from_scenario(scenario_id)
        
        if not old_image_id:
            raise ValueError('No image found for this scenario')
        
        # Delete the image file
        deleted_files = ScenarioImageService.delete_image_file(old_image_id, user_id)
        
        return {
            'deleted_files': deleted_files,
            'image_id': old_image_id
        }
    
    @staticmethod
    def serve_image_file(image_id):
        """Serve image file by image_id - returns FileResponse for FastAPI."""
        from fastapi.responses import FileResponse
        
        # Get the upload directory (relative to backend directory)
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        upload_dir = os.path.join(backend_dir, UPLOAD_FOLDER)
        
        # Search for files that start with the image_id in all user directories
        for user_folder in os.listdir(upload_dir):
            user_path = os.path.join(upload_dir, user_folder)
            if os.path.isdir(user_path):
                # Look for file with image_id as filename (with any extension)
                for filename in os.listdir(user_path):
                    if filename.startswith(f"{image_id}."):
                        file_path = os.path.join(user_path, filename)
                        if os.path.exists(file_path):
                            # Determine MIME type based on file extension
                            file_extension = filename.lower().split('.')[-1]
                            mime_type = 'image/jpeg'
                            if file_extension == 'png':
                                mime_type = 'image/png'
                            elif file_extension == 'gif':
                                mime_type = 'image/gif'
                            
                            # Return FastAPI FileResponse
                            return FileResponse(file_path, media_type=mime_type)
        
        # If not found, raise FileNotFoundError
        raise FileNotFoundError(f"Image {image_id} not found")
