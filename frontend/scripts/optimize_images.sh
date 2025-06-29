#!/bin/bash
# This script optimizes PNG images in the current directory using pngquant and optipng.


echo "Starting optimization..."

optimize_images_in_folder() {
  local folder="$1"
  
  # Save the current directory
  local original_dir=$(pwd)
  
  cd "$folder" || { echo "Folder not found: $folder"; return 1; }
  
  # Check if there are any PNG files in the folder
  if ls *.png &>/dev/null; then
    for file in *.png; do
      echo "Optimizing $file..."
      
      # 1. Use pngquant for lossy color reduction
      pngquant --quality=65-80 --skip-if-larger --force --ext .png "$file"
      
      # 2. Use optipng for lossless compression on the new file
      optipng -o7 "$file"
    done
  else
    echo "No PNG files found in $folder. Skipping..."
  fi
  
  # Return to the original directory
  cd "$original_dir"
}

# loop through all subfolders recursively
find . -type d | while read -r folder; do
  if [ -d "$folder" ]; then
    optimize_images_in_folder "$folder"
  fi
done

echo "All files optimized!"
