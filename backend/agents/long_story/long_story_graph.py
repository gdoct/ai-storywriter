"""
Long Story Agent - Linear pipeline for generating complete chapter-based stories.

Pipeline:
  generate_synopsis → generate_arc → [loop per chapter: generate_storyline → stream_chapter] → END

Streaming events emitted:
  {type: "status",          message: str}
  {type: "synopsis",        content: str}
  {type: "arc",             chapters: list}
  {type: "chapter_start",   chapter_number: int, title: str, storyline: dict}
  {type: "token",           content: str}
  {type: "chapter_complete",chapter_number: int, title: str}
  {type: "complete",        total_chapters: int}
  {type: "error",           error: str}
"""
import json
import logging
import re
from typing import AsyncGenerator, Any, cast

from .state import LongStoryState, ChapterStoryline
from .prompts import (
    SYNOPSIS_SYSTEM, SYNOPSIS_USER,
    ARC_SYSTEM, ARC_USER,
    STORYLINE_SYSTEM, STORYLINE_USER,
    get_chapter_system_prompt, CHAPTER_USER,
    extract_scenario_fields, format_arc_for_prompt,
)
from infrastructure.database.repositories import LongStoryRepository

logger = logging.getLogger(__name__)


def _parse_sse_token(chunk: bytes) -> list[str]:
    """Extract content tokens from a raw SSE chunk."""
    results = []
    try:
        decoded = chunk.decode('utf-8', errors='ignore')
        for line in decoded.split('\n'):
            line = line.strip()
            if not line.startswith('data: '):
                continue
            data = line[6:]
            if data == '[DONE]':
                continue
            try:
                parsed = json.loads(data)
                for choice in parsed.get('choices', []):
                    content = choice.get('delta', {}).get('content')
                    if content:
                        results.append(content)
            except json.JSONDecodeError:
                continue
    except Exception:
        pass
    return results


def _parse_json_response(text: str) -> Any:
    """Parse JSON from an LLM response, handling markdown fences and whitespace."""
    if not text:
        return None
    cleaned = text.strip().replace('{{', '{').replace('}}', '}')

    # Direct parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Strip markdown code fence
    m = re.search(r'```(?:json)?\s*([\[{][\s\S]*?[\]}])\s*```', cleaned)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass

    # Find first balanced { … } or [ … ]
    for open_char, close_char in [('{', '}'), ('[', ']')]:
        start = cleaned.find(open_char)
        if start < 0:
            continue
        depth = 0
        in_str = False
        escape = False
        for i, ch in enumerate(cleaned[start:], start):
            if escape:
                escape = False
                continue
            if ch == '\\':
                escape = True
                continue
            if ch == '"' and not escape:
                in_str = not in_str
                continue
            if in_str:
                continue
            if ch == open_char:
                depth += 1
            elif ch == close_char:
                depth -= 1
                if depth == 0:
                    try:
                        return json.loads(cleaned[start:i + 1])
                    except json.JSONDecodeError:
                        break
    return None


