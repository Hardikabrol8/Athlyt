"""Global exception handlers.

Design decision: errors return `{"detail": "<message>"}` — the same shape
FastAPI's own `HTTPException` already uses — rather than a custom nested
envelope (`{"error": {"code": ..., "message": ...}}`). For a small frontend
that controls both ends of the API, the extra structure isn't pulling its
weight yet; this is the simplest thing that works, and it's a five-minute
change later if the API grows enough consumers to need machine-readable error
codes.
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.exceptions import AppException


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle every expected, typed domain exception (see `app/core/exceptions.py`)."""
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all for anything unexpected — i.e. a bug. Never leaks internals
    (stack traces, file paths) into the response; FastAPI/uvicorn still log the
    real traceback to the console."""
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."},
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppException, app_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, unhandled_exception_handler)
