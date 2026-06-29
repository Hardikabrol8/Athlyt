"""`WorkoutRecommendationService` — decides which workout *split* fits a
user, given their profile. Does not persist anything and does not generate
an actual day-by-day plan (that's the Workout Planner, a later milestone) —
this is a single, stateless, read-only decision.
"""

from app.core.exceptions import ValidationError
from app.models.enums import Equipment, FitnessGoal, WorkoutExperience
from app.models.profile import Profile
from app.schemas.recommendation import RecommendationResponse
from app.services.recommendation_engine import RecommendationEngine, RuleBasedRecommendationEngine
from app.services.recommendation_types import RecommendationInput
from app.services.workout_splits import WorkoutSplitDefinition

_GOAL_LABELS: dict[FitnessGoal, str] = {
    FitnessGoal.weight_loss: "Weight Loss",
    FitnessGoal.muscle_gain: "Muscle Gain",
    FitnessGoal.maintenance: "Maintenance",
    FitnessGoal.general_fitness: "General Fitness",
}

_EXPERIENCE_LABELS: dict[WorkoutExperience, str] = {
    WorkoutExperience.beginner: "Beginner",
    WorkoutExperience.intermediate: "Intermediate",
    WorkoutExperience.advanced: "Advanced",
}

# Splits whose title is about the *training style* rather than the user's
# stated goal — overrides the goal-based title for exactly these two, since
# "Strength Plan" / "Home Workout Plan" communicates more than e.g. "Muscle
# Gain Plan" would for someone who got routed to a bodyweight-only program.
_SPLIT_TITLE_OVERRIDES: dict[str, str] = {
    "upper_lower_strength": "Strength Plan",
    "home_bodyweight": "Home Workout Plan",
}


def _validate_profile_for_recommendation(profile: Profile | None) -> None:
    """Raises `ValidationError` (422) if onboarding is incomplete.

    In practice, Milestone 1's `update_profile` already guarantees a
    `Profile` row can't exist with any of these fields unset — they're all
    `NOT NULL` columns, enforced at creation. The explicit per-field checks
    below are deliberately written anyway rather than just checking `profile
    is None`: they say exactly what's required in the error message, and
    they keep this function correct even if that upstream invariant ever
    changes, rather than silently relying on it.
    """
    if profile is None:
        raise ValidationError("Complete your profile before requesting a workout recommendation.")

    missing = [
        label
        for label, value in (
            ("fitness goal", profile.fitness_goal),
            ("workout experience", profile.workout_experience),
            ("equipment available", profile.equipment_available),
        )
        if not value
    ]
    if missing:
        raise ValidationError(
            f"Your profile is missing: {', '.join(missing)}. Please complete onboarding."
        )


def _describe_equipment(equipment: list[Equipment]) -> str:
    if Equipment.full_gym in equipment:
        return "Gym equipment"
    real_equipment = [item for item in equipment if item != Equipment.none]
    if not real_equipment:
        return "No equipment"
    labels = [item.value.replace("_", " ") for item in real_equipment]
    return " and ".join(labels).capitalize()


def _derive_title(fitness_goal: FitnessGoal, split_key: str) -> str:
    if split_key in _SPLIT_TITLE_OVERRIDES:
        return _SPLIT_TITLE_OVERRIDES[split_key]
    return f"{_GOAL_LABELS.get(fitness_goal, 'Fitness')} Plan"


def _build_reason(recommendation_input: RecommendationInput) -> str:
    goal_label = _GOAL_LABELS.get(
        recommendation_input.fitness_goal, recommendation_input.fitness_goal.value
    )
    experience_label = _EXPERIENCE_LABELS.get(
        recommendation_input.workout_experience, recommendation_input.workout_experience.value
    )
    equipment_label = _describe_equipment(recommendation_input.equipment_available)
    return (
        f"Recommended because the user selected {goal_label}, {experience_label} experience, "
        f"{equipment_label} and {recommendation_input.workout_days_per_week} workout days."
    )


def _build_response(
    recommendation_input: RecommendationInput, split: WorkoutSplitDefinition
) -> RecommendationResponse:
    return RecommendationResponse(
        title=_derive_title(recommendation_input.fitness_goal, split.key),
        split_name=split.split_name,
        workout_days=recommendation_input.workout_days_per_week,
        difficulty=split.difficulty.value.capitalize(),
        reason=_build_reason(recommendation_input),
    )


class WorkoutRecommendationService:
    """Depends on `RecommendationEngine` (a `Protocol`), not on the
    rule-based engine concretely — swap in an ML-backed engine later by
    passing a different object into the constructor; nothing else here
    would need to change.
    """

    def __init__(self, engine: RecommendationEngine | None = None) -> None:
        self._engine = engine or RuleBasedRecommendationEngine()

    def recommend(
        self, profile: Profile | None, workout_days_per_week: int
    ) -> RecommendationResponse:
        _validate_profile_for_recommendation(profile)
        assert profile is not None  # narrowed by the validation call above

        recommendation_input = RecommendationInput(
            fitness_goal=profile.fitness_goal,
            workout_experience=profile.workout_experience,
            activity_level=profile.activity_level,
            # `Profile.equipment_available` is a JSON column (a plain list of
            # strings once loaded from the DB), not a list of `Equipment`
            # enum members — unlike the dedicated `Enum` columns
            # (`fitness_goal`, etc.), which SQLAlchemy deserializes back into
            # real enum members automatically. Converted explicitly here so
            # every rule can compare against `Equipment` members directly.
            equipment_available=[Equipment(item) for item in profile.equipment_available],
            workout_days_per_week=workout_days_per_week,
            age=profile.age,
            gender=profile.gender,
        )

        split = self._engine.recommend(recommendation_input)
        return _build_response(recommendation_input, split)