class LongStoryAgent:
    """Agent that generates a complete, chapter-by-chapter story."""

    def _get_llm_service(self, user_id: str):
        from domain.services.llm_proxy_service import LLMProxyService
        return LLMProxyService.get_llm_service_for_user(user_id)

    async def _call_llm(self, user_id: str, system: str, user: str,
                        temperature: float = 0.7, max_tokens: int = 2000) -> str:
        """Non-streaming LLM call; returns the response text."""
        llm_service, _, _ = self._get_llm_service(user_id)
        payload = {
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        response = llm_service.chat_completion(payload)
        if isinstance(response, dict):
            choices = response.get('choices', [])
            if choices:
                return choices[0].get('message', {}).get('content', '')
        return str(response)

    async def _stream_llm(self, user_id: str, system: str, user: str,
                          temperature: float = 0.8, max_tokens: int = 4000):
        """Streaming LLM call; yields content tokens."""
        import asyncio
        llm_service, _, _ = self._get_llm_service(user_id)
        payload = {
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        try:
            for chunk in llm_service.chat_completion_stream(payload):
                tokens = _parse_sse_token(chunk)
                for token in tokens:
                    yield token
                await asyncio.sleep(0)
        except Exception as e:
            logger.error(f"Streaming LLM call failed: {e}")
            raise

    # ── Pipeline steps ────────────────────────────────────────────────────────

    async def _generate_synopsis(self, state: LongStoryState, emit) -> str:
        await emit({"type": "status", "message": "Generating story synopsis..."})
        fields = extract_scenario_fields(state['scenario'])
        user_prompt = SYNOPSIS_USER.format(
            title=fields['title'],
            description=fields['description'],
            writing_style=fields['writing_style'],
            characters=fields['characters'],
            story_arc=fields['story_arc'] or 'Not defined.',
        )
        synopsis = await self._call_llm(
            state['user_id'], SYNOPSIS_SYSTEM, user_prompt,
            temperature=0.7, max_tokens=300
        )
        synopsis = synopsis.strip()

        # Save to DB
        LongStoryRepository.update_long_story(
            state['story_id'], state['user_id'],
            synopsis=synopsis, status='in_progress'
        )
        await emit({"type": "synopsis", "content": synopsis})
        return synopsis

    async def _generate_arc(self, state: LongStoryState, synopsis: str, emit) -> list:
        await emit({"type": "status", "message": "Building chapter arc..."})
        fields = extract_scenario_fields(state['scenario'])
        user_prompt = ARC_USER.format(
            synopsis=synopsis,
            title=fields['title'],
            writing_style=fields['writing_style'],
            characters=fields['characters'],
            story_arc=fields['story_arc'] or 'Not defined.',
        )
        raw = await self._call_llm(
            state['user_id'], ARC_SYSTEM, user_prompt,
            temperature=0.7, max_tokens=1500
        )
        arc = _parse_json_response(raw)
        if not isinstance(arc, list):
            logger.warning(f"Arc parse failed, got: {type(arc)}. Raw: {raw[:200]}")
            # Fallback minimal arc
            arc = [{"chapter_number": 1, "title": "The Story", "one_liner": synopsis}]

        # Normalise chapter_number (ensure 1-based sequential)
        for i, item in enumerate(arc):
            item['chapter_number'] = i + 1
            if 'title' not in item:
                item['title'] = f"Chapter {i + 1}"
            if 'one_liner' not in item:
                item['one_liner'] = ''

        # Save arc to DB and create chapter rows
        arc_json = json.dumps(arc)
        LongStoryRepository.update_long_story(
            state['story_id'], state['user_id'], story_arc=arc_json
        )
        LongStoryRepository.create_chapters_from_arc(state['story_id'], arc)

        await emit({"type": "arc", "chapters": arc})
        return arc

    async def _generate_chapter_storyline(self, state: LongStoryState, synopsis: str,
                                          arc: list, chapter_index: int, emit) -> dict:
        chapter = arc[chapter_index]
        chapter_number = chapter['chapter_number']
        chapter_title = chapter['title']
        one_liner = chapter.get('one_liner', '')

        await emit({"type": "status", "message": f"Planning Chapter {chapter_number}: {chapter_title}..."})

        fields = extract_scenario_fields(state['scenario'])
        is_first = chapter_index == 0
        previous_ending = state.get('last_chapter_ending') or ('This is the opening chapter — begin the story.' if is_first else 'Continuation of the previous chapter.')
        previous_conclusion = state.get('last_chapter_conclusion') or ('N/A — this is the first chapter.' if is_first else 'Previous chapter conclusion unavailable.')

        user_prompt = STORYLINE_USER.format(
            synopsis=synopsis,
            chapter_number=chapter_number,
            chapter_title=chapter_title,
            one_liner=one_liner,
            previous_conclusion=previous_conclusion,
            previous_ending=previous_ending,
            characters=fields['characters'],
            full_arc=format_arc_for_prompt(arc),
        )
        raw = await self._call_llm(
            state['user_id'], STORYLINE_SYSTEM, user_prompt,
            temperature=0.7, max_tokens=600
        )
        storyline = _parse_json_response(raw)
        if not isinstance(storyline, dict):
            logger.warning(f"Storyline parse failed for ch{chapter_number}. Using fallback.")
            storyline = {
                "setup": f"The story continues into Chapter {chapter_number}.",
                "main_event": one_liner,
                "conclusion": "The chapter ends, setting up the next.",
            }

        storyline['chapter_number'] = chapter_number
        storyline['title'] = chapter_title

        # Persist storyline into DB chapter row
        db_chapter = LongStoryRepository.get_chapter_by_number(state['story_id'], chapter_number)
        if db_chapter:
            LongStoryRepository.update_chapter(
                db_chapter['id'], state['story_id'],
                storyline=json.dumps(storyline), status='generating'
            )

        await emit({
            "type": "chapter_start",
            "chapter_number": chapter_number,
            "title": chapter_title,
            "storyline": storyline,
        })
        return storyline

    async def _stream_chapter_text(self, state: LongStoryState, synopsis: str,
                                   arc: list, storyline: dict, emit) -> str:
        chapter_number = storyline['chapter_number']
        chapter_title = storyline['title']
        fields = extract_scenario_fields(state['scenario'])
        is_first = chapter_number == 1
        previous_ending = state.get('last_chapter_ending') or ('Begin the story here.' if is_first else 'Continuation.')
        previous_conclusion = state.get('last_chapter_conclusion') or ('N/A — this is the opening chapter.' if is_first else '')

        if is_first:
            continuity_instruction = 'This is Chapter 1 — begin the story fresh from the setup described in the storyline. Establish the setting, atmosphere, and characters fully.'
        else:
            continuity_instruction = f'Continue directly from where Chapter {chapter_number - 1} ended. Write the full {1200} words — do not rush or summarise. Describe the scene and atmosphere richly even though the story is already in progress.'

        system_prompt = get_chapter_system_prompt(word_count=1200)
        user_prompt = CHAPTER_USER.format(
            chapter_number=chapter_number,
            chapter_title=chapter_title,
            setup=storyline.get('setup', ''),
            main_event=storyline.get('main_event', ''),
            conclusion=storyline.get('conclusion', ''),
            synopsis=synopsis,
            characters=fields['characters'],
            writing_style=fields['writing_style'],
            previous_conclusion=previous_conclusion,
            previous_ending=previous_ending,
            continuity_instruction=continuity_instruction,
        )

        full_content = ''
        async for token in self._stream_llm(
            state['user_id'], system_prompt, user_prompt,
            temperature=0.8, max_tokens=4000
        ):
            full_content += token
            await emit({"type": "token", "content": token})

        # Save chapter content to DB
        db_chapter = LongStoryRepository.get_chapter_by_number(state['story_id'], chapter_number)
        if db_chapter:
            LongStoryRepository.update_chapter(
                db_chapter['id'], state['story_id'],
                content=full_content, status='complete'
            )

        await emit({"type": "chapter_complete", "chapter_number": chapter_number, "title": chapter_title})
        return full_content

    # ── Public entry points ───────────────────────────────────────────────────

    async def stream_generate_arc(
        self,
        story_id: int,
        user_id: str,
        scenario: dict,
    ) -> AsyncGenerator[dict, None]:
        """
        Phase 1: Generate synopsis + story arc only, then stop.

        Saves synopsis and arc to DB, sets status to 'arc_ready'.
        The user can then review/edit the arc before triggering chapter generation.
        """
        import asyncio

        event_queue: asyncio.Queue = asyncio.Queue()

        async def emit(event: dict):
            await event_queue.put(event)

        async def _run():
            try:
                state: LongStoryState = {
                    'story_id': story_id,
                    'user_id': user_id,
                    'scenario': scenario,
                    'synopsis': None,
                    'story_arc': [],
                    'chapter_storylines': [],
                    'current_chapter_index': 0,
                    'total_chapters': 0,
                    'current_storyline': None,
                    'last_chapter_ending': None,
                    'last_chapter_conclusion': None,
                    'generated_chapters': [],
                    'stream_callback': None,
                    'error': None,
                    'complete': False,
                }

                synopsis = await self._generate_synopsis(state, emit)
                state['synopsis'] = synopsis

                arc = await self._generate_arc(state, synopsis, emit)
                state['story_arc'] = arc

                # Mark as awaiting user review
                LongStoryRepository.update_long_story(story_id, user_id, status='arc_ready')
                await emit({"type": "arc_ready", "total_chapters": len(arc)})

            except Exception as e:
                logger.error(f"Arc generation failed: {e}", exc_info=True)
                await emit({"type": "error", "error": str(e)})
            finally:
                await event_queue.put(None)

        task = asyncio.create_task(_run())
        while True:
            event = await event_queue.get()
            if event is None:
                break
            yield event
        await task

    async def stream_generate_chapters(
        self,
        story_id: int,
        user_id: str,
        scenario: dict,
    ) -> AsyncGenerator[dict, None]:
        """
        Phase 2: Generate chapters using the already-saved synopsis and arc.

        Reads synopsis and arc from the DB. Skips chapters that are already complete
        (resume support). Sets status to 'in_progress', then 'completed' when done.
        """
        import asyncio

        event_queue: asyncio.Queue = asyncio.Queue()

        async def emit(event: dict):
            await event_queue.put(event)

        async def _run():
            try:
                existing = LongStoryRepository.get_long_story_with_chapters(story_id, user_id)
                if not existing:
                    await emit({"type": "error", "error": "Story not found."})
                    return

                synopsis = existing.get('synopsis')
                arc_json = existing.get('story_arc')
                if not synopsis or not arc_json:
                    await emit({"type": "error", "error": "Story arc not ready. Generate the arc first."})
                    return

                try:
                    arc = json.loads(arc_json)
                except Exception:
                    await emit({"type": "error", "error": "Could not parse stored story arc."})
                    return

                state: LongStoryState = {
                    'story_id': story_id,
                    'user_id': user_id,
                    'scenario': scenario,
                    'synopsis': synopsis,
                    'story_arc': arc,
                    'chapter_storylines': [],
                    'current_chapter_index': 0,
                    'total_chapters': len(arc),
                    'current_storyline': None,
                    'last_chapter_ending': None,
                    'last_chapter_conclusion': None,
                    'generated_chapters': [],
                    'stream_callback': None,
                    'error': None,
                    'complete': False,
                }

                # Emit synopsis and arc so the frontend can render them on resume
                await emit({"type": "synopsis", "content": synopsis})
                await emit({"type": "arc", "chapters": arc})

                LongStoryRepository.update_long_story(story_id, user_id, status='in_progress')

                existing_chapters = {
                    c['chapter_number']: c
                    for c in (existing.get('chapters') or [])
                }

                for idx, chapter_item in enumerate(arc):
                    chapter_number = chapter_item['chapter_number']
                    existing_ch = existing_chapters.get(chapter_number)

                    # Skip already-completed chapters but replay their events
                    if existing_ch and existing_ch.get('status') == 'complete' and existing_ch.get('content'):
                        storyline_raw = existing_ch.get('storyline')
                        storyline = json.loads(storyline_raw) if storyline_raw else {
                            'chapter_number': chapter_number,
                            'title': chapter_item['title'],
                            'setup': '', 'main_event': '', 'conclusion': '',
                        }
                        await emit({
                            "type": "chapter_start",
                            "chapter_number": chapter_number,
                            "title": chapter_item['title'],
                            "storyline": storyline,
                        })
                        content = existing_ch['content']
                        await emit({"type": "token", "content": content})
                        await emit({"type": "chapter_complete", "chapter_number": chapter_number, "title": chapter_item['title']})
                        state['last_chapter_ending'] = content[-800:] if len(content) > 800 else content
                        state['last_chapter_conclusion'] = storyline.get('conclusion', '')
                        state['generated_chapters'].append({'chapter_number': chapter_number, 'title': chapter_item['title'], 'content': content})
                        continue

                    # Generate this chapter
                    storyline = await self._generate_chapter_storyline(state, synopsis, arc, idx, emit)
                    state['current_storyline'] = storyline

                    content = await self._stream_chapter_text(state, synopsis, arc, storyline, emit)

                    state['last_chapter_ending'] = content[-800:] if len(content) > 800 else content
                    state['last_chapter_conclusion'] = storyline.get('conclusion', '')
                    state['generated_chapters'].append({
                        'chapter_number': chapter_number,
                        'title': chapter_item['title'],
                        'content': content,
                    })

                LongStoryRepository.update_long_story(story_id, user_id, status='completed')
                await emit({"type": "complete", "total_chapters": len(arc)})

            except Exception as e:
                logger.error(f"Chapter generation failed: {e}", exc_info=True)
                await emit({"type": "error", "error": str(e)})
            finally:
                await event_queue.put(None)

        task = asyncio.create_task(_run())
        while True:
            event = await event_queue.get()
            if event is None:
                break
            yield event
        await task


    async def stream_generate_single_chapter(
        self,
        story_id: int,
        user_id: str,
        scenario: dict,
        chapter_number: int,
    ) -> AsyncGenerator[dict, None]:
        """
        Generate (or regenerate) a single chapter.

        Reads synopsis and arc from the DB.
        Loads the previous chapter's content from DB for continuity.
        Resets the target chapter to pending before generating.

        Events: status, chapter_start, token, chapter_complete (with is_last, total_chapters)
        """
        import asyncio

        event_queue: asyncio.Queue = asyncio.Queue()

        async def emit(event: dict):
            await event_queue.put(event)

        async def _run():
            try:
                existing = LongStoryRepository.get_long_story_with_chapters(story_id, user_id)
                if not existing:
                    await emit({"type": "error", "error": "Story not found."})
                    return

                synopsis = existing.get('synopsis')
                arc_json = existing.get('story_arc')
                if not synopsis or not arc_json:
                    await emit({"type": "error", "error": "Story arc not ready. Generate the arc first."})
                    return

                try:
                    arc = json.loads(arc_json)
                except Exception:
                    await emit({"type": "error", "error": "Could not parse stored story arc."})
                    return

                # Find the index in the arc for the requested chapter
                chapter_idx = next(
                    (i for i, c in enumerate(arc) if c['chapter_number'] == chapter_number), None
                )
                if chapter_idx is None:
                    await emit({"type": "error", "error": f"Chapter {chapter_number} not in arc."})
                    return

                # Derive continuity from the previous completed chapter in DB
                chapters_by_number = {c['chapter_number']: c for c in (existing.get('chapters') or [])}
                last_ending = None
                last_conclusion = None
                if chapter_number > 1:
                    prev = chapters_by_number.get(chapter_number - 1)
                    if prev and prev.get('content'):
                        content_prev = prev['content']
                        last_ending = content_prev[-800:] if len(content_prev) > 800 else content_prev
                        sl_raw = prev.get('storyline')
                        if sl_raw:
                            try:
                                last_conclusion = json.loads(sl_raw).get('conclusion', '')
                            except Exception:
                                pass

                state: LongStoryState = {
                    'story_id': story_id,
                    'user_id': user_id,
                    'scenario': scenario,
                    'synopsis': synopsis,
                    'story_arc': arc,
                    'chapter_storylines': [],
                    'current_chapter_index': chapter_idx,
                    'total_chapters': len(arc),
                    'current_storyline': None,
                    'last_chapter_ending': last_ending,
                    'last_chapter_conclusion': last_conclusion,
                    'generated_chapters': [],
                    'stream_callback': None,
                    'error': None,
                    'complete': False,
                }

                # Reset the target chapter (supports regeneration)
                db_chapter = LongStoryRepository.get_chapter_by_number(story_id, chapter_number)
                if db_chapter:
                    LongStoryRepository.reset_chapter(db_chapter['id'], story_id)
                else:
                    # Chapter row may not exist yet — create it from arc item
                    LongStoryRepository.create_chapters_from_arc(story_id, [arc[chapter_idx]])
                    db_chapter = LongStoryRepository.get_chapter_by_number(story_id, chapter_number)

                LongStoryRepository.update_long_story(story_id, user_id, status='in_progress')

                # Generate storyline + prose
                storyline = await self._generate_chapter_storyline(state, synopsis, arc, chapter_idx, emit)
                state['current_storyline'] = cast(ChapterStoryline, storyline)
                await self._stream_chapter_text(state, synopsis, arc, storyline, emit)

                is_last = chapter_number == len(arc)
                LongStoryRepository.update_long_story(
                    story_id, user_id,
                    status='completed' if is_last else 'in_progress'
                )
                await emit({
                    "type": "chapter_complete",
                    "chapter_number": chapter_number,
                    "title": arc[chapter_idx]['title'],
                    "is_last": is_last,
                    "total_chapters": len(arc),
                })

            except Exception as e:
                logger.error(f"Single chapter generation failed: {e}", exc_info=True)
                await emit({"type": "error", "error": str(e)})
            finally:
                await event_queue.put(None)

        task = asyncio.create_task(_run())
        while True:
            event = await event_queue.get()
            if event is None:
                break
            yield event
        await task


long_story_agent = LongStoryAgent()
