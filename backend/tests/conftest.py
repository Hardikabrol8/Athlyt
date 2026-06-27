"""Shared test fixtures.

Sets test environment variables before any `app.*` module is imported, since
`Settings` validates `JWT_SECRET_KEY` the moment it's instantiated. Uses an
in-memory SQLite database for tests, isolated from the real `athlyt.db` file.
"""

import os

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-at-least-32-characters-long")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("ENVIRONMENT", "test")

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import create_app


@pytest.fixture
def app() -> FastAPI:
    get_settings.cache_clear()
    return create_app()


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    with TestClient(app) as test_client:
        yield test_client
