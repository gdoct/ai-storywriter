import httpx
from langchain_openai import ChatOpenAI

from .config import settings

_resolved_model: str | None = None


def _resolve_model() -> str:
    global _resolved_model
    if _resolved_model:
        return _resolved_model
    if settings.llm_model:
        _resolved_model = settings.llm_model
        return _resolved_model
    try:
        r = httpx.get(
            f"{settings.llm_base_url.rstrip('/')}/models",
            headers={"Authorization": f"Bearer {settings.llm_api_key}"},
            timeout=5.0,
        )
        r.raise_for_status()
        ids = [m["id"] for m in r.json().get("data", [])]
        chat = [m for m in ids if "embed" not in m.lower()]
        if chat:
            _resolved_model = chat[0]
            return _resolved_model
    except Exception:
        pass
    _resolved_model = "local-model"
    return _resolved_model


def writer_llm(*, temperature: float = 0.85, streaming: bool = True) -> ChatOpenAI:
    return ChatOpenAI(
        base_url=settings.llm_base_url,
        api_key=settings.llm_api_key,
        model=_resolve_model(),
        streaming=streaming,
        temperature=temperature,
        timeout=settings.llm_request_timeout,
    )


def current_model() -> str:
    return _resolve_model()
