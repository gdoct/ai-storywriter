"""
Template engine for dynamic prompt construction
"""

import re
from typing import Dict, Any, Optional, List
from jinja2 import Template, Environment, BaseLoader


class TemplateEngine:
    """Engine for processing prompt templates with dynamic data injection"""

    def __init__(self):
        self.env = Environment(loader=BaseLoader())
        # Add custom filters
        self.env.filters['character_list'] = self._format_character_list
        self.env.filters['location_list'] = self._format_location_list
        self.env.filters['timeline_events'] = self._format_timeline_events
        self.env.filters['clean_text'] = self._clean_text

    def render_template(self, template_str: str, context: Dict[str, Any]) -> str:
        """Render a template with the given context"""
        try:
            template = self.env.from_string(template_str)
            return template.render(**context)
        except Exception as e:
            # Fallback to basic string formatting if Jinja2 fails
            return template_str.format(**context)

    def _format_character_list(self, characters: List[Dict[str, Any]]) -> str:
        """Format characters for prompt injection"""
        if not characters:
            return "No specific characters defined."

        formatted = []
        for char in characters:
            name = char.get('name', 'Unnamed Character')
            details = []

            if char.get('role'):
                details.append(f"Role: {char['role']}")
            if char.get('appearance'):
                details.append(f"Appearance: {char['appearance']}")
            if char.get('backstory'):
                details.append(f"Background: {char['backstory']}")

            char_desc = f"- {name}"
            if details:
                char_desc += f" ({'; '.join(details)})"
            formatted.append(char_desc)

        return "\n".join(formatted)

    def _format_location_list(self, locations: List[Dict[str, Any]]) -> str:
        """Format locations for prompt injection"""
        if not locations:
            return "No specific locations defined."

        formatted = []
        for loc in locations:
            name = loc.get('name', 'Unnamed Location')
            details = []

            if loc.get('visual_description'):
                details.append(f"Description: {loc['visual_description']}")
            if loc.get('background'):
                details.append(f"Background: {loc['background']}")

            loc_desc = f"- {name}"
            if details:
                loc_desc += f" ({'; '.join(details)})"
            formatted.append(loc_desc)

        return "\n".join(formatted)

    def _format_timeline_events(self, timeline: List[Dict[str, Any]]) -> str:
        """Format timeline events for prompt injection"""
        if not timeline:
            return "No specific timeline defined."

        # Filter events that should be included in story
        story_events = [event for event in timeline if event.get('include_in_story', True)]

        if not story_events:
            return "No timeline events marked for story inclusion."

        # Sort by date if possible
        try:
            story_events.sort(key=lambda x: x.get('date', ''))
        except:
            pass  # Keep original order if sorting fails

        formatted = []
        for event in story_events:
            title = event.get('title', 'Untitled Event')
            desc = event.get('description', '')
            date = event.get('date', '')

            event_desc = f"- {title}"
            if date:
                event_desc += f" ({date})"
            if desc:
                event_desc += f": {desc}"
            formatted.append(event_desc)

        return "\n".join(formatted)

    def _clean_text(self, text: Optional[str]) -> str:
        """Clean and normalize text content"""
        if not text:
            return ""

        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        # Remove any potential prompt injection attempts
        text = text.replace('"""', '"')
        return text