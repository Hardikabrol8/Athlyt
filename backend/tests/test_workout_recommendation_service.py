"""Unit tests for `WorkoutRecommendationService`.

Covers the four scenarios the spec names explicitly (muscle gain, weight
loss, strength, home workout), plus the two error scenarios (invalid
profile, missing onboarding). No database involved — `Profile` instances are
constructed directly in memory, since the service never touches a session.
"""

import pytest

from app.core.exceptions import ValidationError
from app.models.enums import (
    ActivityLevel,
    DietPreference,
    FitnessGoal,
    Gender,
    WorkoutExperience,
)
from app.models.profile import Profile
from app.services.workout_recommendation_service import WorkoutRecommendationService
from app.services.workout_splits import SPLIT_BY_KEY


def _make_profile(**overrides: object) -> Profile:
    defaults: dict[str, object] = dict(
        name="Test User",
        age=28,
        gender=Gender.male,
        height_cm=178,
        weight_kg=75,
        fitness_goal=FitnessGoal.muscle_gain,
        activity_level=ActivityLevel.moderately_active,
        workout_experience=WorkoutExperience.intermediate,
        equipment_available=["full_gym"],
        diet_preference=DietPreference.non_vegetarian,
    )
    defaults.update(overrides)
    return Profile(**defaults)  # type: ignore[arg-type]


@pytest.fixture
def service() -> WorkoutRecommendationService:
    return WorkoutRecommendationService()


def test_muscle_gain_recommends_push_pull_legs(service: WorkoutRecommendationService) -> None:
    profile = _make_profile(
        fitness_goal=FitnessGoal.muscle_gain,
        workout_experience=WorkoutExperience.intermediate,
        equipment_available=["full_gym"],
    )

    result = service.recommend(profile, workout_days_per_week=5)

    assert result.split_name == "Push Pull Legs"
    assert result.title == "Muscle Gain Plan"
    assert result.workout_days == 5
    assert result.difficulty == "Intermediate"
    assert result.reason == (
        "Recommended because the user selected Muscle Gain, Intermediate experience, "
        "Gym equipment and 5 workout days."
    )


def test_weight_loss_recommends_full_body(service: WorkoutRecommendationService) -> None:
    profile = _make_profile(
        fitness_goal=FitnessGoal.weight_loss,
        workout_experience=WorkoutExperience.beginner,
        equipment_available=["dumbbells"],
    )

    result = service.recommend(profile, workout_days_per_week=3)

    assert result.split_name == "Full Body"
    assert result.title == "Weight Loss Plan"
    assert result.difficulty == "Beginner"


def test_strength_recommends_upper_lower_strength(service: WorkoutRecommendationService) -> None:
    profile = _make_profile(
        fitness_goal=FitnessGoal.muscle_gain,
        workout_experience=WorkoutExperience.advanced,
        equipment_available=["barbell"],
    )

    result = service.recommend(profile, workout_days_per_week=4)

    assert result.split_name == "Upper Lower Strength"
    assert result.title == "Strength Plan"
    assert result.difficulty == "Advanced"


def test_home_workout_recommends_home_bodyweight_split(
    service: WorkoutRecommendationService,
) -> None:
    profile = _make_profile(
        fitness_goal=FitnessGoal.general_fitness,
        workout_experience=WorkoutExperience.beginner,
        equipment_available=["none"],
    )

    result = service.recommend(profile, workout_days_per_week=3)

    assert result.split_name == "Home Bodyweight Split"
    assert result.title == "Home Workout Plan"
    assert "No equipment" in result.reason


def test_missing_onboarding_raises_validation_error(
    service: WorkoutRecommendationService,
) -> None:
    """profile=None — a registered user who hasn't completed onboarding."""
    with pytest.raises(ValidationError):
        service.recommend(None, workout_days_per_week=4)


