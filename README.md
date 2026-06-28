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

**Project Setup — complete.** Auth, profile, dashboard, workout/diet
generation, progress tracking, AI coach, and the ML model are built feature by
feature from here, each one stopped for review before the next starts.

What exists right now:
- Backend boots, connects to SQLite, exposes `GET /api/v1/health`
- Frontend boots, themed with shadcn/ui (light/dark), and its home page calls
  the real backend health endpoint to prove the two are actually wired together
- JWT + password-hashing utilities are implemented and tested, not yet wired
  to any endpoint (that's the next feature)

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
