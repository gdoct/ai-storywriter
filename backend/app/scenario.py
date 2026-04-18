import re

from .models import Board, Scenario


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", s.lower()).strip("_") or "x"


def _content(n) -> str:
    parts = [p for p in (getattr(n, "title", None), getattr(n, "body", None)) if p]
    return " — ".join(parts)


def build_scenario(board: Board) -> Scenario:
    characters: list[dict] = []
    for n in board.nodes:
        if n.kind != "character":
            continue
        entry: dict = {
            "id": _slug(n.name or n.id),
            "name": n.name or "Unnamed",
        }
        if n.role:
            entry["role"] = n.role.split("·")[0].strip().lower() if "·" in n.role else n.role
        if n.age is not None:
            entry["age"] = n.age
        if n.tags:
            entry["traits"] = list(n.tags)
        if n.body:
            entry["description"] = n.body
        characters.append(entry)

    world_nodes = [n for n in board.nodes if n.kind == "world"]
    tone_nodes = [n for n in board.nodes if n.kind == "tone"]

    setting_node = world_nodes[0] if world_nodes else None
    rule_nodes = world_nodes[1:]

    world = {
        "setting": _content(setting_node) if setting_node else "",
        "rules": [_content(n) for n in rule_nodes if _content(n)],
        "tone": " ".join(_content(n) for n in tone_nodes if _content(n)),
    }

    beats = sorted([n for n in board.nodes if n.kind == "beat"], key=lambda n: n.x)
    beat_entries: list[dict] = []
    for b in beats:
        entry: dict = {"title": b.title or ""}
        if b.body:
            entry["description"] = b.body
        beat_entries.append(entry)
    plot = {
        "structure": f"{len(beats)}_beats" if beats else "freeform",
        "beats": beat_entries,
    }

    by_id = {n.id: n for n in board.nodes}
    conns: list[list[str]] = []
    for c in board.connections:
        a = by_id.get(c.from_)
        b = by_id.get(c.to)
        if not a or not b:
            continue
        if a.kind == "character" and b.kind == "character":
            conns.append([
                _slug(a.name or a.id),
                _slug(b.name or b.id),
                _slug(c.label or "related"),
            ])

    protagonist = next(
        (c for c in characters if "protagonist" in str(c.get("role", "")).lower()),
        characters[0] if characters else None,
    )
    ready = bool(characters and beats)

    logline = ""
    if board.title and protagonist:
        logline = f"{board.title}: a story about {protagonist['name']}."

    return Scenario(
        title=board.title,
        pov="close_third",
        length_target=40000,
        logline=logline,
        characters=characters,
        world=world,
        plot=plot,
        connections=conns,
        ready=ready,
    )
