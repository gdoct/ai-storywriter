"""
Centralized prompt repository
All story generation prompts moved from frontend to backend
"""

from typing import Dict, Any, Optional, List
from .template_engine import TemplateEngine


class PromptRepository:
    """Central repository for all story generation prompts"""

    def __init__(self):
        self.template_engine = TemplateEngine()

    def get_system_prompt(self, context: Dict[str, Any]) -> str:
        """Get the main system prompt for story generation"""
        base_template = """You are a skilled creative writer tasked with generating engaging stories based on detailed scenario information.

Your role:
- Generate compelling, well-structured stories that follow narrative best practices
- Maintain consistency with all provided character, location, and plot details
- Respect the specified genre, tone, and writing style preferences
- Create engaging dialogue and vivid descriptions
- Follow proper story pacing and structure

Writing Guidelines:
- Use descriptive language that brings scenes to life
- Develop characters with distinct voices and personalities
- Create smooth transitions between scenes and events
- Maintain narrative tension and reader engagement
- Respect the specified perspective (first/third person) and tense

{% if custom_system_prefix %}
Additional Instructions:
{{ custom_system_prefix | clean_text }}
{% endif %}

Focus on creating a story that feels authentic to the provided world and characters while being engaging for readers."""

        return self.template_engine.render_template(base_template, context)

    def get_story_generation_prompt(self, context: Dict[str, Any]) -> str:
        """Generate the main story generation prompt"""
        template = """Please write a {{ genre or "creative" }} story{% if title %} titled "{{ title }}"{% endif %} based on the following detailed scenario:

{% if synopsis %}
**Story Synopsis:**
{{ synopsis | clean_text }}
{% endif %}

{% if writing_style %}
**Writing Style:**
- Genre: {{ writing_style.genre or "Open" }}
- Tone: {{ writing_style.tone or "Balanced" }}
- Theme: {{ writing_style.theme or "Open" }}
- Communication Style: {{ writing_style.communication_style or "Natural" }}
{% if writing_style.language and writing_style.language != "English" %}
- Language: {{ writing_style.language }}
{% endif %}
{% endif %}

{% if characters %}
**Characters:**
{{ characters | character_list }}
{% endif %}

{% if locations %}
**Locations:**
{{ locations | location_list }}
{% endif %}

{% if backstory %}
**Backstory/World Context:**
{{ backstory | clean_text }}
{% endif %}

{% if storyarc %}
**Story Arc:**
{{ storyarc | clean_text }}
{% endif %}

{% if timeline %}
**Key Events Timeline:**
{{ timeline | timeline_events }}
{% endif %}

{% if notes %}
**Additional Notes:**
{{ notes | clean_text }}
{% endif %}

{% if fill_in %}
{% if fill_in.beginning %}
**Story Beginning (use as-is):**
{{ fill_in.beginning | clean_text }}

Continue from here...
{% endif %}

{% if fill_in.ending %}
**Story Ending (work toward this):**
{{ fill_in.ending | clean_text }}
{% endif %}
{% endif %}

{% if custom_user_prefix %}
**Custom Instructions:**
{{ custom_user_prefix | clean_text }}
{% endif %}

{% if keywords %}
**Important Keywords/Concepts:** {{ keywords | clean_text }}
{% endif %}

Generate a compelling story that incorporates all the above elements naturally and engagingly. The story should feel cohesive and well-paced, with vivid descriptions and authentic character interactions."""

        return self.template_engine.render_template(template, context)

    def get_character_processing_prompt(self, characters: List[Dict[str, Any]]) -> str:
        """Generate prompt for character processing analysis"""
        template = """Analyze the following characters and their relationships for story consistency:

{{ characters | character_list }}

Provide insights on:
1. Character dynamics and potential relationships
2. Consistency checks for character details
3. Suggestions for character development in the story"""

        return self.template_engine.render_template(template, {"characters": characters})

    def get_location_processing_prompt(self, locations: List[Dict[str, Any]]) -> str:
        """Generate prompt for location processing analysis"""
        template = """Analyze the following locations for world-building consistency:

{{ locations | location_list }}

Provide insights on:
1. World-building coherence
2. Atmospheric details to emphasize
3. How locations can enhance the narrative"""

        return self.template_engine.render_template(template, {"locations": locations})

    def get_backstory_integration_prompt(self, backstory: str, context: Dict[str, Any]) -> str:
        """Generate prompt for backstory integration"""
        template = """Integrate the following backstory into the narrative context:

**Backstory:**
{{ backstory | clean_text }}

**Current Story Context:**
{% if title %}Title: {{ title }}{% endif %}
{% if synopsis %}Synopsis: {{ synopsis }}{% endif %}

Provide guidance on:
1. How to weave backstory naturally into the narrative
2. Key historical elements that should influence current events
3. Character motivations stemming from past events"""

        context_with_backstory = {**context, "backstory": backstory}
        return self.template_engine.render_template(template, context_with_backstory)

    def get_timeline_sequencing_prompt(self, timeline: List[Dict[str, Any]]) -> str:
        """Generate prompt for timeline event sequencing"""
        template = """Analyze the following timeline events for narrative sequencing:

{{ timeline | timeline_events }}

Provide guidance on:
1. Optimal event ordering for narrative flow
2. Connections between events
3. Pacing recommendations for the story"""

        return self.template_engine.render_template(template, {"timeline": timeline})

    def build_context_from_scenario(self, scenario_data: Dict[str, Any]) -> Dict[str, Any]:
        """Build template context from scenario data"""
        context = {
            "title": scenario_data.get("title"),
            "synopsis": scenario_data.get("synopsis"),
            "writing_style": scenario_data.get("writing_style", {}),
            "characters": scenario_data.get("characters", []),
            "locations": scenario_data.get("locations", []),
            "backstory": scenario_data.get("backstory"),
            "storyarc": scenario_data.get("storyarc"),
            "timeline": scenario_data.get("timeline", []),
            "notes": scenario_data.get("notes"),
            "fill_in": scenario_data.get("fill_in", {}),
            "genre": scenario_data.get("writing_style", {}).get("genre", ""),
            "custom_system_prefix": "",
            "custom_user_prefix": "",
            "keywords": ""
        }

        # Handle custom prompts
        prompt_settings = scenario_data.get("prompt_settings", {})
        if prompt_settings:
            context["custom_system_prefix"] = prompt_settings.get("system_prompt_prefix", "")
            context["custom_user_prefix"] = prompt_settings.get("user_prompt_prefix", "")
            context["keywords"] = prompt_settings.get("keywords", "")

        return context