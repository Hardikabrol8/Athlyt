"""Types passed through the recommendation rule pipeline.

Kept separate from `workout_recommendation_service.py` so the engine module
(`recommendation_engine.py`, `recommendation_rules.py`) has no dependency on
the service layer or on FastAPI/Pydantic at all — it only knows about plain
dataclasses. That's what makes it trivial to call from a script or a future
ML training pipeline without dragging the web framework along.
"""

from dataclasses import dataclass, field

from app.models.enums import ActivityLevel, Equipment, FitnessGoal, Gender, WorkoutExperience
from app.services.workout_splits import WorkoutSplitDefinition


@dataclass(frozen=True)
class RecommendationInput:
    """Everything a rule might need, gathered once up front.

    `gender` is included for a complete input contract (the spec calls for
    it as an input) even though no current rule uses it — see
    `recommendation_rules.recovery_rule` for why.
    """

    fitness_goal: FitnessGoal
    workout_experience: WorkoutExperience
    activity_level: ActivityLevel
    equipment_available: list[Equipment]
    workout_days_per_week: int
    age: int
    gender: Gender


@dataclass
class ScoredSplit:
    """One candidate split's running score as it passes through the rule
    pipeline. Mutated in place by each rule — simpler than threading
    immutable copies through five functions, and nothing here is shared
    across requests so there's no concurrency concern."""

    definition: WorkoutSplitDefinition
    score: float = 0.0
    eligible: bool = True
    reasons: list[str] = field(default_factory=list)
