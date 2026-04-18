from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="SW_", extra="ignore")

    llm_base_url: str = "http://192.168.32.1:1234/v1"
    llm_api_key: str = "lm-studio"
    llm_model: str = ""  # empty = auto-detect via /v1/models (first non-embedding)
    llm_request_timeout: float = 60.0

    data_dir: Path = Path(__file__).resolve().parent.parent / "data"

    cors_origins: list[str] = ["http://localhost:5173"]

    @property
    def files_dir(self) -> Path:
        return self.data_dir / "files"

    @property
    def memory_dir(self) -> Path:
        return self.data_dir / "memory"

    @property
    def config_dir(self) -> Path:
        return self.data_dir / "config"


settings = Settings()

for d in (settings.files_dir, settings.memory_dir, settings.config_dir):
    d.mkdir(parents=True, exist_ok=True)
