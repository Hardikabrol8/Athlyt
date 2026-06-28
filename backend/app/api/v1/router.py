"""Aggregates every router for API version 1. Adding a new resource means
adding one `include_router` call here — `main.py` itself never changes."""

from fastapi import APIRouter

from app.api.v1.routers import auth, health, users

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
