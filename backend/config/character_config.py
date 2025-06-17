"""
Configuration for character generation.

This module defines schemas and field requirements for character generation
from vision and text prompts.
"""

# Required fields for character generation
CHARACTER_REQUIRED_FIELDS = [
    'name',
    'alias',
    'role',
    'gender',
    'appearance',
    'backstory',
    'extraInfo'
]

# Sample schema for validation and documentation
CHARACTER_SCHEMA_SAMPLE = {
    "name": "Character Name",
    "alias": "Character Alias", 
    "role": "Main/Supporting/Antagonist",
    "gender": "Male/Female/Other",
    "appearance": "Physical description",
    "backstory": "Character background",
    "extraInfo": "Additional details"
}

# Default fallback character data when generation fails
CHARACTER_FALLBACK_TEMPLATE = {
    "name": "Generated Character",
    "alias": "",
    "role": "Supporting", 
    "gender": "Unknown",
    "appearance": "Based on uploaded photo. Distinctive appearance that matches the uploaded image.",
    "backstory": "A character generated from an uploaded photograph with unique traits and history.",
    "extraInfo": "Personality traits and characteristics derived from visual analysis of the uploaded photo."
}
