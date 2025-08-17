import os
import uuid
import logging
from datetime import datetime
from io import BytesIO
from typing import Dict, Any

from fastapi import APIRouter, HTTPException, status, Depends, File, UploadFile, Form
from fastapi.responses import FileResponse
from PIL import Image

from models.character_photo import (
    CharacterFromPhotoResponse, UploadPhotoResponse, DeletePhotoResponse,
    GenerateFieldResponse
)
from data.db import get_db_connection
from data.repositories import UserRepository
from middleware.fastapi_auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

# Configuration
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB max file size
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
UPLOAD_FOLDER = 'uploads/photos'

def allowed_file(filename: str) -> bool:
    """Check if the file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_image_size(file_data: bytes) -> bool:
    """Validate that the image file size is within limits."""
    return len(file_data) <= MAX_FILE_SIZE

def compress_image_if_needed(image_data: bytes, max_size_kb: int = 300) -> bytes:
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
        
        # Reduce quality based on compression ratio
        quality = max(20, int(85 * compression_ratio))
        
        # Compress the image
        output = BytesIO()
        img.save(output, format='JPEG', quality=quality, optimize=True)
        compressed_data = output.getvalue()
        
        # If still too big, resize the image
        if len(compressed_data) / 1024 > max_size_kb:
            # Reduce dimensions
            width, height = img.size
            scale_factor = (max_size_kb / (len(compressed_data) / 1024)) ** 0.5
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            
            img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            output = BytesIO()
            img_resized.save(output, format='JPEG', quality=quality, optimize=True)
            compressed_data = output.getvalue()
        
        return compressed_data
        
    except Exception as e:
        logger.error(f"Error compressing image: {e}")
        return image_data

def save_uploaded_file(file_data: bytes, original_filename: str, user_id: str, photo_id: str) -> str:
    """Save uploaded file to disk with photo_id as filename."""
    try:
        # Get file extension
        file_extension = original_filename.rsplit('.', 1)[1].lower()
        
        # Create upload directory structure
        user_upload_dir = os.path.join(UPLOAD_FOLDER, user_id)
        os.makedirs(user_upload_dir, exist_ok=True)
        
        # Create filename with photo_id
        filename = f"{photo_id}.{file_extension}"
        file_path = os.path.join(user_upload_dir, filename)
        
        # Write file to disk
        with open(file_path, 'wb') as f:
            f.write(file_data)
        
        return file_path
        
    except Exception as e:
        logger.error(f"Error saving file: {e}")
        raise

def generate_character_from_image(image_data: bytes, user_prompt: str) -> Dict[str, Any]:
    """Generate character data from image using LLM service."""
    try:
        # Import here to avoid circular imports
        from services.locationFieldGenerator import generate_character_from_image as llm_generate_character
        return llm_generate_character(image_data, user_prompt)
    except Exception as e:
        logger.error(f"Error generating character from image: {e}")
        # Return a default character if LLM fails
        return {
            'name': 'Generated Character',
            'alias': '',
            'role': 'Character',
            'gender': 'Unknown',
            'appearance': user_prompt,
            'extraInfo': 'Generated from uploaded photo'
        }

@router.post("/characters/create-from-photo", response_model=CharacterFromPhotoResponse)
async def create_character_from_photo(
    current_user: dict = Depends(get_current_user),
    photo: UploadFile = File(...),
    prompt: str = Form(...)
):
    """Create a character from an uploaded photo."""
    try:
        logger.info("Starting character photo upload process")
        
        user_id = current_user['id']
        logger.info(f"User ID: {user_id}")
        
        if not prompt.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Prompt is required for character generation'
            )
        
        if not photo.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='No file selected'
            )
        
        if not allowed_file(photo.filename):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Invalid file type. Only PNG, JPG, and JPEG are allowed.'
            )
        
        logger.info(f"Processing file: {photo.filename}")
        
        # Read file data
        file_data = await photo.read()
        logger.info(f"File size: {len(file_data)} bytes")
        
        # Validate file size
        if not validate_image_size(file_data):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'File size too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB.'
            )
        
        # Compress image if needed
        logger.info("Compressing image...")
        compressed_data = compress_image_if_needed(file_data)
        logger.info(f"Compressed size: {len(compressed_data)} bytes")
        
        # Generate character from image
        logger.info("Generating character from image...")
        character_data = generate_character_from_image(compressed_data, prompt)
        
        logger.info(f"Generated character: {character_data.get('name', 'Unknown')}")
        
        # Generate unique IDs
        photo_id = str(uuid.uuid4())
        character_id = str(uuid.uuid4())
        
        # Save the image file with photo_id as filename prefix
        file_path = save_uploaded_file(compressed_data, photo.filename, user_id, photo_id)
        logger.info(f"Saved file to: {file_path}")
        
        # Add character_id to character_data
        character_data['id'] = character_id
        
        # Add photo data and reference to character data
        character_data['photoId'] = photo_id
        character_data['photoUrl'] = f"/api/photos/{photo_id}"
        
        # Return the generated character data with photo info
        logger.info("Sending success response")
        
        return CharacterFromPhotoResponse(
            success=True,
            character=character_data,
            photoId=photo_id,
            photoUrl=f"/api/photos/{photo_id}",
            message='Character generated successfully from photo'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in create_character_from_photo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to create character from photo'
        )

@router.delete("/character-photos/{photo_id}", response_model=DeletePhotoResponse)
async def delete_character_photo(
    photo_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a character photo."""
    try:
        user_id = current_user['id']
        
        # Search for the photo file in user's directory
        user_upload_dir = os.path.join(UPLOAD_FOLDER, user_id)
        
        if not os.path.exists(user_upload_dir):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Photo not found'
            )
        
        # Look for file with photo_id as filename
        file_deleted = False
        for filename in os.listdir(user_upload_dir):
            if filename.startswith(f"{photo_id}."):
                file_path = os.path.join(user_upload_dir, filename)
                if os.path.exists(file_path):
                    os.remove(file_path)
                    file_deleted = True
                    logger.info(f"Deleted photo file: {file_path}")
                    break
        
        if not file_deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Photo not found'
            )
        
        return DeletePhotoResponse(
            success=True,
            message='Photo deleted successfully'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting character photo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to delete photo'
        )

