# StoryWriter

> **v2 — rebuilt from the ground up.** The previous form-based scenario editor has been replaced by a visual canvas workflow, a slimmer FastAPI + LangGraph backend, and a file-based data store. Nothing from v1 carries over; this is a fresh codebase around a new interaction model.

StoryWriter is a visual writing tool built around a **canvas board**: instead of filling in forms, you arrange story ideas as connected cards on an infinite canvas. Characters, worlds, tones, and plot beats live as nodes you can drag, link, and annotate. When the board feels right, StoryWriter compiles it into a structured scenario and hands it to an AI to draft the story — streamed paragraph-by-paragraph into an in-app reader.

The app talks to any OpenAI-compatible endpoint (LM Studio, Ollama, vLLM, …). No API keys or accounts are required for local models.

<img width="1205" height="996" alt="image" src="https://github.com/user-attachments/assets/9fb9f8df-2ab1-47fb-8d76-d9f3de8a92ea" />

## The workflow

StoryWriter is organised as three linked screens you move through from left to right:

1. **Board** — the canvas. Add nodes (`character`, `world`, `tone`, `beat`), give them a name/title/body and tags, drag them around, and draw connections between them. A persona named **Mira** sits on the board and can answer questions or nudge the shape of your story as you build it.

   <img width="892" height="726" alt="image" src="https://github.com/user-attachments/assets/3c0608bd-4f08-4d3f-a4d7-7335075e6fe5" />


2. **Scenario** — the compiled view. StoryWriter walks the board and assembles a structured scenario (logline, POV, characters, world, plot, connections). This is the exact payload that will be sent to the model, so you can inspect and tweak intent before generating.

   <img width="1002" height="922" alt="image" src="https://github.com/user-attachments/assets/001b4098-3866-4131-a239-054ffa32acfc" />


3. **Story (Reader)** — the output. The scenario is streamed through the LLM over Server-Sent Events and rendered into a clean reading view as it arrives.

   <img width="1002" height="786" alt="image" src="https://github.com/user-attachments/assets/7d298591-b378-4898-addf-f6604971d159" />


A palette switcher (`warm` / `cool` / `rose` / `ink`) re-themes the entire workspace, and the board auto-saves as you edit.

<img width="372" height="90" alt="image" src="https://github.com/user-attachments/assets/7229cc17-d3d0-4d3b-9671-c0cc9d8de6bd" />


## Tech stack

- **Frontend**: React 19 + TypeScript + Vite, hand-rolled canvas (no React Flow / D3 dependency).
- **Backend**: FastAPI (Python 3.12+), LangGraph + LangChain for the agent that drives Mira and the generation pipeline.
- **LLM transport**: OpenAI-compatible HTTP, configured via environment variables.
- **Storage**: local JSON files under `backend/data/` — boards, memory, and config. No database.

## Project structure

- [frontend/](frontend/) — Vite + React app
  - [src/App.tsx](frontend/src/App.tsx) — screen router, save orchestration, palette
  - [src/components/CanvasBoard.tsx](frontend/src/components/CanvasBoard.tsx) — the board surface
  - [src/components/ScenarioPage.tsx](frontend/src/components/ScenarioPage.tsx), [src/components/ReaderPage.tsx](frontend/src/components/ReaderPage.tsx) — scenario + streamed story
  - [src/api/client.ts](frontend/src/api/client.ts) — backend client
- [backend/](backend/) — FastAPI service
  - [app/main.py](backend/app/main.py) — routes (`/boards`, `/boards/{id}/scenario`, `/boards/{id}/generate`, `/boards/{id}/persona`)
  - [app/scenario.py](backend/app/scenario.py) — compiles a board into a scenario
  - [app/generation.py](backend/app/generation.py) — story + persona streaming
  - [app/agent.py](backend/app/agent.py), [app/board_tools.py](backend/app/board_tools.py) — LangGraph agent and board tools
  - [app/storage.py](backend/app/storage.py) — JSON persistence under `backend/data/`

## Prerequisites

- Node.js 20+ and [Yarn](https://classic.yarnpkg.com/)
- Python 3.12+ and [uv](https://docs.astral.sh/uv/)
- An OpenAI-compatible LLM endpoint (e.g. LM Studio, Ollama, vLLM)

## Configuration

The backend reads settings from environment variables (or a `backend/.env` file) prefixed with `SW_`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SW_LLM_BASE_URL` | `http://127.0.0.1:1234/v1` | OpenAI-compatible base URL |
| `SW_LLM_API_KEY` | `lm-studio` | API key (any placeholder works for local models) |
| `SW_LLM_MODEL` | *(empty)* | Model id; empty auto-detects via `/v1/models` |
| `SW_LLM_REQUEST_TIMEOUT` | `60.0` | Per-request timeout, seconds |
| `SW_CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed frontend origins |

Boards and related state are persisted under `backend/data/`. On first run, a sample board is seeded so you can see the workflow end to end.

## Running locally

```bash
# one-time: install dependencies
cd backend && uv sync && cd ..
cd frontend && yarn install && cd ..
```

Then start both processes (in separate shells):

```bash
./start_backend.sh   # FastAPI on http://localhost:8000
./start_frontend.sh  # Vite dev server on http://localhost:5173
```

Open <http://localhost:5173> and either pick the seeded board or start a new one from the landing screen.

## License

MIT — see [LICENSE](LICENSE).
