#!/bin/bash

# Script to show available test images
echo "=== Available Test Images ==="
echo ""

UPLOAD_DIR="./backend/uploads/character_photos"

if [ ! -d "$UPLOAD_DIR" ]; then
    echo "❌ Upload directory not found: $UPLOAD_DIR"
    exit 1
fi

echo "Images in $UPLOAD_DIR:"
echo ""

count=0
for img in "$UPLOAD_DIR"/*.jpg "$UPLOAD_DIR"/*.jpeg "$UPLOAD_DIR"/*.png; do
    if [ -f "$img" ]; then
        count=$((count + 1))
        size=$(ls -lh "$img" | awk '{print $5}')
        echo "$count. $(basename "$img") ($size)"
    fi
done

if [ $count -eq 0 ]; then
    echo "No images found."
    echo ""
    echo "To add test images:"
    echo "1. Copy some .jpg, .jpeg, or .png files to $UPLOAD_DIR"
    echo "2. Or create a simple test image:"
    echo "   convert -size 200x200 xc:red /tmp/test.jpg"
    echo "   cp /tmp/test.jpg $UPLOAD_DIR/"
else
    echo ""
    echo "✅ Found $count test image(s)"
    echo ""
    echo "To run tests:"
    echo "./test_photo_simple.sh    # Simple single test"
    echo "./test_photo_upload.sh    # Comprehensive test suite"
fi
