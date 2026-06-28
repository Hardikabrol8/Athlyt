"""Unit tests for `app.services.workout_day_service`."""

import uuid

import pytest
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.enums import FitnessGoal, WorkoutExperience
from app.schemas.workout import WorkoutDayCreate, WorkoutDayUpdate, WorkoutPlanCreate
from app.services import workout_day_service, workout_plan_service


def _make_plan(db: Session):
    return workout_plan_service.create_plan(
        db,
        str(uuid.uuid4()),
        WorkoutPlanCreate(
            title="Test Plan",
            goal=FitnessGoal.general_fitness,
            experience=WorkoutExperience.beginner,
            workout_days=3,
        ),
    )


def test_create_and_get_day(db: Session) -> None:
    plan = _make_plan(db)

    created = workout_day_service.create_day(
        db, plan.id, WorkoutDayCreate(day_number=1, day_name="Day 1", focus_area="Push")
    )
    fetched = workout_day_service.get_day(db, created.id)

    assert fetched.id == created.id
    assert fetched.workout_plan_id == plan.id
    assert fetched.focus_area == "Push"


def test_get_day_raises_not_found_for_unknown_id(db: Session) -> None:
    with pytest.raises(NotFoundError):
        workout_day_service.get_day(db, "does-not-exist")


def test_list_days_for_plan_orders_by_day_number(db: Session) -> None:
    plan = _make_plan(db)
    workout_day_service.create_day(
        db, plan.id, WorkoutDayCreate(day_number=2, day_name="Day 2", focus_area="Pull")
    )
    workout_day_service.create_day(
        db, plan.id, WorkoutDayCreate(day_number=1, day_name="Day 1", focus_area="Push")
    )

    days = workout_day_service.list_days_for_plan(db, plan.id)

    assert [day.day_number for day in days] == [1, 2]


def test_update_day_applies_only_provided_fields(db: Session) -> None:
    plan = _make_plan(db)
    created = workout_day_service.create_day(
        db, plan.id, WorkoutDayCreate(day_number=1, day_name="Day 1", focus_area="Push")
    )

    updated = workout_day_service.update_day(
        db, created.id, WorkoutDayUpdate(focus_area="Chest & Triceps")
    )

    assert updated.focus_area == "Chest & Triceps"
    assert updated.day_name == "Day 1"  # untouched


def test_delete_day_removes_it(db: Session) -> None:
    plan = _make_plan(db)
    created = workout_day_service.create_day(
        db, plan.id, WorkoutDayCreate(day_number=1, day_name="Day 1", focus_area="Push")
    )

    workout_day_service.delete_day(db, created.id)

    with pytest.raises(NotFoundError):
        workout_day_service.get_day(db, created.id)


def test_deleting_a_plan_cascades_to_its_days(db: Session) -> None:
    plan = _make_plan(db)
    day = workout_day_service.create_day(
        db, plan.id, WorkoutDayCreate(day_number=1, day_name="Day 1", focus_area="Push")
    )

    workout_plan_service.delete_plan(db, plan.id)

    with pytest.raises(NotFoundError):
        workout_day_service.get_day(db, day.id)
