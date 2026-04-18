# StoryWriter — backend

The FastAPI service behind StoryWriter. It persists boards, compiles them into scenarios, and streams both story generation and the on-board persona ("Mira") over Server-Sent Events. Any OpenAI-compatible chat endpoint works (LM Studio, Ollama, vLLM, …).

For the product overview and frontend, see the top-level [README](../README.md).

## Stack

- Python 3.12+
- [FastAPI](https://fastapi.tiangolo.com/) + `uvicorn[standard]`
- [LangChain](https://python.langchain.com/) + [LangGraph](https://langchain-ai.github.io/langgraph/) — used for the persona's tool-calling loop and to drive the OpenAI-compatible client
- Pydantic v2 + `pydantic-settings` for models and configuration
- [`uv`](https://docs.astral.sh/uv/) for dependency management
- Flat JSON file storage under [data/](data/) — no database

## Source layout

- [app/main.py](app/main.py) — FastAPI app, routes, CORS
- [app/config.py](app/config.py) — `Settings` (env vars prefixed `SW_`), data directories
- [app/models.py](app/models.py) — `Board`, `BoardNode`, `Connection`, `Scenario`, request DTOs
- [app/storage.py](app/storage.py) — load / save / list / seed boards as JSON files
- [app/scenario.py](app/scenario.py) — `build_scenario(board)` compiler (board → structured scenario)
- [app/generation.py](app/generation.py) — SSE streaming for story generation and persona chat
- [app/llm.py](app/llm.py) — `writer_llm()` factory + OpenAI-compatible model auto-detection
- [app/board_tools.py](app/board_tools.py) — LangChain tools that let the persona edit a board
- [app/tools.py](app/tools.py) — generic file / memory / config tools
- [app/agent.py](app/agent.py) — LangGraph ReAct agent wrapping those tools
- [app/sample_board.json](app/sample_board.json) — seed board used on first run

## HTTP API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | resolved model + LLM base URL |
| `GET` | `/boards` | list `BoardSummary`s |
| `POST` | `/boards` | create a new board |
| `GET` | `/boards/{id}` | full board |
| `PUT` | `/boards/{id}` | replace board (autosave target) |
| `GET` | `/boards/{id}/scenario` | compiled `Scenario` |
| `POST` | `/boards/{id}/generate` | SSE stream: chapters + tokens |
| `POST` | `/boards/{id}/persona` | SSE stream: Mira's reply + tool calls |

### Streaming protocol

Both streaming endpoints emit `text/event-stream` with the frame `data: {json}\n\n`. Event shapes:

- `{"type": "token", "content": "..."}` — prose token (story) or persona speech
- `{"type": "chapter_start", "chapter": {"num": "CHAPTER I", "title": "..."}}`
- `{"type": "chapter_end"}`
- `{"type": "tool_start", "name": "...", "input": {...}}` — persona called a board tool
- `{"type": "tool_end", "name": "...", "output": "..."}`
- `{"type": "board_updated", "board": {...}}` — persona mutated the board; fresh state attached
- `{"type": "done"}` — stream terminator

## The pipeline, end to end

1. The frontend `PUT`s board edits. [storage.save_board](app/storage.py) stamps `updatedAt` and writes `data/boards/<id>.json`.
2. On `GET /boards/{id}/scenario`, [build_scenario](app/scenario.py) walks the nodes:
   - `character` nodes become entries with role/age/traits/description
   - the first `world` node becomes `setting`, the rest become `rules`
   - `tone` nodes concatenate into `world.tone`
   - `beat` nodes, **sorted left-to-right by x**, become the ordered plot beats
   - character↔character connections become labelled relationship edges
   - `ready` flips true once there's at least one character and one beat
3. On `POST /boards/{id}/generate`, [stream_story](app/generation.py) iterates the beats. For each one it streams a chapter of literary prose (~400–600 words) through `writer_llm()`, bracketed by `chapter_start` / `chapter_end` events.
4. On `POST /boards/{id}/persona`, [stream_persona](app/generation.py) gives the LLM the current board plus the user's message and the eight board-editing tools from [board_tools.py](app/board_tools.py). It loops up to `MAX_TOOL_ITERATIONS` times: stream tokens → run any tool calls → if the board changed, emit `board_updated` so the client can re-render live.

## Board-editing tools (the persona's toolbox)

Built in [app/board_tools.py](app/board_tools.py) and bound per-request so each one closes over the live `Board`:

- `add_character`, `add_setting`, `add_tone`, `add_beat` — create nodes, auto-placed in lanes by kind
- `update_node` — partial update; `""` clears a field
- `delete_node` — also cleans up connections touching it
- `add_connection`, `remove_connection` — manage labelled edges (order-independent)

## Model resolution

[app/llm.py](app/llm.py) resolves the model lazily on first use:

1. If `SW_LLM_MODEL` is set, use it verbatim.
2. Otherwise, `GET {SW_LLM_BASE_URL}/models` and pick the first id that doesn't contain `embed`.
3. Fallback: the string `"local-model"`.

The resolved id is cached for the process lifetime and surfaced via `GET /health`.

## Configuration

Environment variables (or `backend/.env`), all prefixed `SW_`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SW_LLM_BASE_URL` | `http://192.168.32.1:1234/v1` | OpenAI-compatible base URL |
| `SW_LLM_API_KEY` | `lm-studio` | bearer token (placeholder is fine for local models) |
| `SW_LLM_MODEL` | *(empty)* | explicit model id; empty → auto-detect |
| `SW_LLM_REQUEST_TIMEOUT` | `60.0` | per-request timeout, seconds |
| `SW_CORS_ORIGINS` | `["http://localhost:5173"]` | allowed frontend origins |

On startup, [app/config.py](app/config.py) ensures the subdirectories of `data/` exist:

- `data/boards/` — one JSON file per board
- `data/files/` — backing store for `read_file` / `write_file` / `list_files`
- `data/memory/` — `memory_store` / `memory_retrieve` / `memory_list`
- `data/config/` — `config_read` / `config_write`

If `data/boards/` is empty, [app/sample_board.json](app/sample_board.json) is seeded on startup so the UI has something to load.

## Running

```bash
uv sync                                  # one-time
uv run uvicorn app.main:app --reload     # dev server on :8000
```

Or from the repo root, `./start_backend.sh`.

Sanity check:

```bash
curl http://localhost:8000/health
# {"status":"ok","model":"...","llm_base_url":"..."}
```

## Notes

- No database, no migrations — boards are plain JSON and safe to edit by hand.
- The `agent.py` ReAct agent wraps the generic file/memory/config tools; the *persona* endpoint deliberately does not use it, because it needs per-request tools bound to a specific board instance (see [app/generation.py](app/generation.py)).
- `Connection` uses `from` as the field name on the wire; internally it's `from_` with a Pydantic alias (`populate_by_name=True`).
