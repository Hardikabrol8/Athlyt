"""Business logic for `WorkoutPlan` — thin CRUD wrappers, no generation logic.
Nothing calls this yet (no router exposes it this milestone); it exists so
the next milestone's plan-generation feature has a tested foundation to call
into rather than building CRUD and generation logic in the same change.
"""

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.workout_plan import WorkoutPlan
from app.repositories import workout_plan_repository
from app.schemas.workout import WorkoutPlanCreate, WorkoutPlanUpdate


def get_plan(db: Session, plan_id: str) -> WorkoutPlan:
    plan = workout_plan_repository.get_by_id(db, plan_id)
    if plan is None:
        raise NotFoundError(f"Workout plan {plan_id} not found.")
    return plan


def list_plans_for_user(db: Session, user_id: str) -> list[WorkoutPlan]:
    return workout_plan_repository.list_by_user(db, user_id)


def create_plan(db: Session, user_id: str, data: WorkoutPlanCreate) -> WorkoutPlan:
    return workout_plan_repository.create(db, user_id=user_id, fields=data.model_dump())


def update_plan(db: Session, plan_id: str, data: WorkoutPlanUpdate) -> WorkoutPlan:
    plan = get_plan(db, plan_id)
    fields = data.model_dump(exclude_unset=True)
    return workout_plan_repository.update(db, plan=plan, fields=fields)


def delete_plan(db: Session, plan_id: str) -> None:
    plan = get_plan(db, plan_id)
    workout_plan_repository.delete(db, plan=plan)
