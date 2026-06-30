"""SQLAlchemy ORM models.

Importing this package imports every model module below, which is what
registers each table on `Base.metadata` — required for `Base.metadata.create_all()`
in `app/main.py` to know about them. `main.py` imports this package for exactly
that side effect.
"""

from app.models.exercise import Exercise
from app.models.exercise_completion import ExerciseCompletion
from app.models.profile import Profile
from app.models.user import User
from app.models.workout_day import WorkoutDay
from app.models.workout_exercise import WorkoutExercise
from app.models.workout_plan import WorkoutPlan
from app.models.workout_session import WorkoutSession

__all__ = [
    "Exercise",
    "ExerciseCompletion",
    "Profile",
    "User",
    "WorkoutDay",
    "WorkoutExercise",
    "WorkoutPlan",
    "WorkoutSession",
]
