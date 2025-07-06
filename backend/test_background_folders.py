#!/usr/bin/env python3
"""
Test the background folder structure for the updated endpoint
"""
import os


def test_background_folders():
    """Test that background folders exist as expected by the endpoint"""
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_images_dir = os.path.join(script_dir, 'frontend', 'public', 'images')
    
    print(f"Looking for background images in: {frontend_images_dir}")
    
    # Check if background folder exists
    background_dir = os.path.join(frontend_images_dir, 'background')
    if os.path.exists(background_dir):
        print(f"✓ Background folder exists: {background_dir}")
        
        # Check each genre
        genres = ['fantasy', 'scify', 'romance', 'general']
        for genre in genres:
            genre_folder = os.path.join(background_dir, genre)
            if os.path.exists(genre_folder):
                files = [f for f in os.listdir(genre_folder) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))]
                print(f"  ✓ Background/{genre}: {len(files)} images")
            else:
                print(f"  ✗ Background/{genre}: folder not found")
    else:
        print(f"✗ Background folder not found: {background_dir}")
        print("  You may need to create this folder structure for background images")

if __name__ == "__main__":
    test_background_folders()
