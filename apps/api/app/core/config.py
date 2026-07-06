from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="APP_", extra="ignore")

    app_name: str = "Risk Viewer API"
    app_env: str = "development"
    database_url: str = "sqlite:///./data/app/app.db"
    auto_create_tables: bool = True
    session_cookie_name: str = "rv_session"
    session_cookie_secure: bool | None = None
    session_cookie_samesite: str = "lax"
    session_cookie_max_age_seconds: int = Field(default=60 * 60 * 8, ge=60)
    session_cookie_path: str = "/"
    service_slug: str = "risk-viewer-api"

    @property
    def repository_root(self) -> Path:
        return Path(__file__).resolve().parents[4]

    @property
    def resolved_database_url(self) -> str:
        if self.database_url.startswith("sqlite:///") and self.database_url.startswith("sqlite:///./"):
            relative_path = self.database_url.removeprefix("sqlite:///./")
            return f"sqlite:///{(self.repository_root / relative_path).resolve()}"
        return self.database_url

    @property
    def resolved_session_cookie_secure(self) -> bool:
        if self.session_cookie_secure is not None:
            return self.session_cookie_secure
        return self.app_env.lower() not in {"development", "dev", "local"}


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


def reset_settings_cache() -> None:
    get_settings.cache_clear()
