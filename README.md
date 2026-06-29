# Athlyt

> Train smarter. Progress faster.

Athlyt is an AI-powered fitness coach: personalized workout plans, diet plans,
and progress tracking, with a machine learning model recommending workouts.
Built as a placement-portfolio project — full-stack + ML.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend | FastAPI, SQLAlchemy 2.0, Pydantic |
| Database | SQLite (Postgres-compatible by design — see `backend/app/db/`) |
| Auth | JWT |
| ML | scikit-learn, trained offline in Colab, loaded from a `.joblib` file |

## Project structure

```
athlyt/
├── frontend/   Next.js app
├── backend/    FastAPI app
├── ml/         Training notebooks + exported model artifacts
└── README.md   You are here
```

## Status

Built feature by feature, each one reviewed before the next starts. So far:

- **Auth & onboarding** — register/login (JWT), profile onboarding, BMI +
  daily calorie estimate, dashboard.
- **Exercise library** — 100 seeded exercises across 7 muscle groups,
  filterable by muscle group/equipment/difficulty.
- **Workout models** — `WorkoutPlan → WorkoutDay → WorkoutExercise →
  Exercise`, full CRUD service layer (no API exposed for these yet — that's
  the Workout Planner, still to come).
- **Workout recommendation engine** — `POST /api/v1/workouts/recommend`
  decides which workout *split* (Push Pull Legs, Upper Lower, Full Body, Bro
  Split, Upper Lower Strength, or Home Bodyweight) fits a user, via a
  modular rule pipeline (not an if/else chain — see
  `backend/app/services/recommendation_rules.py`) designed to be swappable
  for an ML model later without changing any other code. Stateless — nothing
  is persisted.

Not built yet: actual workout-plan generation (picking specific exercises
for specific days), diet planning, progress tracking, the AI coach, and the
ML model itself.

## Running it locally

### Backend

```bash
cd backend
pip install -e ".[dev]"
cp .env.example .env
# edit .env and set a real JWT_SECRET_KEY — generate one with:
python -c "import secrets; print(secrets.token_urlsafe(48))"

uvicorn app.main:app --reload
# → http://localhost:8000/docs
```

A SQLite file (`athlyt.db`) is created automatically on first run — no
separate database setup step.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local

npm run dev
# → http://localhost:3000
```

With both running, the home page's "Backend connected" badge confirms the
full stack is wired up correctly.

### Tests / linting

```bash
# Backend
cd backend && pytest && ruff check . && black --check .

# Frontend
cd frontend && npm run lint && npm run build
```

## Design decisions worth knowing about

These are deliberate scope cuts for a one-week solo build, not oversights —
each is explained in more detail as a comment at its point of use in the code:

- **Sync SQLAlchemy, not async.** FastAPI runs sync dependencies in a
  threadpool automatically, so this costs nothing in practice and removes a
  category of async-specific setup. See `backend/app/db/session.py`.
- **No Alembic yet.** Tables are created with `Base.metadata.create_all()` at
  startup. Worth adding before a real migration to Postgres with live data —
  not needed before that. See `backend/app/main.py`.
- **UUIDs stored as `String(36)`, not a native UUID column.** SQLite has no
  UUID type; this is what actually keeps the schema portable to Postgres
  later, rather than just looking like it is. See `backend/app/db/base.py`.
- **One JWT access token, no refresh-token rotation.** Simpler, still secure
  enough for a portfolio demo. See `backend/app/core/config.py`.
- **`bcrypt` directly, not `passlib`.** `passlib`'s last release (2020) is
  incompatible with modern bcrypt. See `backend/app/core/security.py`.
- **No mypy.** Ruff catches most real bugs already; strict typing setup is
  worth it for a bigger/longer-lived codebase, not a one-week one.
- **`workout_days_per_week` is a request parameter, not a profile field.**
  The recommendation engine needs it, but `Profile` doesn't have it and
  can't safely gain a new required column without a migration system (see
  "No Alembic yet" above) — so `POST /workouts/recommend` takes it directly
  instead. See `backend/app/schemas/recommendation.py`.
