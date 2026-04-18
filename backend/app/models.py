from typing import Literal

from pydantic import BaseModel, Field

NodeKind = Literal["character", "world", "tone", "beat"]
PaletteName = Literal["warm", "cool", "rose", "ink"]


class BoardNode(BaseModel):
    id: str
    kind: NodeKind
    x: float
    y: float
    name: str | None = None
    title: str | None = None
    role: str | None = None
    age: str | int | None = None
    body: str | None = None
    tags: list[str] | None = None


class Connection(BaseModel):
    from_: str = Field(alias="from")
    to: str
    label: str | None = None

    model_config = {"populate_by_name": True}


class Board(BaseModel):
    id: str
    title: str
    personaName: str = "Mira"
    palette: PaletteName = "warm"
    nodes: list[BoardNode] = []
    connections: list[Connection] = []
    updatedAt: str | None = None


class BoardSummary(BaseModel):
    id: str
    title: str
    personaName: str
    palette: PaletteName
    nodeCount: int
    connectionCount: int
    updatedAt: str | None = None


class CreateBoardRequest(BaseModel):
    title: str = "Untitled board"


class Scenario(BaseModel):
    title: str
    pov: str
    length_target: int
    logline: str
    characters: list[dict]
    world: dict
    plot: dict
    connections: list[list[str]]
    ready: bool


class PersonaRequest(BaseModel):
    message: str
