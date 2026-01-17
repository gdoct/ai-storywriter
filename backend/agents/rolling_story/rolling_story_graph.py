"""
Rolling Story Agent - LangGraph implementation for interactive story generation.

This agent generates 8 paragraphs per cycle, extracts bible/event updates,
and generates choices for the next cycle. Features token-by-token streaming
and a running storyline for narrative coherence.
"""
import asyncio
import json
import logging
import re
from typing import Dict, Any, List, AsyncGenerator, Optional

from langgraph.graph import StateGraph, END

from .state import RollingStoryState
from .prompts import (
    PARAGRAPH_GENERATION_SYSTEM,
    PARAGRAPH_GENERATION_USER,
    EXTRACTION_SYSTEM,
    EXTRACTION_USER,
    CHOICES_SYSTEM,
    CHOICES_USER,
    STORYLINE_SYSTEM,
    STORYLINE_USER,
    format_bible_for_prompt,
    format_events_for_prompt,
    format_scenario_for_prompt,
    format_storyline_for_prompt,
)
from infrastructure.database.repositories import RollingStoryRepository

logger = logging.getLogger(__name__)


def parse_sse_chunks(chunk: bytes) -> List[str]:
    """Parse a Server-Sent Events chunk and extract ALL content deltas.

    Returns a list of content strings from all data lines in the chunk.
    """
    results = []
    try:
        decoded = chunk.decode('utf-8', errors='ignore')

        # Handle multiple lines in a single chunk
        for line in decoded.split('\n'):
            line = line.strip()
            if not line:
                continue
            if not line.startswith('data: '):
                continue

            data = line[6:]  # Remove 'data: ' prefix
            if data == '[DONE]':
                continue

            try:
                parsed = json.loads(data)
                choices = parsed.get('choices', [])
                if choices:
                    delta = choices[0].get('delta', {})
                    content = delta.get('content')
                    if content:  # Only add non-empty content
                        results.append(content)
            except json.JSONDecodeError:
                continue
    except Exception:
        pass
    return results


def normalize_category(category: str) -> str:
    """Normalize bible entry category to valid enum value."""
    if not category:
        return "character"

    cat_lower = category.lower().strip()

    # Map various LLM outputs to valid categories
    if cat_lower in ("character", "characters", "person", "people", "protagonist", "antagonist"):
        return "character"
    elif cat_lower in ("setting", "settings", "location", "locations", "place", "places", "environment"):
        return "setting"
    elif cat_lower in ("object", "objects", "item", "items", "thing", "things", "artifact", "artifacts"):
        return "object"

    # Default to character if unknown
    return "character"


def normalize_event_type(event_type: str) -> str:
    """Normalize event type to valid enum value."""
    if not event_type:
        return "key_event"

    et_lower = event_type.lower().strip().replace(" ", "_")

    if et_lower in ("key_event", "keyevent", "major_event", "event"):
        return "key_event"
    elif et_lower in ("decision", "choice", "decisions"):
        return "decision"
    elif et_lower in ("consequence", "result", "consequences", "outcome"):
        return "consequence"
    elif et_lower in ("unresolved", "pending", "open", "foreshadowing"):
        return "unresolved"
    elif et_lower in ("user_choice", "userchoice", "player_choice"):
        return "user_choice"

    return "key_event"


