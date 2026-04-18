"""
Generate Similar Scenario Service
Handles generating synopsis and full scenarios similar to an existing one.
"""

import json
import logging
import uuid
from typing import Dict, Any, Optional

from infrastructure.database.repositories import UserRepository, ScenarioRepository
from domain.services.llm_proxy_service import LLMProxyService
from domain.services.credit_service import CreditService

logger = logging.getLogger(__name__)

SYNOPSIS_SYSTEM_PROMPT = (
    "You are an expert storyteller. You excel at creating fresh, engaging story concepts "
    "that feel familiar yet original."
)

FULL_SCENARIO_SYSTEM_PROMPT = (
    "You are an expert storyteller and scenario creator. "
    "You excel at developing rich, detailed story worlds."
)


def _build_synopsis_prompt(scenario_data: dict, user_instructions: str) -> str:
    writing_style = scenario_data.get("writingStyle") or {}
    genre = writing_style.get("genre") or "General Fiction"
    tone = writing_style.get("tone", "")
    theme = writing_style.get("theme", "")
    characters = scenario_data.get("characters") or []

    prompt = "Based on the existing scenario below, create a NEW similar scenario title and synopsis that features the SAME characters.\n\n"
    prompt += "====== EXISTING SCENARIO ======\n"
    prompt += f"Title: {scenario_data.get('title', '')}\n"
    prompt += f"Synopsis: {scenario_data.get('synopsis', '')}\n"
    prompt += f"Genre: {genre}\n"
    if tone:
        prompt += f"Tone: {tone}\n"
    if theme:
        prompt += f"Theme: {theme}\n"

    if characters:
        prompt += "\n====== EXISTING CHARACTERS (must appear in the new synopsis) ======\n"
        for char in characters:
            name = char.get("name", "Unknown")
            role = char.get("role", "")
            prompt += f"- {name}" + (f" ({role})" if role else "") + "\n"

    if user_instructions and user_instructions.strip():
        prompt += f"\n====== USER INSTRUCTIONS ======\n{user_instructions.strip()}\n"

    prompt += "\n====== REQUIREMENTS ======\n"
    prompt += "• Create a completely NEW title (do not copy the existing one)\n"
    prompt += "• Write an engaging synopsis of 2-4 sentences\n"
    prompt += "• The synopsis MUST feature the existing characters listed above\n"
    prompt += "• Do NOT introduce new character names\n"
    prompt += f"• Maintain the same {genre} genre and writing style\n"
    prompt += "• Make the scenario feel related but clearly distinct from the original\n"
    if user_instructions and user_instructions.strip():
        prompt += "• Follow the user instructions above\n"

    prompt += '\nOUTPUT FORMAT: Respond with ONLY this JSON object:\n'
    prompt += '{\n  "title": "(new creative title)",\n  "synopsis": "(new engaging synopsis featuring the existing characters)"\n}\n'
    prompt += "\nIMPORTANT: Provide ONLY the JSON object - no explanations or additional text."
    return prompt


def _build_full_scenario_prompt(scenario_data: dict, accepted_title: str, accepted_synopsis: str) -> str:
    writing_style = scenario_data.get("writingStyle") or {}
    genre = writing_style.get("genre") or "General Fiction"
    characters = scenario_data.get("characters") or []

    prompt = (
        "Generate a complete scenario using the provided title, synopsis, and existing characters. "
        "Use the existing scenario as a writing style reference.\n\n"
    )
    prompt += "====== STYLE REFERENCE ======\n"
    prompt += json.dumps({"writingStyle": writing_style}, indent=2) + "\n\n"

    prompt += "====== EXISTING CHARACTERS (must be retained as-is) ======\n"
    for char in characters:
        name = char.get("name", "Unknown")
        role = char.get("role", "")
        prompt += f"- {name}" + (f" ({role})" if role else "") + "\n"
    prompt += "\n"

    prompt += "====== SCENARIO TO DEVELOP ======\n"
    prompt += f"Title: {accepted_title}\n"
    prompt += f"Synopsis: {accepted_synopsis}\n\n"

    prompt += "====== REQUIREMENTS ======\n"
    prompt += f'• Use EXACTLY this title: "{accepted_title}"\n'
    prompt += f'• Use EXACTLY this synopsis: "{accepted_synopsis}"\n'
    prompt += "• RETAIN the existing characters listed above (do not add or remove characters)\n"
    prompt += "• Create NEW locations appropriate to the story\n"
    prompt += "• Write a detailed backstory (2-3 paragraphs) featuring the existing characters\n"
    prompt += "• Develop a story arc with clear plot progression for the existing characters\n"
    prompt += f"• Maintain the {genre} genre and writing style from the reference\n"

    prompt += "\nOUTPUT FORMAT: Respond with a complete scenario as a JSON object:\n"
    prompt += "{\n"
    prompt += f'  "title": "(must match exactly: {accepted_title})",\n'
    prompt += f'  "synopsis": "(must match exactly: {accepted_synopsis})",\n'
    prompt += '  "writingStyle": { "genre": "...", "tone": "...", "style": "...", "language": "...", "theme": "...", "other": "..." },\n'
    prompt += '  "locations": [{ "name": "...", "description": "..." }],\n'
    prompt += '  "backstory": "(detailed backstory 2-3 paragraphs)",\n'
    prompt += '  "storyarc": "(story arc as bullet points)",\n'
    prompt += '  "notes": "(creative notes and ideas)"\n'
    prompt += "}\n\n"
    prompt += "IMPORTANT: Provide ONLY the JSON object - no explanations or additional text. Ensure the JSON is valid and properly formatted."
    return prompt


