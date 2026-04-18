# StoryWriter — frontend

The React + Vite client for StoryWriter. It renders the canvas board, the compiled scenario view, and the streamed story reader, and talks to the FastAPI backend over REST + Server-Sent Events.

For the product overview and backend setup, see the top-level [README](../README.md).

## Stack

- React 19 + TypeScript
- Vite 8 (dev server + build)
- No UI kit — the canvas, inspector, and board chrome are hand-rolled against plain CSS in [src/index.css](src/index.css) and [src/canvas.css](src/canvas.css)
- No router — the app is a single `App` component switching between four screens (`landing` / `board` / `scenario` / `reader`)

## Source layout

- [src/App.tsx](src/App.tsx) — top-level screen router, debounced autosave, palette + save-state indicators
- [src/main.tsx](src/main.tsx) — React entrypoint
- [src/api/client.ts](src/api/client.ts) — REST + SSE client (`listBoards`, `saveBoard`, `streamGeneration`, `streamPersona`, …)
- [src/components/](src/components/)
  - [Landing.tsx](src/components/Landing.tsx) — board list + "new board" entry point
  - [CanvasBoard.tsx](src/components/CanvasBoard.tsx) — the draggable canvas
  - [NodeCard.tsx](src/components/NodeCard.tsx) — individual node rendering
  - [Connections.tsx](src/components/Connections.tsx) — SVG edges between nodes
  - [Inspector.tsx](src/components/Inspector.tsx) — side panel for editing the selected node
  - [Persona.tsx](src/components/Persona.tsx) — Mira, the on-board assistant
  - [ScenarioPage.tsx](src/components/ScenarioPage.tsx) — compiled scenario preview
  - [ReaderPage.tsx](src/components/ReaderPage.tsx) — streamed story view
- [src/types/board.ts](src/types/board.ts) — shared types (`Board`, `BoardNode`, `Connection`, `Scenario`, `PaletteName`)
- [src/data/palettes.ts](src/data/palettes.ts) — palette tokens + `applyPalette()` helper
- [src/data/sampleBoard.ts](src/data/sampleBoard.ts) — fallback board used before the backend responds

## How it connects to the backend

The API base URL defaults to `http://localhost:8000` and can be overridden with `VITE_API_BASE`:

```bash
VITE_API_BASE=https://my-backend.example yarn dev
```

Endpoints consumed (see [src/api/client.ts](src/api/client.ts)):

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/boards` | list boards on the landing screen |
| `POST` | `/boards` | create a new board |
| `GET` | `/boards/{id}` | load a board when opening it |
| `PUT` | `/boards/{id}` | persist edits (debounced autosave) |
| `GET` | `/boards/{id}/scenario` | compile the board for the scenario screen |
| `POST` | `/boards/{id}/generate` | SSE stream for story generation |
| `POST` | `/boards/{id}/persona` | SSE stream for Mira's replies |

SSE framing is `data: {json}\n\n`; `streamGeneration` / `streamPersona` yield typed `StreamEvent`s (`token`, `tool_start`, `tool_end`, `chapter_start`, `chapter_end`, `board_updated`, `done`).

## Autosave

[src/App.tsx](src/App.tsx) owns the autosave loop:

1. Every board mutation flips the save state to `pending` and arms a 500 ms debounce timer.
2. On fire, the latest board is `PUT` to the backend; in-flight saves are tracked so a newer edit queues behind the current save rather than racing it.
3. Switching screens flushes the timer and awaits any in-flight save before navigating.

The status pill in the header surfaces `pending` / `saving` / `saved` / `error`.

## Scripts

```bash
yarn dev       # start the dev server (port 5173)
yarn build     # type-check with tsc -b, then produce a production bundle in dist/
yarn preview   # serve the built bundle
yarn lint      # ESLint over the project
```

## Dev loop

1. Start the backend (see the [root README](../README.md)).
2. `yarn install` once, then `yarn dev`.
3. Open <http://localhost:5173>.

If the landing screen shows `Backend error: … Is the backend running on port 8000?`, the client couldn't reach the API — check `VITE_API_BASE` and that the backend's `SW_CORS_ORIGINS` includes the dev origin.
