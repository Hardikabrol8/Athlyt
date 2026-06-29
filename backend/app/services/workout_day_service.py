"""Business logic for `WorkoutDay` — thin CRUD wrappers, no generation logic."""

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.workout_day import WorkoutDay
from app.repositories import workout_day_repository
from app.schemas.workout import WorkoutDayCreate, WorkoutDayUpdate


def get_day(db: Session, day_id: str) -> WorkoutDay:
    day = workout_day_repository.get_by_id(db, day_id)
    if day is None:
        raise NotFoundError(f"Workout day {day_id} not found.")
    return day


def list_days_for_plan(db: Session, workout_plan_id: str) -> list[WorkoutDay]:
    return workout_day_repository.list_by_plan(db, workout_plan_id)


def create_day(db: Session, workout_plan_id: str, data: WorkoutDayCreate) -> WorkoutDay:
    return workout_day_repository.create(
        db, workout_plan_id=workout_plan_id, fields=data.model_dump()
    )


def update_day(db: Session, day_id: str, data: WorkoutDayUpdate) -> WorkoutDay:
    day = get_day(db, day_id)
    fields = data.model_dump(exclude_unset=True)
    return workout_day_repository.update(db, day=day, fields=fields)


def delete_day(db: Session, day_id: str) -> None:
    day = get_day(db, day_id)
    workout_day_repository.delete(db, day=day)
