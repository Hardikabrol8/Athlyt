"""Application configuration.

Design decision: SQLite by default (`sqlite:///./athlyt.db`), via a plain
synchronous `DATABASE_URL` — not async SQLAlchemy with asyncpg. For a one-week
solo project, async SQLAlchemy buys nothing: FastAPI already runs sync
dependency functions in a threadpool, so request handling doesn't block, and
we skip an entire category of async-specific setup (async engine config, async
Alembic environments, async session lifecycle edge cases) that has no payoff at
this scale. Switching to Postgres later is a one-line `DATABASE_URL` change
plus `pip install psycopg2-binary` — see `app/db/session.py` for why the rest
of the data layer doesn't need to change.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict
from typing_extensions import Annotated


class Settings(BaseSettings):
    """Centralised, type-validated app settings, loaded from environment
    variables (and a local `.env` file in development — see `.env.example`)."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- General -----------------------------------------------------------
    APP_NAME: str = "Athlyt API"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: Literal["local", "test", "production"] = "local"
    DEBUG: bool = False

    # --- API -----------------------------------------------------------------
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:3000"]
    )

    # --- Database --------------------------------------------------------------
    # SQLite for local dev; swap to a `postgresql://...` URL for production —
    # the ORM models and queries don't change either way.
    DATABASE_URL: str = "sqlite:///./athlyt.db"

    # --- Auth / JWT --------------------------------------------------------------
    # A single access token, not access+refresh rotation — the right call for a
    # one-week MVP. Refresh-token rotation (revocable sessions, "log out
    # everywhere") is a real feature with real value, but it's additional
    # surface area this scope doesn't need yet; the auth module is small enough
    # to extend with it later without a rewrite if the project grows past the
    # placement-portfolio stage.
    JWT_SECRET_KEY: str = Field(min_length=32)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # --- ML ----------------------------------------------------------------------
    # Where the workout-recommendation model (trained offline in Colab) is
    # loaded from. Defaults to the shared `ml/models/` folder at the repo root
    # so the same exported artifact is the single source of truth for both the
    # training notebook's output and the backend's input.
    ML_MODEL_PATH: str = "../ml/models/workout_recommender.joblib"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — parsed once per process."""
    return Settings()