def test_invalid_profile_with_no_equipment_selected_raises_validation_error(
    service: WorkoutRecommendationService,
) -> None:
    """A profile with an empty equipment list — not producible through the
    real onboarding flow (Milestone 1 requires at least one item), but
    `_validate_profile_for_recommendation` defends against it directly
    rather than assuming that upstream invariant always holds."""
    profile = _make_profile(equipment_available=[])

    with pytest.raises(ValidationError):
        service.recommend(profile, workout_days_per_week=4)


def test_recommendation_response_has_exactly_the_spec_shape(
    service: WorkoutRecommendationService,
) -> None:
    profile = _make_profile()
    result = service.recommend(profile, workout_days_per_week=5)
    assert set(result.model_dump().keys()) == {
        "title",
        "split_name",
        "workout_days",
        "difficulty",
        "reason",
    }


def test_a_substituted_engine_changes_the_outcome(service: WorkoutRecommendationService) -> None:
    """Proves the ML-swap seam actually works: a fake engine implementing
    the same `recommend(...)` shape changes the result, with no other code
    needing to change."""

    class _AlwaysBroSplitEngine:
        def recommend(self, recommendation_input: object) -> object:
            return SPLIT_BY_KEY["bro_split"]

    custom_service = WorkoutRecommendationService(engine=_AlwaysBroSplitEngine())  # type: ignore[arg-type]
    profile = _make_profile(
        fitness_goal=FitnessGoal.weight_loss,
        workout_experience=WorkoutExperience.beginner,
        equipment_available=["none"],
    )

    result = custom_service.recommend(profile, workout_days_per_week=3)

    assert result.split_name == "Bro Split"


def test_bro_split_is_genuinely_reachable_for_advanced_users_at_5_days(
    service: WorkoutRecommendationService,
) -> None:
    """Regression test for a real bug found while building the ML training
    dataset (see ml/ML_TRAINING.md §2.4): `bro_split` could never be
    recommended under ANY input, because push_pull_legs scored equal-or-
    higher on every dimension the rule engine evaluated, and ties always
    resolved to push_pull_legs (defined first in WORKOUT_SPLITS). Fixed in
    recommendation_rules.py by raising bro_split's advanced-experience score
    from 10 to 12 — this test locks in that bro_split is now reachable at
    its classic real-world niche (advanced lifter, 5 days/week, full gym),
    across every fitness goal, so this can't silently regress back to
    unreachable."""
    for goal in (
        FitnessGoal.muscle_gain,
        FitnessGoal.weight_loss,
        FitnessGoal.maintenance,
        FitnessGoal.general_fitness,
    ):
        profile = _make_profile(
            fitness_goal=goal,
            workout_experience=WorkoutExperience.advanced,
            equipment_available=["full_gym"],
        )
        result = service.recommend(profile, workout_days_per_week=5)
        assert result.split_name == "Bro Split", f"Expected Bro Split for goal={goal}"


def test_push_pull_legs_still_wins_at_6_days_even_for_advanced_users(
    service: WorkoutRecommendationService,
) -> None:
    """The bro_split fix (above) must not flip the correct outcome at 6
    days, where cycling a 3-day push/pull/legs rotation twice is the more
    natural fit than a single-muscle-per-day bodybuilding split."""
    profile = _make_profile(
        fitness_goal=FitnessGoal.muscle_gain,
        workout_experience=WorkoutExperience.advanced,
        equipment_available=["full_gym"],
    )
    result = service.recommend(profile, workout_days_per_week=6)
    assert result.split_name == "Push Pull Legs"


def test_bro_split_still_loses_to_push_pull_legs_for_intermediate_users(
    service: WorkoutRecommendationService,
) -> None:
    """The fix only raised bro_split's *advanced*-experience score —
    intermediate users should be completely unaffected."""
    profile = _make_profile(
        fitness_goal=FitnessGoal.muscle_gain,
        workout_experience=WorkoutExperience.intermediate,
        equipment_available=["full_gym"],
    )
    result = service.recommend(profile, workout_days_per_week=5)
    assert result.split_name == "Push Pull Legs"
