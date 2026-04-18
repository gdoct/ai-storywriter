from pathlib import Path

from langchain_core.tools import tool

from .config import settings


def _safe_join(base: Path, name: str) -> Path:
    candidate = (base / name).resolve()
    if base.resolve() not in candidate.parents and candidate != base.resolve():
        raise ValueError(f"Path {name!r} escapes {base}")
    return candidate


@tool
def read_file(name: str) -> str:
    """Read a text file from the configured files directory."""
    path = _safe_join(settings.files_dir, name)
    if not path.exists():
        return f"File not found: {name}"
    return path.read_text(encoding="utf-8")


@tool
def write_file(name: str, content: str) -> str:
    """Write content to a text file in the configured files directory."""
    path = _safe_join(settings.files_dir, name)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return f"Wrote {len(content)} chars to {name}"


@tool
def list_files() -> list[str]:
    """List all files in the configured files directory."""
    base = settings.files_dir
    return sorted(str(p.relative_to(base)) for p in base.rglob("*") if p.is_file())


@tool
def memory_store(key: str, value: str) -> str:
    """Store a memory entry under a key."""
    path = _safe_join(settings.memory_dir, f"{key}.txt")
    path.write_text(value, encoding="utf-8")
    return f"Stored memory {key!r}"


@tool
def memory_retrieve(key: str) -> str:
    """Retrieve a memory entry by key."""
    path = _safe_join(settings.memory_dir, f"{key}.txt")
    if not path.exists():
        return f"No memory for {key!r}"
    return path.read_text(encoding="utf-8")


@tool
def memory_list() -> list[str]:
    """List all memory keys."""
    return sorted(p.stem for p in settings.memory_dir.glob("*.txt"))


@tool
def config_read(name: str) -> str:
    """Read a config file by name."""
    path = _safe_join(settings.config_dir, name)
    if not path.exists():
        return f"Config not found: {name}"
    return path.read_text(encoding="utf-8")


@tool
def config_write(name: str, content: str) -> str:
    """Write a config file by name."""
    path = _safe_join(settings.config_dir, name)
    path.write_text(content, encoding="utf-8")
    return f"Wrote config {name}"


ALL_TOOLS = [
    read_file,
    write_file,
    list_files,
    memory_store,
    memory_retrieve,
    memory_list,
    config_read,
    config_write,
]
