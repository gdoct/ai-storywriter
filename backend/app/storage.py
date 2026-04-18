import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from .config import settings
from .models import Board, BoardSummary

BOARDS_DIR = settings.data_dir / "boards"
BOARDS_DIR.mkdir(parents=True, exist_ok=True)


def _path(board_id: str) -> Path:
    return BOARDS_DIR / f"{board_id}.json"


def list_boards() -> list[BoardSummary]:
    out: list[BoardSummary] = []
    for p in sorted(BOARDS_DIR.glob("*.json")):
        try:
            b = Board.model_validate_json(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        out.append(
            BoardSummary(
                id=b.id,
                title=b.title,
                personaName=b.personaName,
                palette=b.palette,
                nodeCount=len(b.nodes),
                connectionCount=len(b.connections),
                updatedAt=b.updatedAt,
            )
        )
    return out


def get_board(board_id: str) -> Board | None:
    p = _path(board_id)
    if not p.exists():
        return None
    return Board.model_validate_json(p.read_text(encoding="utf-8"))


def save_board(board: Board) -> Board:
    board.updatedAt = datetime.now(timezone.utc).isoformat()
    _path(board.id).write_text(
        board.model_dump_json(by_alias=True, indent=2),
        encoding="utf-8",
    )
    return board


def create_board(title: str) -> Board:
    board = Board(id=uuid.uuid4().hex[:10], title=title)
    return save_board(board)


def seed_sample_board_if_empty() -> None:
    if any(BOARDS_DIR.glob("*.json")):
        return
    sample_path = Path(__file__).resolve().parent / "sample_board.json"
    if sample_path.exists():
        data = json.loads(sample_path.read_text(encoding="utf-8"))
        save_board(Board.model_validate(data))
