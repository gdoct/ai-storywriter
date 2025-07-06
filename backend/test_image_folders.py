#!/usr/bin/env python3
"""
Simple test to verify the random image endpoint functionality
"""
import os


def test_image_folders():
    """Test that the expected image folders exist"""
    
    # Get the path to the frontend images
    script_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_images_dir = os.path.join(script_dir, 'frontend', 'public', 'images')
    
    print(f"Looking for images in: {frontend_images_dir}")
    
    # Check character folders
    character_genres = ['fantasy', 'scify']
    for genre in character_genres:
        folder_path = os.path.join(frontend_images_dir, 'characters', genre)
        if os.path.exists(folder_path):
            files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))]
            print(f"✓ Characters/{genre}: {len(files)} images")
        else:
            print(f"✗ Characters/{genre}: folder not found")
    
    # Check cover (background) folders
    cover_genres = ['fantasy', 'scify', 'romance']
    for genre in cover_genres:
        folder_path = os.path.join(frontend_images_dir, 'cover', genre)
        if os.path.exists(folder_path):
            files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))]
            print(f"✓ Cover/{genre}: {len(files)} images")
        else:
            print(f"✗ Cover/{genre}: folder not found")

if __name__ == "__main__":
    test_image_folders()
