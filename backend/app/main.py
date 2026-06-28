"""Application factory.

Design decision: no Alembic. Migrations are real infrastructure with real
value, but for a one-week, single-developer project with one SQLite file,
`Base.metadata.create_all()` on startup does the same job — every model
inherits from the same `Base`, so creating tables is one line, and there's no
production database with existing data yet that a migration would need to
reconcile. This is a deliberate scope cut, not an oversight: the moment this
project moves to Postgres with real user data, Alembic earns its keep and
should be added before that migration, not after.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Imported for its side effect: registers every model on Base.metadata so
# create_all() below actually creates their tables. Unused directly, hence
# the noqa — this is the one place in the app where that's the intent, not
# an oversight.
from app import models  # noqa: F401,E402
from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exception_handlers import register_exception_handlers
from app.db.base import Base
from app.db.seed_exercises import seed_exercises
from app.db.session import SessionLocal, engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Create any tables that don't exist yet, then seed the exercise library
    if it's empty — both safe to run on every startup, not just the first."""
    Base.metadata.create_all(bind=engine)
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
