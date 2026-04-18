"""Tools that let the persona agent edit a board in place."""
from __future__ import annotations

import random
import string
from typing import Callable

from langchain_core.tools import StructuredTool

from .models import Board, BoardNode, Connection

LANE_Y = {"character": 120, "world": 420, "tone": 440, "beat": 720}
LANE_STEP_X = 240
LANE_START_X = 220


def _new_id() -> str:
    return "n" + "".join(random.choices(string.ascii_lowercase + string.digits, k=8))


def _place(board: Board, kind: str) -> tuple[float, float]:
    same = [n for n in board.nodes if n.kind == kind]
    if not same:
        return (LANE_START_X, LANE_Y[kind])
    rightmost = max(n.x for n in same)
    return (rightmost + LANE_STEP_X, LANE_Y[kind])


def build_board_tools(
    board: Board,
    persist: Callable[[Board], None],
) -> list[StructuredTool]:
    """Return tools that mutate `board` and call `persist` after each change.

    The returned tools close over `board`, so mutations accumulate across calls
    within a single persona turn.
    """

    def _save() -> None:
        persist(board)

    def add_character(
        name: str,
        role: str = "",
        body: str = "",
        age: str = "",
        tags: list[str] | None = None,
    ) -> str:
        """Add a character card to the board.

        role: a short descriptor like 'protagonist · lighthouse keeper'.
        body: one or two sentences about who they are.
        tags: 2-4 single-word traits (optional).
        Returns the new node id.
        """
        x, y = _place(board, "character")
        node = BoardNode(
            id=_new_id(), kind="character", x=x, y=y,
            name=name, role=role or None, body=body or None,
            age=age or None, tags=list(tags) if tags else None,
        )
        board.nodes.append(node)
        _save()
        return f"Added character {node.id} — {name}"

    def add_setting(title: str, body: str = "") -> str:
        """Add a world/setting card (time, place, circumstances)."""
        x, y = _place(board, "world")
        node = BoardNode(id=_new_id(), kind="world", x=x, y=y, title=title, body=body or None)
        board.nodes.append(node)
        _save()
        return f"Added setting {node.id} — {title}"

    def add_tone(title: str, body: str = "") -> str:
        """Add a tone card describing voice, mood, or pacing."""
        x, y = _place(board, "tone")
        node = BoardNode(id=_new_id(), kind="tone", x=x, y=y, title=title, body=body or None)
        board.nodes.append(node)
        _save()
        return f"Added tone {node.id} — {title}"

    def add_beat(title: str, body: str = "") -> str:
        """Add a plot beat. Beats appear left-to-right in the bottom lane."""
        x, y = _place(board, "beat")
        node = BoardNode(id=_new_id(), kind="beat", x=x, y=y, title=title, body=body or None)
        board.nodes.append(node)
        _save()
        return f"Added beat {node.id} — {title}"

    def update_node(
        node_id: str,
        name: str | None = None,
        title: str | None = None,
        role: str | None = None,
        body: str | None = None,
        age: str | None = None,
        tags: list[str] | None = None,
    ) -> str:
        """Update fields of an existing node. Only provided fields change.

        Pass an empty string to clear a field.
        """
        for i, n in enumerate(board.nodes):
            if n.id != node_id:
                continue
            data = n.model_dump()
            if name is not None: data["name"] = name or None
            if title is not None: data["title"] = title or None
            if role is not None: data["role"] = role or None
            if body is not None: data["body"] = body or None
            if age is not None: data["age"] = age or None
            if tags is not None: data["tags"] = list(tags) if tags else None
            board.nodes[i] = BoardNode(**data)
            _save()
            return f"Updated {node_id}"
        return f"No node with id {node_id}"

    def delete_node(node_id: str) -> str:
        """Delete a node and any connections touching it."""
        before = len(board.nodes)
        board.nodes = [n for n in board.nodes if n.id != node_id]
        if len(board.nodes) == before:
            return f"No node with id {node_id}"
        board.connections = [
            c for c in board.connections if c.from_ != node_id and c.to != node_id
        ]
        _save()
        return f"Deleted {node_id}"

    def add_connection(from_id: str, to_id: str, label: str = "") -> str:
        """Link two nodes. Labels like 'estranged sibling' help readers."""
        ids = {n.id for n in board.nodes}
        if from_id not in ids or to_id not in ids:
            return f"Unknown node id ({from_id!r} or {to_id!r})"
        for c in board.connections:
            if {c.from_, c.to} == {from_id, to_id}:
                return "Connection already exists"
        board.connections.append(Connection(**{"from": from_id, "to": to_id, "label": label or None}))
        _save()
        return f"Linked {from_id} ↔ {to_id}"

    def remove_connection(from_id: str, to_id: str) -> str:
        """Remove the connection between two nodes (order-independent)."""
        before = len(board.connections)
        board.connections = [
            c for c in board.connections if {c.from_, c.to} != {from_id, to_id}
        ]
        if len(board.connections) == before:
            return "No such connection"
        _save()
        return f"Unlinked {from_id} ↔ {to_id}"

    funcs = [
        add_character, add_setting, add_tone, add_beat,
        update_node, delete_node,
        add_connection, remove_connection,
    ]
    return [StructuredTool.from_function(f) for f in funcs]
