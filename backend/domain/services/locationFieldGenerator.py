"""
Location Field Generator Service
Creates prompts for generating location fields from images.
"""

def createLocationFieldPrompt(field_name, location_context):
    """
    Create a location description prompt for a specific field
    
    Args:
        field_name (str): The field to generate ('visualDescription', 'background', 'extraInfo')
        location_context (dict): Existing location information
    
    Returns:
        str: The prompt for the AI model
    """
    context_str = ""
    if location_context:
        context_items = []
        for key, value in location_context.items():
            if value and key != field_name:
                context_items.append(f"{key}: {value}")
        
        if context_items:
            context_str = f"\n\nExisting location information:\n" + "\n".join(context_items)

    if field_name == 'visualDescription':
        return f"""Analyze this image and provide a vivid, detailed description of the location's physical appearance and atmosphere. Focus on:
- Architectural details and structures
- Natural features and landscape
- Lighting, weather, and mood
- Colors, textures, and materials
- Scale and spatial relationships
- Any notable features or focal points

Write in a descriptive, immersive style that would help a reader visualize this location clearly.{context_str}"""

    elif field_name == 'background':
        return f"""Based on this image, create a rich background history for this location. Consider:
- Historical significance and origins
- Cultural or social importance
- Past events that may have occurred here
- Who built or inhabited this place
- How it has changed over time
- Its role in the broader world or story
- Legends, myths, or stories associated with it

Write in an informative style that provides context and depth.{context_str}"""

    elif field_name == 'extraInfo':
        return f"""Analyze this image and provide additional storytelling details about this location. Include:
- Unique or mysterious elements
- Hidden secrets or features
- Practical considerations (accessibility, dangers, resources)
- Sensory details (sounds, smells, textures)
- Potential story hooks or plot elements
- Connections to other places or characters
- Any other interesting or useful information

Focus on details that would be useful for storytelling and world-building.{context_str}"""

    else:
        return f"""Analyze this image and provide detailed information about the location for the field "{field_name}".{context_str}"""