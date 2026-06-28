"""Unit tests for `app.services.workout_plan_service`."""

import uuid

import pytest
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.enums import FitnessGoal, WorkoutExperience
from app.schemas.workout import WorkoutPlanCreate, WorkoutPlanUpdate
from app.services import workout_plan_service


def _fake_user_id() -> str:
    """A syntactically valid id with no matching `users` row.

    Safe for these CRUD-mechanics tests: SQLite (used for tests) doesn't
    enforce FK constraints by default, and these tests are about
    `workout_plan_service`'s own behavior, not referential integrity — that's
    a database-level concern, enforced for real on Postgres in production.
    """
    return str(uuid.uuid4())


def _sample_plan_data(**overrides: object) -> WorkoutPlanCreate:
    defaults: dict[str, object] = dict(
        title="Push Pull Legs",
        goal=FitnessGoal.muscle_gain,
        experience=WorkoutExperience.intermediate,
        workout_days=4,
        active=True,
    )
    defaults.update(overrides)
    return WorkoutPlanCreate(**defaults)


def test_create_and_get_plan(db: Session) -> None:
    user_id = _fake_user_id()

    created = workout_plan_service.create_plan(db, user_id, _sample_plan_data())
    fetched = workout_plan_service.get_plan(db, created.id)

    assert fetched.id == created.id
    assert fetched.user_id == user_id
    assert fetched.title == "Push Pull Legs"
    assert fetched.goal == FitnessGoal.muscle_gain


def test_get_plan_raises_not_found_for_unknown_id(db: Session) -> None:
    with pytest.raises(NotFoundError):
        workout_plan_service.get_plan(db, "does-not-exist")


def test_list_plans_for_user_only_returns_that_users_plans(db: Session) -> None:
    user_a, user_b = _fake_user_id(), _fake_user_id()
    workout_plan_service.create_plan(db, user_a, _sample_plan_data(title="Plan A"))
    workout_plan_service.create_plan(db, user_b, _sample_plan_data(title="Plan B"))

    results = workout_plan_service.list_plans_for_user(db, user_a)

    assert {plan.title for plan in results} == {"Plan A"}


def test_update_plan_applies_only_provided_fields(db: Session) -> None:
    created = workout_plan_service.create_plan(db, _fake_user_id(), _sample_plan_data())

    updated = workout_plan_service.update_plan(db, created.id, WorkoutPlanUpdate(active=False))

    assert updated.active is False
    assert updated.title == "Push Pull Legs"  # untouched by the partial update


def test_update_plan_raises_not_found_for_unknown_id(db: Session) -> None:
    with pytest.raises(NotFoundError):
        workout_plan_service.update_plan(db, "does-not-exist", WorkoutPlanUpdate(active=False))


def test_delete_plan_removes_it(db: Session) -> None:
    created = workout_plan_service.create_plan(db, _fake_user_id(), _sample_plan_data())

    workout_plan_service.delete_plan(db, created.id)

    with pytest.raises(NotFoundError):
        workout_plan_service.get_plan(db, created.id)
