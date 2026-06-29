"""The recommendation engine.

`RecommendationEngine` is the seam this whole milestone is built around:
`WorkoutRecommendationService` depends on this protocol, not on
`RuleBasedRecommendationEngine` directly. Swapping in an ML-backed engine
later means writing one class with a `recommend(RecommendationInput) ->
WorkoutSplitDefinition` method and passing it to the service's constructor —
no router, schema, or service code changes.
"""

from typing import Protocol

from app.services.recommendation_rules import RULE_PIPELINE
from app.services.recommendation_types import RecommendationInput, ScoredSplit
from app.services.workout_splits import SPLIT_BY_KEY, WORKOUT_SPLITS, WorkoutSplitDefinition

# Guaranteed eligible regardless of input (see its definition in
# `workout_splits.py`) — the engine's fallback if, somehow, every other
# split ends up disqualified.
_FALLBACK_SPLIT_KEY = "home_bodyweight"


class RecommendationEngine(Protocol):
    """The interface `WorkoutRecommendationService` depends on. Any object
    with this method works — rule-based today, potentially ML-backed later."""

    def recommend(self, recommendation_input: RecommendationInput) -> WorkoutSplitDefinition: ...


def select_best_split(candidates: list[ScoredSplit]) -> WorkoutSplitDefinition:
    """Picks the highest-scoring eligible candidate. Ties go to whichever
    split appears first in `WORKOUT_SPLITS` (Python's `max` keeps the first
    maximum it sees) — deterministic, and in practice resolves to whichever
    split was defined as the more common/classic choice for that situation.
    """
    eligible = [candidate for candidate in candidates if candidate.eligible]
    if not eligible:
        return SPLIT_BY_KEY[_FALLBACK_SPLIT_KEY]
    return max(eligible, key=lambda candidate: candidate.score).definition


class RuleBasedRecommendationEngine:
    """Implements `RecommendationEngine` by running every candidate split
    through the rule pipeline in `recommendation_rules.RULE_PIPELINE`, then
    picking the winner. No machine learning — see the module docstring for
    why that's a deliberate, swappable boundary rather than an oversight.
    """

    def recommend(self, recommendation_input: RecommendationInput) -> WorkoutSplitDefinition:
        candidates = [ScoredSplit(definition=definition) for definition in WORKOUT_SPLITS]

        for rule in RULE_PIPELINE:
            candidates = rule(recommendation_input, candidates)

        return select_best_split(candidates)