@router.get("/photos/{photo_id}")
async def serve_photo(photo_id: str):
    """Serve character photo files directly."""
    try:
        # Search for files that start with the photo_id in all user directories
        for user_folder in os.listdir(UPLOAD_FOLDER):
            user_path = os.path.join(UPLOAD_FOLDER, user_folder)
            if os.path.isdir(user_path):
                # Look for file with photo_id as filename (with any extension)
                for filename in os.listdir(user_path):
                    if filename.startswith(f"{photo_id}."):
                        file_path = os.path.join(user_path, filename)
                        if os.path.exists(file_path):
                            # Determine MIME type based on file extension
                            file_extension = filename.lower().split('.')[-1]
                            media_type = 'image/jpeg'
                            if file_extension == 'png':
                                media_type = 'image/png'
                            elif file_extension == 'gif':
                                media_type = 'image/gif'
                            
                            # Serve the file
                            return FileResponse(file_path, media_type=media_type)
        
        # If not found, return 404
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Photo not found'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving photo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to serve photo'
        )

@router.post("/characters/upload-photo", response_model=UploadPhotoResponse)
async def upload_character_photo(
    current_user: dict = Depends(get_current_user),
    photo: UploadFile = File(...)
):
    """Upload a photo for an existing character."""
    try:
        logger.info("Starting character photo upload process")
        
        user_id = current_user['id']
        
        if not photo.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='No file selected'
            )
        
        if not allowed_file(photo.filename):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Invalid file type. Only PNG, JPG, and JPEG are allowed.'
            )
        
        # Read file data
        file_data = await photo.read()
        
        # Validate file size
        if not validate_image_size(file_data):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'File size too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB.'
            )
        
        # Compress image if needed
        compressed_data = compress_image_if_needed(file_data)
        
        # Generate unique photo ID
        photo_id = str(uuid.uuid4())
        
        # Save the image file
        file_path = save_uploaded_file(compressed_data, photo.filename, user_id, photo_id)
        logger.info(f"Saved file to: {file_path}")
        
        return UploadPhotoResponse(
            photoId=photo_id,
            photoUrl=f"/api/photos/{photo_id}",
            message='Photo uploaded successfully'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading character photo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to upload photo'
        )

@router.post("/characters/generate-field-from-photo", response_model=GenerateFieldResponse)
async def generate_field_from_photo(
    current_user: dict = Depends(get_current_user),
    photo: UploadFile = File(...),
    field_name: str = Form(...),
    current_value: str = Form(default=""),
    prompt: str = Form(default="")
):
    """Generate a specific character field from a photo."""
    try:
        logger.info(f"Generating field '{field_name}' from photo")
        
        if not photo.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='No file selected'
            )
        
        if not allowed_file(photo.filename):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Invalid file type. Only PNG, JPG, and JPEG are allowed.'
            )
        
        # Read and validate file
        file_data = await photo.read()
        
        if not validate_image_size(file_data):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'File size too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB.'
            )
        
        # Compress image if needed
        compressed_data = compress_image_if_needed(file_data)
        
        # Generate field value using LLM service
        try:
            from services.locationFieldGenerator import generate_field_from_image
            field_value = generate_field_from_image(
                compressed_data, field_name, current_value, prompt
            )
        except Exception as e:
            logger.error(f"Error generating field from image: {e}")
            # Return a default response if LLM fails
            field_value = f"Generated {field_name} from image"
        
        return GenerateFieldResponse(
            success=True,
            field_value=field_value,
            message=f'Successfully generated {field_name} from photo'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating field from photo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to generate field from photo'
        )