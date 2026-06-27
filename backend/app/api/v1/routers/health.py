"""Health check endpoint — confirms the API is running and the database is
reachable. Used to sanity-check local setup and, later, deployment."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.config import get_settings
from app.db.session import check_database_connection

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check(database_healthy: Annotated[bool, Depends(check_database_connection)]) -> dict:
    settings = get_settings()
    return {
        "status": "ok" if database_healthy else "degraded",
        "version": settings.APP_VERSION,
        "database": "healthy" if database_healthy else "unhealthy",
    }
