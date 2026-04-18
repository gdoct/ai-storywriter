import json
from collections.abc import AsyncIterator

from langchain_core.messages import AIMessageChunk, HumanMessage, SystemMessage, ToolMessage

from . import storage
from .board_tools import build_board_tools
from .llm import writer_llm
from .models import Board
from .scenario import build_scenario

CHAPTER_COUNT = 5

CHAPTER_SYSTEM = """You are the Writer for the StoryWriter app. You receive a scenario assembled
from the user's board (characters, world, tone, plot beats) and draft a single chapter at a time
in literary prose. Match the requested tone. Use paragraphs separated by blank lines. Do not write
chapter headings — those are added by the system. Do not narrate meta. Just the chapter prose."""


def _sse(payload: dict) -> bytes:
    return f"data: {json.dumps(payload)}\n\n".encode()


async def stream_story(board: Board) -> AsyncIterator[bytes]:
    scenario = build_scenario(board)
    if not scenario.characters:
        yield _sse({
            "type": "chapter_start",
            "chapter": {"num": "—", "title": "Board is empty"},
        })
        yield _sse({
            "type": "token",
            "content": "Add at least one character and one plot beat on the board, then try again.",
        })
        yield _sse({"type": "done"})
        return

    llm = writer_llm()
    beats = scenario.plot["beats"]
    plan = beats if beats else [{"title": f"Chapter {i + 1}"} for i in range(CHAPTER_COUNT)]

    for idx, beat in enumerate(plan, start=1):
        title = beat.get("title") or f"Chapter {idx}"
        description = beat.get("description") or ""
        roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][idx - 1] if idx <= 10 else str(idx)
        yield _sse({
            "type": "chapter_start",
            "chapter": {"num": f"CHAPTER {roman}", "title": title},
        })

        beat_line = f"{title} — {description}" if description else title
        prompt = (
            f"Scenario JSON:\n{scenario.model_dump_json(indent=2)}\n\n"
            f"Write Chapter {idx} of {len(plan)}, focused on the beat: {beat_line!r}. "
            f"Roughly 400-600 words. Stay in tone."
        )
        messages = [SystemMessage(content=CHAPTER_SYSTEM), HumanMessage(content=prompt)]
        try:
            async for chunk in llm.astream(messages):
                if chunk.content:
                    yield _sse({"type": "token", "content": chunk.content})
            yield _sse({"type": "token", "content": "\n\n"})
        except Exception as e:
            yield _sse({"type": "token", "content": f"\n\n[error: {e}]\n\n"})
            break

        yield _sse({"type": "chapter_end"})

    yield _sse({"type": "done"})


PERSONA_SYSTEM = """You are {name}, the user's story companion in the StoryWriter app.
You see the current board (characters, world, tone, beats) and help the user develop it.
Be brief, warm, concrete. Suggest one or two specific moves at a time. Do not lecture.

You have tools that can edit the board (add/update/delete character, setting, tone, or
beat cards, and link cards together). Use them ONLY when the user asks you to change
the board — otherwise just discuss ideas. When you do edit, make the smallest change
the user asked for, then confirm briefly in chat."""

MAX_TOOL_ITERATIONS = 6


def _board_view(board: Board) -> str:
    """Compact JSON view with IDs so the LLM can reference nodes in tool calls."""
    nodes = [
        {k: v for k, v in n.model_dump().items() if v not in (None, [], "")}
        for n in board.nodes
    ]
    conns = [
        {k: v for k, v in c.model_dump(by_alias=True).items() if v is not None}
        for c in board.connections
    ]
    return json.dumps({"title": board.title, "nodes": nodes, "connections": conns}, indent=2)


async def stream_persona(board: Board, message: str) -> AsyncIterator[bytes]:
    board_dirty = False

    def persist(b: Board) -> None:
        nonlocal board_dirty
        storage.save_board(b)
        board_dirty = True

    tools = build_board_tools(board, persist)
    tools_by_name = {t.name: t for t in tools}
    llm = writer_llm().bind_tools(tools)

    system = PERSONA_SYSTEM.format(name=board.personaName)
    context = (
        f"Current board (use these ids when editing):\n{_board_view(board)}\n\n"
        f"User says: {message}"
    )
    messages = [SystemMessage(content=system), HumanMessage(content=context)]

    try:
        for _ in range(MAX_TOOL_ITERATIONS):
            accumulated: AIMessageChunk | None = None
            async for chunk in llm.astream(messages):
                if chunk.content:
                    text = chunk.content if isinstance(chunk.content, str) else str(chunk.content)
                    if text:
                        yield _sse({"type": "token", "content": text})
                accumulated = chunk if accumulated is None else accumulated + chunk

            if accumulated is None:
                break
            messages.append(accumulated)

            tool_calls = getattr(accumulated, "tool_calls", None) or []
            if not tool_calls:
                break

            for tc in tool_calls:
                name = tc.get("name", "")
                args = tc.get("args", {}) or {}
                yield _sse({"type": "tool_start", "name": name, "input": args})
                fn = tools_by_name.get(name)
                if fn is None:
                    result = f"Unknown tool: {name}"
                else:
                    try:
                        result = fn.invoke(args)
                    except Exception as e:
                        result = f"Error: {e}"
                result_str = str(result)
                yield _sse({"type": "tool_end", "name": name, "output": result_str})
                messages.append(ToolMessage(content=result_str, tool_call_id=tc.get("id", "")))

            if board_dirty:
                yield _sse({"type": "board_updated", "board": json.loads(board.model_dump_json(by_alias=True))})
                board_dirty = False
    except Exception as e:
        yield _sse({"type": "token", "content": f"[error: {e}]"})

    yield _sse({"type": "done"})
