from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from . import storage
from .config import settings
from .generation import stream_persona, stream_story
from .llm import current_model
from .models import Board, BoardSummary, CreateBoardRequest, PersonaRequest, Scenario
from .scenario import build_scenario

app = FastAPI(title="Storywriter Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _seed() -> None:
    storage.seed_sample_board_if_empty()


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "model": current_model(), "llm_base_url": settings.llm_base_url}


@app.get("/boards", response_model=list[BoardSummary])
def list_boards() -> list[BoardSummary]:
    return storage.list_boards()


@app.post("/boards", response_model=Board)
def create_board(req: CreateBoardRequest) -> Board:
    return storage.create_board(req.title)


@app.get("/boards/{board_id}", response_model=Board)
def get_board(board_id: str) -> Board:
    board = storage.get_board(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board


@app.put("/boards/{board_id}", response_model=Board)
def put_board(board_id: str, board: Board) -> Board:
    if board.id != board_id:
        raise HTTPException(status_code=400, detail="Board id mismatch")
    return storage.save_board(board)


@app.get("/boards/{board_id}/scenario", response_model=Scenario)
def get_scenario(board_id: str) -> Scenario:
    board = storage.get_board(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return build_scenario(board)


@app.post("/boards/{board_id}/generate")
async def generate(board_id: str) -> StreamingResponse:
    board = storage.get_board(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return StreamingResponse(stream_story(board), media_type="text/event-stream")


@app.post("/boards/{board_id}/persona")
async def persona(board_id: str, req: PersonaRequest) -> StreamingResponse:
    board = storage.get_board(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return StreamingResponse(stream_persona(board, req.message), media_type="text/event-stream")
