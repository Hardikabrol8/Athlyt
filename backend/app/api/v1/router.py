"""Aggregates every router for API version 1. Adding a new resource means
adding one `include_router` call here — `main.py` itself never changes."""

from fastapi import APIRouter

<<<<<<< HEAD
from app.api.v1.routers import auth, exercises, health, users, workouts
=======
from app.api.v1.routers import auth, exercises, health, users
>>>>>>> a0ad283f83336033c2234e024a403827ebdd3a75

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(exercises.router)
<<<<<<< HEAD
api_router.include_router(workouts.router)
=======
>>>>>>> a0ad283f83336033c2234e024a403827ebdd3a75
