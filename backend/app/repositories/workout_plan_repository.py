"""Data access for `WorkoutPlan`."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.workout_plan import WorkoutPlan


def get_by_id(db: Session, plan_id: str) -> WorkoutPlan | None:
    return db.get(WorkoutPlan, plan_id)


def list_by_user(db: Session, user_id: str) -> list[WorkoutPlan]:
    query = (
        select(WorkoutPlan)
        .where(WorkoutPlan.user_id == user_id)
        .order_by(WorkoutPlan.created_at.desc())
    )
    return list(db.execute(query).scalars().all())


def create(db: Session, *, user_id: str, fields: dict) -> WorkoutPlan:
    plan = WorkoutPlan(user_id=user_id, **fields)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def update(db: Session, *, plan: WorkoutPlan, fields: dict) -> WorkoutPlan:
    for key, value in fields.items():
        setattr(plan, key, value)
    db.commit()
    db.refresh(plan)
    return plan


def delete(db: Session, *, plan: WorkoutPlan) -> None:
    """Cascades to the plan's `WorkoutDay` (and their `WorkoutExercise`) rows
    via the ORM-level `cascade="all, delete-orphan"` declared on
    `WorkoutPlan.days` — not just a DB-level FK cascade, so this works the
    same on SQLite (which doesn't enforce FK constraints by default) and
    Postgres."""
    db.delete(plan)
    db.commit()
