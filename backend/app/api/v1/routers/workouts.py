"""`/workouts/recommend` — the workout recommendation engine.

Deliberately the only route here: this milestone is scoped to "which split
fits this user," not workout-plan generation (a later milestone). Nothing in
this router touches the database directly or persists a result — it reads
the already-loaded `current_user.profile` and returns a computed response.
"""

from fastapi import APIRouter

from app.api.deps import CurrentUser
from app.schemas.recommendation import RecommendationResponse, WorkoutRecommendationRequest
from app.services.workout_recommendation_service import WorkoutRecommendationService

router = APIRouter(prefix="/workouts", tags=["workouts"])

# A single shared instance: `WorkoutRecommendationService` holds no
# request-specific or mutable state (the rule engine it wraps is stateless
# too), so constructing one per request would be pure overhead for no
# benefit — same reasoning as a router module having one `APIRouter`.
_recommendation_service = WorkoutRecommendationService()


@router.post("/recommend", response_model=RecommendationResponse)
def recommend_workout_split(
    data: WorkoutRecommendationRequest, current_user: CurrentUser
) -> RecommendationResponse:
    """Recommend a workout split for the current user. Raises (via
    `WorkoutRecommendationService`) a 422 if onboarding is incomplete —
    handled by the same global exception handler as every other endpoint, so
    no internal details leak into the error response.
    """
    return _recommendation_service.recommend(current_user.profile, data.workout_days_per_week)
