"""
Image Controller
Handles general image operations and management.
"""

import os
import random

from flask import Blueprint, current_app, jsonify, request

image_bp = Blueprint('image', __name__)

@image_bp.route('/api/images/random', methods=['GET'])
def get_random_image():
    """
    Get a random image URL based on genre and type.
    
    Query parameters:
    - genre: "fantasy", "scify", "romance", or "general"
    - type: "character" or "background"
    - gender: "male", "female", or "other" (optional for character type)
    
    Returns:
    - JSON with image URL
    """
    try:
        # Get query parameters
        genre = request.args.get('genre')
        image_type = request.args.get('type')
        gender = request.args.get('gender')
        
        current_app.logger.info(f"Random image request - Raw params: genre='{genre}', type='{image_type}', gender='{gender}'")
        
        # Validate required parameters
        if not genre or not image_type:
            return jsonify({
                'error': 'Missing required parameters. Please provide both genre and type.'
            }), 400
        
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
        
        current_app.logger.info(f"Original genre: '{genre}', normalized: '{normalized_genre}', mapped: '{mapped_genre}'")
        
        # Use the mapped genre
        genre = mapped_genre
        
        # Validate type parameter
        valid_types = ['character', 'cover']
        if image_type not in valid_types:
            return jsonify({
                'error': f'Invalid type. Must be one of: {", ".join(valid_types)}'
            }), 400
        
        # Construct the path to the frontend images folder
        # Controller is in /backend/controllers/, so we need to go up 3 levels to get to project root
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        frontend_images_dir = os.path.join(project_root, 'frontend', 'public', 'images')
        
        current_app.logger.info(f"Project root: {project_root}")
        current_app.logger.info(f"Frontend images dir: {frontend_images_dir}")
        current_app.logger.info(f"Frontend images dir exists: {os.path.exists(frontend_images_dir)}")
        
        # Map image types to actual folder structure
        # Characters are in images/characters/genre/gender/
        # Backgrounds are in images/background/genre/
        if image_type == 'character':
            # Handle gender parameter for character images
            if not gender:
                # If no gender specified, randomly select one with weighted distribution
                # Male 40%, Female 50%, Other 10%
                gender_choices = ['male'] * 40 + ['female'] * 50 + ['other'] * 10
                gender = random.choice(gender_choices)
            
            # Validate gender parameter
            valid_genders = ['male', 'female', 'other']
            if gender not in valid_genders:
                return jsonify({
                    'error': f'Invalid gender. Must be one of: {", ".join(valid_genders)}'
                }), 400
            
            image_folder = os.path.join(frontend_images_dir, 'characters', genre, gender)
            url_prefix = f'/images/characters/{genre}/{gender}'
            
            current_app.logger.info(f"Constructed image folder: {image_folder}")
            current_app.logger.info(f"Image folder exists: {os.path.exists(image_folder)}")
            if os.path.exists(image_folder):
                files_in_folder = os.listdir(image_folder)
                current_app.logger.info(f"Files in folder: {len(files_in_folder)} files")
                current_app.logger.info(f"Sample files: {files_in_folder[:5] if files_in_folder else 'None'}")
        else:  # background
            image_folder = os.path.join(frontend_images_dir, 'cover', genre)
            url_prefix = f'/images/cover/{genre}'
        
        current_app.logger.info(f"Looking for images in: {image_folder}")
        current_app.logger.info(f"Genre: {genre}, Type: {image_type}, Gender: {gender if image_type == 'character' else 'N/A'}")
        
        # Check if the folder exists
        if not os.path.exists(image_folder):
            # For character images, try fallback strategies
            if image_type == 'character':
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
                        current_app.logger.info(f"Using fallback: {fallback_folder}")
                        image_folder = fallback_folder
                        url_prefix = f'/images/characters/{fallback_genre}/{fallback_gender}'
                        genre = fallback_genre
                        gender = fallback_gender
                        break
                else:
                    # No fallback worked
                    return jsonify({
                        'error': f'No images found for genre "{genre}" and type "{image_type}" with gender "{gender}". Tried fallbacks but none available.'
                    }), 404
            else:
                return jsonify({
                    'error': f'No images found for genre "{genre}" and type "{image_type}"'
                }), 404
        
        # Get all image files from the folder
        image_files = []
        for filename in os.listdir(image_folder):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                image_files.append(filename)
        
        # Check if there are any images
        if not image_files:
            return jsonify({
                'error': f'No image files found in folder for genre "{genre}" and type "{image_type}"'
            }), 404
        
        # Select a random image
        random_image = random.choice(image_files)
        
        # Construct the URL path
        image_url = f'{url_prefix}/{random_image}'
        
        current_app.logger.info(f"Selected random image: {image_url}")
        
        return jsonify({
            'url': image_url
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting random image: {str(e)}")
        return jsonify({
            'error': 'Internal server error'
        }), 500
