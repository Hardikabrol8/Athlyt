"""Shared, typed FastAPI dependencies. Routers depend on `DbSession`/`CurrentUser`
rather than writing `Depends(...)` inline everywhere.
"""

from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import UnauthorizedError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.repositories import user_repository

DbSession = Annotated[Session, Depends(get_db)]

# `auto_error=False` is deliberate: FastAPI's HTTPBearer otherwise raises a
# 403 when no credentials are supplied, which is the wrong status code for
# "you're not logged in" — `get_current_user` below raises our own
# `UnauthorizedError` (401) for that case instead, so missing and invalid
# tokens both produce the same, correct status code.
_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
    db: DbSession,
) -> User:
    if credentials is None:
        raise UnauthorizedError("Not authenticated.")

    user_id = decode_access_token(credentials.credentials)
    user = user_repository.get_by_id(db, user_id)
    if user is None:
        raise UnauthorizedError("User not found.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
