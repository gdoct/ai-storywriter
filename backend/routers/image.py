import os
import random
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Query
from models.image import RandomImageResponse

router = APIRouter()

logger = logging.getLogger(__name__)

@router.get("/images/random", response_model=RandomImageResponse)
async def get_random_image(
    genre: str = Query(..., description="Genre: fantasy, scify, romance, or general"),
    type: str = Query(..., description="Type: character or cover", regex="^(character|cover)$"),
    gender: Optional[str] = Query(None, description="Gender for character type: male, female, or other")
):
    """
    Get a random image URL based on genre and type.
    
    Query parameters:
    - genre: "fantasy", "scify", "romance", or "general"
    - type: "character" or "cover"
    - gender: "male", "female", or "other" (optional for character type)
    
    Returns:
    - JSON with image URL
    """
    try:
        # Validate genre parameter and map common variations
        genre_mapping = {
            'fantasy': 'fantasy',
            'science fiction': 'scify',
            'sci-fi': 'scify',
            'scifi': 'scify',
            'scify': 'scify',
            'science-fiction': 'scify',
            'sf': 'scify',
            'romance': 'romance',
            'romantic': 'romance',
            'general': 'general',
            'other': 'general',
            'drama': 'general',
            'adventure': 'general',
            'mystery': 'general',
            'horror': 'general',
            'comedy': 'general',
            'thriller': 'general',
            'historical fiction': 'general',
            'autobiography': 'general',
            'manual': 'general',
            'self-help': 'general',
            'biography': 'general',
            'non-fiction': 'general',
            'poetry': 'general',
            'satire': 'general',
            'dystopian': 'scify',
            'cyberpunk': 'scify',
            'magical realism': 'fantasy'
        }
        
        # Normalize genre input (lowercase and strip)
        normalized_genre = genre.lower().strip()
        mapped_genre = genre_mapping.get(normalized_genre, 'general')
        
        # Use the mapped genre
        genre = mapped_genre
        
        # Construct the path to the frontend images folder
        # Controller is in /backend/routers/, so we need to go up 3 levels to get to project root
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        frontend_images_dir = os.path.join(project_root, 'frontend', 'public', 'images')
        
        # Map image types to actual folder structure
        # Characters are in images/characters/genre/gender/
        # Backgrounds are in images/cover/genre/
        if type == 'character':
            # Handle gender parameter for character images
            if not gender:
                # If no gender specified, randomly select one with weighted distribution
                # Male 40%, Female 50%, Other 10%
                gender_choices = ['male'] * 40 + ['female'] * 50 + ['other'] * 10
                gender = random.choice(gender_choices)
            
            # Validate gender parameter
            valid_genders = ['male', 'female', 'other']
            if gender not in valid_genders:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f'Invalid gender. Must be one of: {", ".join(valid_genders)}'
                )
            
            image_folder = os.path.join(frontend_images_dir, 'characters', genre, gender)
            url_prefix = f'/images/characters/{genre}/{gender}'
            
        else:  # cover
            image_folder = os.path.join(frontend_images_dir, 'cover', genre)
            url_prefix = f'/images/cover/{genre}'
        
        
        # Check if the folder exists
        if not os.path.exists(image_folder):
            # For character images, try fallback strategies
            if type == 'character':
                fallback_attempts = []
                
                # First fallback: try 'general' genre with same gender
                if genre != 'general':
                    fallback_folder = os.path.join(frontend_images_dir, 'characters', 'general', gender)
                    fallback_attempts.append(('general', gender, fallback_folder))
                
                # Second fallback: try 'fantasy' genre with same gender
                if genre != 'fantasy':
                    fallback_folder = os.path.join(frontend_images_dir, 'characters', 'fantasy', gender)
                    fallback_attempts.append(('fantasy', gender, fallback_folder))
                
                # Third fallback: try original genre with 'female' gender
                if gender != 'female':
                    fallback_folder = os.path.join(frontend_images_dir, 'characters', genre, 'female')
                    fallback_attempts.append((genre, 'female', fallback_folder))
                
                # Fourth fallback: try 'fantasy' genre with 'female' gender
                if genre != 'fantasy' or gender != 'female':
                    fallback_folder = os.path.join(frontend_images_dir, 'characters', 'fantasy', 'female')
                    fallback_attempts.append(('fantasy', 'female', fallback_folder))
                
                # Try each fallback
                for fallback_genre, fallback_gender, fallback_folder in fallback_attempts:
                    if os.path.exists(fallback_folder):
                        image_folder = fallback_folder
                        url_prefix = f'/images/characters/{fallback_genre}/{fallback_gender}'
                        genre = fallback_genre
                        gender = fallback_gender
                        break
                else:
                    # No fallback worked
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f'No images found for genre "{genre}" and type "{type}" with gender "{gender}". Tried fallbacks but none available.'
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f'No images found for genre "{genre}" and type "{type}"'
                )
        
        # Get all image files from the folder
        image_files = []
        for filename in os.listdir(image_folder):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                image_files.append(filename)
        
        # Check if there are any images
        if not image_files:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'No image files found in folder for genre "{genre}" and type "{type}"'
            )
        
        # Select a random image
        random_image = random.choice(image_files)
        
        # Construct the URL path
        image_url = f'{url_prefix}/{random_image}'
        
        return RandomImageResponse(url=image_url)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting random image: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Internal server error'
        )