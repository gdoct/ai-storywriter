"""
Characters Processing Node
Processes character data and relationships from CharactersTab
"""

import logging
from typing import Dict, Any, List
from ..models.response_models import StoryStreamingEvent

logger = logging.getLogger(__name__)


async def characters_processing_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process character data and build character context
    """
    try:
        scenario = state.get("scenario", {})
        characters = scenario.get("characters", [])
        streaming_events = []
        current_step = state.get("current_step", 0) + 1
        total_steps = state.get("total_steps", 1)

        # Emit progress update
        streaming_events.append(StoryStreamingEvent(
            type="progress",
            step="characters_processing",
            progress=current_step / total_steps,
            message=f"Processing {len(characters)} characters"
        ))

        # Process each character
        processed_characters = []
        character_relationships = []
        main_characters = []

        for character in characters:
            processed_char = _process_character(character)
            processed_characters.append(processed_char)

            # Identify main characters (those with substantial details)
            if _is_main_character(processed_char):
                main_characters.append(processed_char)

        # Analyze character relationships
        if len(processed_characters) > 1:
            character_relationships = _analyze_relationships(processed_characters)

        # Build character context for story generation
        character_context = {
            "character_count": len(processed_characters),
            "main_character_count": len(main_characters),
            "character_names": [char.get("name", "Unnamed") for char in processed_characters],
            "main_characters": main_characters,
            "character_relationships": character_relationships,
            "has_photos": any(char.get("has_photo") for char in processed_characters)
        }

        # Update processing summary
        processing_summary = state.get("processing_summary", {})
        processing_summary["nodes_processed"] = processing_summary.get("nodes_processed", 0) + 1

        return {
            **state,
            "processed_characters": processed_characters,
            "character_context": character_context,
            "current_step": current_step,
            "streaming_events": streaming_events,
            "processing_summary": processing_summary
        }

    except Exception as e:
        logger.error(f"Characters processing failed: {str(e)}")
        return {
            **state,
            "error": f"Characters processing failed: {str(e)}",
            "streaming_events": [StoryStreamingEvent(
                type="error",
                error=f"Characters processing failed: {str(e)}"
            )]
        }


def _process_character(character: Dict[str, Any]) -> Dict[str, Any]:
    """Process and enhance individual character data"""
    processed = {
        "id": character.get("id", ""),
        "name": character.get("name", "").strip(),
        "alias": character.get("alias", "").strip(),
        "role": character.get("role", "").strip(),
        "gender": character.get("gender", "").strip(),
        "appearance": character.get("appearance", "").strip(),
        "backstory": character.get("backstory", "").strip(),
        "extra_info": character.get("extra_info", "").strip(),
        "has_photo": bool(character.get("photo_data") or character.get("photo_url")),
        "photo_data": character.get("photo_data"),
        "photo_mime_type": character.get("photo_mime_type")
    }

    # Generate display name
    if processed["name"]:
        processed["display_name"] = processed["name"]
    elif processed["alias"]:
        processed["display_name"] = processed["alias"]
    else:
        processed["display_name"] = f"Character {processed['id'][:8]}"

    # Determine character importance
    processed["importance"] = _calculate_character_importance(processed)

    # Generate character summary
    processed["summary"] = _generate_character_summary(processed)

    return processed


def _is_main_character(character: Dict[str, Any]) -> bool:
    """Determine if character is a main character based on detail level"""
    detail_count = 0

    if character.get("name"):
        detail_count += 1
    if character.get("role"):
        detail_count += 1
    if character.get("appearance"):
        detail_count += 1
    if character.get("backstory"):
        detail_count += 2  # Backstory is more important
    if character.get("extra_info"):
        detail_count += 1

    return detail_count >= 3


def _calculate_character_importance(character: Dict[str, Any]) -> int:
    """Calculate character importance score (1-10)"""
    score = 1  # Base score

    if character.get("name"):
        score += 2
    if character.get("role"):
        score += 1
    if character.get("appearance"):
        score += 1
    if character.get("backstory"):
        score += 3
    if character.get("extra_info"):
        score += 1
    if character.get("has_photo"):
        score += 1

    return min(score, 10)


def _generate_character_summary(character: Dict[str, Any]) -> str:
    """Generate a concise character summary"""
    parts = []

    name = character.get("display_name", "Character")
    parts.append(name)

    if character.get("role"):
        parts.append(f"({character['role']})")

    details = []
    if character.get("gender"):
        details.append(character["gender"])
    if character.get("appearance"):
        # Take first 50 chars of appearance
        appearance = character["appearance"][:50]
        if len(character["appearance"]) > 50:
            appearance += "..."
        details.append(appearance)

    if details:
        parts.append("- " + ", ".join(details))

    return " ".join(parts)


def _analyze_relationships(characters: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Analyze potential relationships between characters"""
    relationships = []

    # Simple relationship analysis based on shared elements
    for i, char1 in enumerate(characters):
        for j, char2 in enumerate(characters[i+1:], i+1):
            relationship = _detect_relationship(char1, char2)
            if relationship:
                relationships.append({
                    "character1": char1.get("display_name"),
                    "character2": char2.get("display_name"),
                    "relationship_type": relationship,
                    "confidence": 0.5  # Basic confidence score
                })

    return relationships


def _detect_relationship(char1: Dict[str, Any], char2: Dict[str, Any]) -> str:
    """Detect potential relationship between two characters"""
    # This is a simple implementation - could be enhanced with NLP
    char1_text = f"{char1.get('backstory', '')} {char1.get('extra_info', '')}".lower()
    char2_text = f"{char2.get('backstory', '')} {char2.get('extra_info', '')}".lower()

    char1_name = char1.get("name", "").lower()
    char2_name = char2.get("name", "").lower()

    # Check for mentions of each other
    if char1_name in char2_text or char2_name in char1_text:
        return "mentioned_connection"

    # Check for family relationship keywords
    family_keywords = ["family", "brother", "sister", "parent", "child", "mother", "father"]
    if any(keyword in char1_text and keyword in char2_text for keyword in family_keywords):
        return "family_connection"

    # Check for professional relationship
    professional_keywords = ["work", "colleague", "partner", "business", "job"]
    if any(keyword in char1_text and keyword in char2_text for keyword in professional_keywords):
        return "professional_connection"

    return None