class RollingStoryAgent:
    """LangGraph agent for rolling story generation with true streaming."""

    def __init__(self):
        # We don't need the graph for streaming - we'll iterate manually
        pass

    def _get_llm_service(self, user_id: str):
        """Get the LLM service for a user."""
        from domain.services.llm_proxy_service import LLMProxyService
        return LLMProxyService.get_llm_service_for_user(user_id)

    def _build_choice_context(self, chosen_action: str, chosen_description: str, is_first_paragraph: bool) -> str:
        """Build the choice context string for prompts."""
        if not chosen_action or not is_first_paragraph:
            return ""

        context = f"## User's Choice\nThe protagonist decides to: {chosen_action}"
        if chosen_description:
            context += f"\nDetails: {chosen_description}"
        return context

    def _format_recent_paragraphs(self, paragraphs: List[str]) -> str:
        """Format the last few paragraphs for context."""
        if not paragraphs:
            return "The story is about to begin."

        # Take last 2 paragraphs for context
        recent = paragraphs[-2:] if len(paragraphs) >= 2 else paragraphs
        return "\n\n".join(recent)

    async def _generate_storyline(
        self,
        user_id: str,
        scenario: dict,
        bible: List[Dict[str, Any]],
        events: List[Dict[str, Any]],
        recent_paragraphs: List[str],
        chosen_action: str = None,
        chosen_description: str = None,
        user_influence: str = None
    ) -> Dict[str, Any]:
        """Generate or update the running storyline."""
        llm_service, provider, mode = self._get_llm_service(user_id)

        choice_context = self._build_choice_context(chosen_action, chosen_description, True)

        prompt = STORYLINE_USER.format(
            scenario_text=format_scenario_for_prompt(scenario),
            bible_text=format_bible_for_prompt(bible),
            events_text=format_events_for_prompt(events),
            recent_paragraphs=self._format_recent_paragraphs(recent_paragraphs),
            choice_context=choice_context,
            user_influence=user_influence or "None"
        )

        payload = {
            "messages": [
                {"role": "system", "content": STORYLINE_SYSTEM},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.5,
            "max_tokens": 500
        }

        response = llm_service.chat_completion(payload)

        # Extract text from response
        response_text = ""
        if isinstance(response, dict):
            choices = response.get("choices", [])
            if choices:
                response_text = choices[0].get("message", {}).get("content", "")
        elif isinstance(response, str):
            response_text = response

        # Parse JSON using robust parser
        parsed = self._parse_json_response(response_text)
        if parsed:
            return parsed

        # Default storyline
        return {
            "current_situation": "The story is unfolding",
            "tension_level": "building",
            "active_threads": [],
            "next_beat": "Continue developing the narrative",
            "pacing_notes": "Maintain steady pace"
        }

    async def _stream_paragraph(
        self,
        user_id: str,
        scenario: dict,
        bible: List[Dict[str, Any]],
        events: List[Dict[str, Any]],
        storyline: Dict[str, Any],
        recent_paragraphs: List[str],
        paragraph_number: int,
        total_paragraphs: int,
        chosen_action: str = None,
        chosen_description: str = None
    ) -> AsyncGenerator[str, None]:
        """Stream a single paragraph token by token."""
        llm_service, provider, mode = self._get_llm_service(user_id)

        choice_context = self._build_choice_context(
            chosen_action, chosen_description, paragraph_number == 1
        )

        # Add special instruction for the final paragraph
        is_final = paragraph_number == total_paragraphs
        if is_final:
            final_paragraph_instruction = """
## IMPORTANT - FINAL PARAGRAPH
This is the LAST paragraph of this cycle. You MUST end it at a critical decision point or cliffhanger.
The protagonist should face a moment of choice where multiple paths forward are clearly possible.
Examples: pointing a weapon, standing at a crossroads, confronted by someone, about to make a revelation, etc.
End at the moment of decision, NOT after it is made."""
        else:
            final_paragraph_instruction = ""

        prompt = PARAGRAPH_GENERATION_USER.format(
            scenario_text=format_scenario_for_prompt(scenario),
            bible_text=format_bible_for_prompt(bible),
            storyline_text=format_storyline_for_prompt(storyline),
            events_text=format_events_for_prompt(events),
            recent_paragraphs=self._format_recent_paragraphs(recent_paragraphs),
            choice_context=choice_context,
            paragraph_number=paragraph_number,
            total_paragraphs=total_paragraphs,
            final_paragraph_instruction=final_paragraph_instruction
        )

        payload = {
            "messages": [
                {"role": "system", "content": PARAGRAPH_GENERATION_SYSTEM},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.8,
            "max_tokens": 2048  # Increased to ensure paragraphs aren't cut off
        }

        # Use streaming endpoint
        try:
            for chunk in llm_service.chat_completion_stream(payload):
                # Parse all content from this chunk
                contents = parse_sse_chunks(chunk)
                for content in contents:
                    yield content
                # Small delay to allow other tasks
                await asyncio.sleep(0)
        except Exception as e:
            logger.error(f"Streaming failed: {e}")
            raise

    def _parse_json_response(self, response_text: str) -> Optional[Dict[str, Any]]:
        """Parse JSON from LLM response, handling various formats."""
        if not response_text:
            return None

        # Try direct parse first
        try:
            return json.loads(response_text.strip())
        except json.JSONDecodeError:
            pass

        # Try extracting from markdown code block
        code_block_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
        if code_block_match:
            try:
                return json.loads(code_block_match.group(1))
            except json.JSONDecodeError:
                pass

        # Try finding JSON object (non-greedy to get first complete object)
        # Look for balanced braces
        start_idx = response_text.find('{')
        if start_idx >= 0:
            brace_count = 0
            end_idx = start_idx
            for i, char in enumerate(response_text[start_idx:], start_idx):
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end_idx = i + 1
                        break

            if end_idx > start_idx:
                try:
                    return json.loads(response_text[start_idx:end_idx])
                except json.JSONDecodeError:
                    pass

        return None

    async def _extract_updates(
        self,
        user_id: str,
        paragraph: str,
        bible: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Extract bible and event updates from a paragraph."""
        llm_service, provider, mode = self._get_llm_service(user_id)

        prompt = EXTRACTION_USER.format(
            bible_text=format_bible_for_prompt(bible),
            paragraph=paragraph
        )

        payload = {
            "messages": [
                {"role": "system", "content": EXTRACTION_SYSTEM},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 1000
        }

        try:
            response = llm_service.chat_completion(payload)

            response_text = ""
            if isinstance(response, dict):
                choices = response.get("choices", [])
                if choices:
                    response_text = choices[0].get("message", {}).get("content", "")
            elif isinstance(response, str):
                response_text = response

            parsed = self._parse_json_response(response_text)
            if parsed:
                return parsed
        except Exception as e:
            logger.warning(f"Extraction failed (non-fatal): {e}")

        return {"bible_updates": [], "events": []}

    async def _generate_choices(
        self,
        user_id: str,
        scenario: dict,
        bible: List[Dict[str, Any]],
        events: List[Dict[str, Any]],
        last_paragraph: str,
        choice_count: int = 3
    ) -> List[Dict[str, Any]]:
        """Generate choices for the next cycle."""
        llm_service, provider, mode = self._get_llm_service(user_id)

        # Get scenario title
        jsondata = scenario.get("jsondata", "{}")
        if isinstance(jsondata, str):
            try:
                jsondata = json.loads(jsondata)
            except:
                jsondata = {}
        scenario_title = jsondata.get("title", "Untitled Story")

        # Format prompts with choice_count
        system_prompt = CHOICES_SYSTEM.format(choice_count=choice_count)
        user_prompt = CHOICES_USER.format(
            scenario_title=scenario_title,
            bible_text=format_bible_for_prompt(bible),
            events_text=format_events_for_prompt(events),
            last_paragraph=last_paragraph,
            choice_count=choice_count
        )

        payload = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 500
        }

        try:
            response = llm_service.chat_completion(payload)

            response_text = ""
            if isinstance(response, dict):
                choices = response.get("choices", [])
                if choices:
                    response_text = choices[0].get("message", {}).get("content", "")
            elif isinstance(response, str):
                response_text = response

            parsed = self._parse_json_response(response_text)
            if parsed and "choices" in parsed:
                return parsed["choices"]
        except Exception as e:
            logger.error(f"Choice generation failed: {e}")

        # Fallback choices with dynamic labels
        fallback_choices = [
            {"label": "Take action", "description": "Take decisive action to address the situation"},
            {"label": "Wait and observe", "description": "Hold back and assess the situation before acting"},
            {"label": "Find another way", "description": "Look for an alternative approach to the problem"}
        ]
        return fallback_choices[:choice_count]

    async def generate(
        self,
        story_id: int,
        user_id: str,
        scenario: dict,
        bible: List[Dict[str, Any]],
        events: List[Dict[str, Any]],
        chosen_action: str = None,
        chosen_action_description: str = None,
        user_storyline_influence: str = None,
        paragraph_count: int = 3,
        choice_count: int = 3
    ) -> Dict[str, Any]:
        """Generate paragraphs + choices (non-streaming)."""
        current_sequence = RollingStoryRepository.get_next_sequence(story_id)
        target_paragraphs = paragraph_count

        generated_paragraphs = []
        all_bible_updates = []
        all_event_updates = []
        recent_paragraph_texts = []

        # Get existing paragraphs for context
        existing = RollingStoryRepository.get_last_paragraphs(story_id, 2)
        for p in existing:
            recent_paragraph_texts.append(p.get("content", ""))

        # Generate storyline at the start
        storyline = await self._generate_storyline(
            user_id, scenario, bible, events, recent_paragraph_texts,
            chosen_action, chosen_action_description, user_storyline_influence
        )

        for i in range(target_paragraphs):
            paragraph_number = i + 1

            # Collect paragraph text
            paragraph_text = ""
            async for token in self._stream_paragraph(
                user_id, scenario, bible, events, storyline,
                recent_paragraph_texts, paragraph_number, target_paragraphs,
                chosen_action, chosen_action_description
            ):
                paragraph_text += token

            paragraph_text = paragraph_text.strip()

            # Extract updates
            updates = await self._extract_updates(user_id, paragraph_text, bible)
            bible_updates = updates.get("bible_updates", [])
            event_updates = updates.get("events", [])

            # Persist
            saved_paragraph = RollingStoryRepository.add_paragraph(
                rolling_story_id=story_id,
                sequence=current_sequence + i,
                content=paragraph_text
            )

            # Save bible entries
            for entry in bible_updates:
                if entry.get("is_new", True):
                    saved = RollingStoryRepository.add_bible_entry(
                        rolling_story_id=story_id,
                        category=normalize_category(entry.get("category", "character")),
                        name=entry.get("name", "Unknown"),
                        details=entry.get("details", {}),
                        introduced_at=current_sequence + i
                    )
                    if saved:
                        all_bible_updates.append(saved)
                        bible.append(saved)

            # Save events
            for event in event_updates:
                saved = RollingStoryRepository.add_event(
                    rolling_story_id=story_id,
                    paragraph_sequence=current_sequence + i,
                    event_type=normalize_event_type(event.get("event_type", "key_event")),
                    summary=event.get("summary", ""),
                    resolved=False
                )
                if saved:
                    all_event_updates.append(saved)
                    events.append(saved)

            generated_paragraphs.append(saved_paragraph)
            recent_paragraph_texts.append(paragraph_text)

            # Keep only last 2 for context
            if len(recent_paragraph_texts) > 2:
                recent_paragraph_texts = recent_paragraph_texts[-2:]

        # Generate choices
        choices = await self._generate_choices(
            user_id, scenario, bible, events, recent_paragraph_texts[-1], choice_count
        )

        return {
            "paragraphs": generated_paragraphs,
            "bible_updates": all_bible_updates,
            "event_updates": all_event_updates,
            "choices": choices,
            "storyline": storyline
        }

    async def stream_generate(
        self,
        story_id: int,
        user_id: str,
        scenario: dict,
        bible: List[Dict[str, Any]],
        events: List[Dict[str, Any]],
        chosen_action: str = None,
        chosen_action_description: str = None,
        user_storyline_influence: str = None,
        paragraph_count: int = 3,
        choice_count: int = 3
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream paragraph generation with real-time token delivery."""
        current_sequence = RollingStoryRepository.get_next_sequence(story_id)
        target_paragraphs = paragraph_count

        generated_paragraphs = []
        all_bible_updates = []
        all_event_updates = []
        recent_paragraph_texts = []

        # Get existing paragraphs for context
        existing = RollingStoryRepository.get_last_paragraphs(story_id, 2)
        for p in existing:
            recent_paragraph_texts.append(p.get("content", ""))

        # Generate storyline at the start
        yield {"type": "status", "message": "Planning story direction..."}

        try:
            storyline = await self._generate_storyline(
                user_id, scenario, bible, events, recent_paragraph_texts,
                chosen_action, chosen_action_description, user_storyline_influence
            )

            yield {"type": "storyline", "storyline": storyline}
        except Exception as e:
            logger.error(f"Storyline generation failed: {e}")
            storyline = {
                "current_situation": "The story continues",
                "tension_level": "building",
                "active_threads": [],
                "next_beat": "Continue the narrative",
                "pacing_notes": "Maintain pace"
            }

        for i in range(target_paragraphs):
            paragraph_number = i + 1

            yield {
                "type": "status",
                "message": f"Generating paragraph {paragraph_number} of {target_paragraphs}..."
            }

            # Stream the paragraph token by token
            paragraph_text = ""
            try:
                async for token in self._stream_paragraph(
                    user_id, scenario, bible, events, storyline,
                    recent_paragraph_texts, paragraph_number, target_paragraphs,
                    chosen_action, chosen_action_description
                ):
                    paragraph_text += token
                    # Yield each token as it arrives
                    yield {"type": "token", "content": token}
            except Exception as e:
                logger.error(f"Paragraph {paragraph_number} streaming failed: {e}")
                yield {"type": "error", "error": f"Failed to generate paragraph: {str(e)}"}
                return

            paragraph_text = paragraph_text.strip()

            # Signal paragraph complete with newlines for separation
            yield {"type": "paragraph_end", "content": "\n\n"}

            # Extract updates (background, don't stream)
            updates = await self._extract_updates(user_id, paragraph_text, bible)
            bible_updates = updates.get("bible_updates", [])
            event_updates = updates.get("events", [])

            # Persist
            try:
                saved_paragraph = RollingStoryRepository.add_paragraph(
                    rolling_story_id=story_id,
                    sequence=current_sequence + i,
                    content=paragraph_text
                )

                # Save bible entries
                for entry in bible_updates:
                    if entry.get("is_new", True):
                        saved = RollingStoryRepository.add_bible_entry(
                            rolling_story_id=story_id,
                            category=normalize_category(entry.get("category", "character")),
                            name=entry.get("name", "Unknown"),
                            details=entry.get("details", {}),
                            introduced_at=current_sequence + i
                        )
                        if saved:
                            all_bible_updates.append(saved)
                            bible.append(saved)

                # Save events
                for event in event_updates:
                    saved = RollingStoryRepository.add_event(
                        rolling_story_id=story_id,
                        paragraph_sequence=current_sequence + i,
                        event_type=normalize_event_type(event.get("event_type", "key_event")),
                        summary=event.get("summary", ""),
                        resolved=False
                    )
                    if saved:
                        all_event_updates.append(saved)
                        events.append(saved)

                generated_paragraphs.append(saved_paragraph)
                recent_paragraph_texts.append(paragraph_text)

                # Keep only last 2 for context
                if len(recent_paragraph_texts) > 2:
                    recent_paragraph_texts = recent_paragraph_texts[-2:]

            except Exception as e:
                logger.error(f"Persist failed: {e}")
                yield {"type": "error", "error": f"Failed to save paragraph: {str(e)}"}
                return

        # Generate choices
        yield {"type": "status", "message": "Generating story choices..."}

        choices = await self._generate_choices(
            user_id, scenario, bible, events, recent_paragraph_texts[-1], choice_count
        )

        yield {"type": "choices", "choices": choices}

        # Final completion event
        yield {
            "type": "complete",
            "paragraphs": generated_paragraphs,
            "bible_updates": all_bible_updates,
            "event_updates": all_event_updates,
            "choices": choices,
            "storyline": storyline
        }


# Global instance
rolling_story_agent = RollingStoryAgent()