def _parse_json_response(response_text: str) -> dict:
    """Extract and parse JSON from an LLM response, tolerating markdown wrapping."""
    text = response_text.strip()
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or start >= end:
        raise ValueError("No JSON object found in LLM response")
    json_str = text[start : end + 1]
    # Remove control characters except whitespace
    json_str = "".join(
        ch for ch in json_str if ch >= " " or ch in "\n\r\t"
    )
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        # Try jsonrepair-style fix: remove trailing commas before } or ]
        import re
        json_str = re.sub(r",\s*([}\]])", r"\1", json_str)
        return json.loads(json_str)


class GenerateSimilarService:

    @staticmethod
    async def generate_synopsis(
        scenario_data: dict,
        user_instructions: str,
        user_id: str,
        byok_headers: Optional[Dict[str, str]] = None,
    ) -> Dict[str, str]:
        """
        Generate a new title and synopsis similar to the source scenario.
        Returns: { "title": str, "synopsis": str }
        """
        service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)

        prompt = _build_synopsis_prompt(scenario_data, user_instructions)

        credit_service = CreditService()
        estimated_credits = credit_service.estimate_cost(prompt, provider).get("estimated_credits", 50)

        if mode == "member":
            balance = UserRepository.get_user_credit_balance(user_id)
            if balance < estimated_credits:
                raise ValueError(
                    f"Insufficient credits. Need approximately {estimated_credits}, have {balance}."
                )

        payload = {
            "model": "default",
            "messages": [
                {"role": "system", "content": SYNOPSIS_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.9,
            "max_tokens": 400,
            "stream": False,
        }

        try:
            response = service.chat_completion(payload)
            if not isinstance(response, dict) or "choices" not in response:
                raise ValueError("Unexpected response format from LLM service")

            content = response["choices"][0]["message"]["content"].strip()
            result = _parse_json_response(content)

            if not result.get("title") or not result.get("synopsis"):
                raise ValueError("LLM response missing title or synopsis fields")

            if mode == "member":
                total_tokens = response.get("usage", {}).get("total_tokens", estimated_credits)
                UserRepository.add_credit_transaction(
                    user_id=user_id,
                    transaction_type="generate_similar_synopsis",
                    amount=-total_tokens,
                    description="Generate similar scenario synopsis",
                    related_entity_id=None,
                )

            return {"title": result["title"], "synopsis": result["synopsis"]}

        except Exception as e:
            logger.error(f"Synopsis generation failed: {str(e)}")
            raise

    @staticmethod
    async def generate_full_scenario(
        source_scenario_data: dict,
        accepted_title: str,
        accepted_synopsis: str,
        user_id: str,
        byok_headers: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Generate a full scenario from an accepted title and synopsis.
        Creates and saves a new scenario in the database.
        Returns the new scenario data.
        """
        service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)

        prompt = _build_full_scenario_prompt(source_scenario_data, accepted_title, accepted_synopsis)

        credit_service = CreditService()
        estimated_credits = credit_service.estimate_cost(prompt, provider).get("estimated_credits", 300)

        if mode == "member":
            balance = UserRepository.get_user_credit_balance(user_id)
            if balance < estimated_credits:
                raise ValueError(
                    f"Insufficient credits. Need approximately {estimated_credits}, have {balance}."
                )

        payload = {
            "model": "default",
            "messages": [
                {"role": "system", "content": FULL_SCENARIO_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.8,
            "max_tokens": 4000,
            "stream": False,
        }

        try:
            response = service.chat_completion(payload)
            if not isinstance(response, dict) or "choices" not in response:
                raise ValueError("Unexpected response format from LLM service")

            content = response["choices"][0]["message"]["content"].strip()
            new_data = _parse_json_response(content)

            if not new_data.get("title"):
                raise ValueError("LLM response is missing required scenario fields")

            # Ensure title and synopsis match what was accepted
            new_data["title"] = accepted_title
            new_data["synopsis"] = accepted_synopsis

            # Always retain characters from the source scenario
            source_chars = source_scenario_data.get("characters") or []
            logger.info(f"[generate_similar] source characters count: {len(source_chars)}")
            logger.info(f"[generate_similar] llm returned characters count: {len(new_data.get('characters', []))}")
            new_data["characters"] = source_chars
            logger.info(f"[generate_similar] final characters count: {len(new_data['characters'])}")

            # Assign unique IDs to locations
            for loc in new_data.get("locations", []):
                loc.setdefault("id", f"loc_{uuid.uuid4().hex[:12]}")

            # Convert storyarc list to string if needed
            if isinstance(new_data.get("storyarc"), list):
                new_data["storyarc"] = "\n".join(f"• {item}" for item in new_data["storyarc"])

            # Add userId
            new_data["userId"] = user_id

            # Save to database
            created = ScenarioRepository.create_scenario(
                user_id=user_id,
                title=accepted_title,
                jsondata=json.dumps(new_data),
            )
            new_data["id"] = created["id"]

            if mode == "member":
                total_tokens = response.get("usage", {}).get("total_tokens", estimated_credits)
                UserRepository.add_credit_transaction(
                    user_id=user_id,
                    transaction_type="generate_similar_full",
                    amount=-total_tokens,
                    description="Generate similar scenario (full)",
                    related_entity_id=created["id"],
                )

            return new_data

        except Exception as e:
            logger.error(f"Full scenario generation failed: {str(e)}")
            raise
