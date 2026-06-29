"""Unit tests for `app.services.workout_exercise_service`."""

import uuid

import pytest
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.enums import (
    Difficulty,
    ExerciseEquipment,
    ExerciseType,
    FitnessGoal,
    MuscleGroup,
    WorkoutExperience,
)
from app.schemas.exercise import ExerciseCreate
from app.schemas.workout import (
    WorkoutDayCreate,
    WorkoutExerciseCreate,
    WorkoutExerciseUpdate,
    WorkoutPlanCreate,
)
from app.services import (
    exercise_service,
    workout_day_service,
    workout_exercise_service,
    workout_plan_service,
)


def _make_day(db: Session):
    plan = workout_plan_service.create_plan(
        db,
        str(uuid.uuid4()),
        WorkoutPlanCreate(
            title="Test Plan",
            goal=FitnessGoal.general_fitness,
            experience=WorkoutExperience.beginner,
            workout_days=3,
        ),
    )
    return workout_day_service.create_day(
        db, plan.id, WorkoutDayCreate(day_number=1, day_name="Day 1", focus_area="Push")
    )


def _make_exercise(db: Session, name: str = "Unit Test Bench Press"):
    return exercise_service.create_exercise(
        db,
        ExerciseCreate(
            name=name,
            muscle_group=MuscleGroup.chest,
            equipment=ExerciseEquipment.barbell,
            difficulty=Difficulty.intermediate,
            instructions="Press the bar up, then lower with control.",
            exercise_type=ExerciseType.strength,
            default_sets=4,
            default_reps="6-8",
            rest_seconds=90,
        ),
    )


def test_create_and_get_workout_exercise(db: Session) -> None:
    day = _make_day(db)
    exercise = _make_exercise(db)

    created = workout_exercise_service.create_workout_exercise(
        db,
        day.id,
        WorkoutExerciseCreate(
            exercise_id=exercise.id, sets=4, reps="6-8", rest_seconds=90, order_index=0
        ),
    )
    fetched = workout_exercise_service.get_workout_exercise(db, created.id)

    assert fetched.id == created.id
    assert fetched.exercise_id == exercise.id
    assert fetched.workout_day_id == day.id


def test_get_workout_exercise_raises_not_found_for_unknown_id(db: Session) -> None:
    with pytest.raises(NotFoundError):
        workout_exercise_service.get_workout_exercise(db, "does-not-exist")


def test_list_workout_exercises_for_day_orders_by_index(db: Session) -> None:
    day = _make_day(db)
    exercise = _make_exercise(db)
    workout_exercise_service.create_workout_exercise(
        db,
        day.id,
        WorkoutExerciseCreate(
            exercise_id=exercise.id, sets=3, reps="10", rest_seconds=60, order_index=1
        ),
    )
    workout_exercise_service.create_workout_exercise(
        db,
        day.id,
        WorkoutExerciseCreate(
            exercise_id=exercise.id, sets=3, reps="10", rest_seconds=60, order_index=0
        ),
    )

    results = workout_exercise_service.list_workout_exercises_for_day(db, day.id)

    assert [item.order_index for item in results] == [0, 1]


def test_update_workout_exercise_applies_only_provided_fields(db: Session) -> None:
    day = _make_day(db)
    exercise = _make_exercise(db)
    created = workout_exercise_service.create_workout_exercise(
        db,
        day.id,
        WorkoutExerciseCreate(
            exercise_id=exercise.id, sets=3, reps="10", rest_seconds=60, order_index=0
        ),
    )

    updated = workout_exercise_service.update_workout_exercise(
        db, created.id, WorkoutExerciseUpdate(sets=5)
    )

    assert updated.sets == 5
    assert updated.reps == "10"  # untouched


def test_delete_workout_exercise_removes_it(db: Session) -> None:
    day = _make_day(db)
    exercise = _make_exercise(db)
    created = workout_exercise_service.create_workout_exercise(
        db,
        day.id,
        WorkoutExerciseCreate(
            exercise_id=exercise.id, sets=3, reps="10", rest_seconds=60, order_index=0
        ),
    )

    workout_exercise_service.delete_workout_exercise(db, created.id)

    with pytest.raises(NotFoundError):
        workout_exercise_service.get_workout_exercise(db, created.id)


def test_workout_exercise_can_navigate_to_its_exercise(db: Session) -> None:
    day = _make_day(db)
    exercise = _make_exercise(db, name="Unit Test Specific Bench")
    created = workout_exercise_service.create_workout_exercise(
        db,
        day.id,
        WorkoutExerciseCreate(
            exercise_id=exercise.id, sets=3, reps="10", rest_seconds=60, order_index=0
        ),
    )

    fetched = workout_exercise_service.get_workout_exercise(db, created.id)

    # Confirms the full WorkoutPlan -> WorkoutDay -> WorkoutExercise ->
    # Exercise relationship chain is actually wired, not just the FK column.
    assert fetched.exercise.name == "Unit Test Specific Bench"


def test_deleting_a_day_cascades_to_its_workout_exercises(db: Session) -> None:
    day = _make_day(db)
    exercise = _make_exercise(db)
    created = workout_exercise_service.create_workout_exercise(
        db,
        day.id,
        WorkoutExerciseCreate(
            exercise_id=exercise.id, sets=3, reps="10", rest_seconds=60, order_index=0
        ),
    )

    workout_day_service.delete_day(db, day.id)

    with pytest.raises(NotFoundError):
        workout_exercise_service.get_workout_exercise(db, created.id)
