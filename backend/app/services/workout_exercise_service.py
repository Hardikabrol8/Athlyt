"""Business logic for `WorkoutExercise` — thin CRUD wrappers, no generation
logic. Does not validate that `exercise_id` refers to a real `Exercise` —
that's a database-level FK concern, and the future plan generator (which is
the only thing that will actually call `create_workout_exercise`) will always
be supplying real exercise ids it just looked up itself."""

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.workout_exercise import WorkoutExercise
from app.repositories import workout_exercise_repository
from app.schemas.workout import WorkoutExerciseCreate, WorkoutExerciseUpdate


def get_workout_exercise(db: Session, workout_exercise_id: str) -> WorkoutExercise:
    workout_exercise = workout_exercise_repository.get_by_id(db, workout_exercise_id)
    if workout_exercise is None:
        raise NotFoundError(f"Workout exercise {workout_exercise_id} not found.")
    return workout_exercise


def list_workout_exercises_for_day(db: Session, workout_day_id: str) -> list[WorkoutExercise]:
    return workout_exercise_repository.list_by_day(db, workout_day_id)


def create_workout_exercise(
    db: Session, workout_day_id: str, data: WorkoutExerciseCreate
) -> WorkoutExercise:
    return workout_exercise_repository.create(
        db, workout_day_id=workout_day_id, fields=data.model_dump()
    )


def update_workout_exercise(
    db: Session, workout_exercise_id: str, data: WorkoutExerciseUpdate
) -> WorkoutExercise:
    workout_exercise = get_workout_exercise(db, workout_exercise_id)
    fields = data.model_dump(exclude_unset=True)
    return workout_exercise_repository.update(db, workout_exercise=workout_exercise, fields=fields)


def delete_workout_exercise(db: Session, workout_exercise_id: str) -> None:
    workout_exercise = get_workout_exercise(db, workout_exercise_id)
    workout_exercise_repository.delete(db, workout_exercise=workout_exercise)
