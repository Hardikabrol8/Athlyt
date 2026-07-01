"""Application factory.

Database schema management strategy (updated for Alembic):
- PRODUCTION / STAGING: Alembic is the sole source of truth for the schema.
  `alembic upgrade head` must be run as a pre-deploy step before starting the
  server. The application itself never calls `create_all()` in production.
- LOCAL DEVELOPMENT (SQLite): `create_all()` still runs at startup for
  convenience, so developers can `uvicorn app.main:app --reload` without
  running a migration command first. This is controlled by ENVIRONMENT=local.
- TESTS: `conftest.py` calls `create_all()` directly against an in-memory
  SQLite database — tests must never depend on Alembic, which would require
  a real database connection.

The environment variable `ENVIRONMENT` (local | production) controls this.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401 — side-effect: registers every model on Base.metadata
from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exception_handlers import register_exception_handlers
from app.db.base import Base
from app.db.seed_exercises import seed_exercises
from app.db.session import SessionLocal, engine


def _run_local_dev_schema() -> None:
    """In local development only, create any missing tables via create_all().

    This is a convenience shortcut so `uvicorn app.main:app --reload` works
    without running `alembic upgrade head` first. It is NEVER called in
    production (ENVIRONMENT=production) — Alembic handles production schema.

    create_all() is idempotent: it skips tables that already exist and never
    modifies existing columns, so it is safe to call on every restart.
    """
    Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings = get_settings()

    if settings.ENVIRONMENT in ("local", "test"):
        # Convenience: create any missing tables for local SQLite and test environments.
        # Production deployments run `alembic upgrade head` before starting the server.
        _run_local_dev_schema()

    with SessionLocal() as db:
        seed_exercises(db)

    yield


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_app()
