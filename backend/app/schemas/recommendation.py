"""Schemas for `POST /workouts/recommend`.

Note on `workout_days_per_week`: the spec describes this as a profile field,
but `Profile` (Milestone 1) has no such column, and this milestone is
explicit that existing models must not be modified. Rather than add a column
to an existing, already-deployed table (risky without a migration system —
see `app/main.py`'s `create_all()`-based setup), it's accepted as a request
parameter instead. Every *other* input the spec calls for (goal, experience,
activity level, equipment, age, gender) really does come from the stored
profile, per `WorkoutRecommendationService`.
"""

from pydantic import BaseModel, Field


class WorkoutRecommendationRequest(BaseModel):
    workout_days_per_week: int = Field(
        ge=1, le=7, description="How many days per week the user wants to train."
    )


class RecommendationResponse(BaseModel):
    title: str
    split_name: str
    workout_days: int
    difficulty: str
    reason: str
