"""Shared, typed FastAPI dependencies. Routers depend on `DbSession` rather than
writing `Depends(get_db)` inline everywhere.

`get_current_user` is intentionally absent until Feature 1 — there's no concept
of an authenticated user yet.
"""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db

DbSession = Annotated[Session, Depends(get_db)]
