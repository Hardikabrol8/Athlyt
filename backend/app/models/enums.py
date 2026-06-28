"""Enums shared by `app.models` (as SQLAlchemy column types) and `app.schemas`
(as Pydantic field types) — defined once here so the two never drift out of
sync with each other.
"""

from enum import Enum


class Gender(str, Enum):
    male = "male"
    female = "female"
    other = "other"


class FitnessGoal(str, Enum):
    weight_loss = "weight_loss"
    muscle_gain = "muscle_gain"
    maintenance = "maintenance"
    general_fitness = "general_fitness"


class ActivityLevel(str, Enum):
    """Standard activity-level bands used for TDEE estimation — see
    `app/services/metrics_service.py` for the multiplier each one maps to."""

    sedentary = "sedentary"
    lightly_active = "lightly_active"
    moderately_active = "moderately_active"
    very_active = "very_active"
    extra_active = "extra_active"


class WorkoutExperience(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class DietPreference(str, Enum):
    vegetarian = "vegetarian"
    non_vegetarian = "non_vegetarian"
    vegan = "vegan"


class Equipment(str, Enum):
    none = "none"
    dumbbells = "dumbbells"
    barbell = "barbell"
    resistance_bands = "resistance_bands"
    pull_up_bar = "pull_up_bar"
    full_gym = "full_gym"
