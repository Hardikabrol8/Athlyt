"""Database engine and session management.

Design decision: synchronous SQLAlchemy, not async. FastAPI runs sync
dependency functions (like `get_db` below) in a threadpool automatically, so
request handling still doesn't block the event loop — we get that benefit
without writing a single `async`/`await` in the data layer. This matters in
practice: it means simpler session handling, no async-flavored Alembic setup
needed later, and one less thing that can go subtly wrong under time pressure.
If the project ever needs the extra concurrency headroom async buys, the
swap is mechanical (the ORM models and query code don't change), but nothing
at this project's scale needs it today.

`check_same_thread=False` is SQLite-specific — it's required because FastAPI's
threadpool means a request can be served on a different thread than the one
that created the connection. It's a no-op on Postgres and can be left in place
or removed when migrating; either is fine.
"""

from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings

settings = get_settings()

_is_sqlite = settings.DATABASE_URL.startswith("sqlite")
_is_in_memory = _is_sqlite and ":memory:" in settings.DATABASE_URL

_connect_args = {"check_same_thread": False} if _is_sqlite else {}
# In-memory SQLite creates a fresh, separate database per connection unless
# every "connection" is forced to share the same one via StaticPool — without
# this, tables created at startup would disappear the moment a different
# request opened a new connection. Irrelevant for the file-based dev database
# or for Postgres, where this branch never triggers.
_pool_kwargs = {"poolclass": StaticPool} if _is_in_memory else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=_connect_args,
    echo=settings.DEBUG,
    **_pool_kwargs,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session scoped to one request,
    always closed at the end of the request — success or failure — via the
    `try`/`finally`."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> bool:
    """Used by the health check endpoint."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception:  # noqa: BLE001 — any failure here means "unhealthy", full stop
        return False
