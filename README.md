# Athlyt

> Train smarter. Progress faster.

Athlyt is an AI-powered fitness coaching platform: personalised workout plans, diet planning, progress tracking, and workout analytics — built as a production-quality portfolio project.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, Recharts |
| Backend | FastAPI, SQLAlchemy 2.0, Pydantic v2 |
| Database | SQLite (Postgres-compatible by design) |
| Auth | JWT (single access token, 7-day expiry) |
| ML | scikit-learn — trained offline in Colab, loaded from `.joblib` |

## Project structure

```
athlyt/
├── frontend/   Next.js 15 app
├── backend/    FastAPI app (214 tests)
├── ml/         Training notebooks + model artifacts
└── README.md
```

## Features

### Auth & Profile
- Register / Login (JWT)
- Onboarding wizard collecting body metrics, goals, experience, equipment, diet preference
- BMI + daily calorie estimate (Mifflin-St Jeor × activity multiplier)

### Workout Module
- 100-exercise seeded library across 7 muscle groups, filterable by equipment/difficulty
- Rule-based workout split recommendation (Push Pull Legs, Upper Lower, Full Body, Bro Split, Home Bodyweight)
- Full weekly plan generation — exercises selected dynamically from the DB, never hardcoded
- Workout session tracking: start → complete/skip exercises → pause/resume → finish
- Accurate duration tracking (paused time excluded via `accumulated_active_seconds`)
- MET-based calorie burn estimate
- Workout history (permanent, never deleted)
- Statistics: total sessions, total minutes, current/longest streak, weekly volume, personal records, activity heatmap

### Progress Module
- Daily weight / body fat % / sleep logging (upsert on same date)
- Body measurement logging (chest, waist, hips, arms, thighs)
- Weight trend chart
- 30-day weight change

### Nutrition Module
- Rule-based meal plan generation from user profile (calories → macro split → curated meals)
- Supports: non-vegetarian, vegetarian, vegan (including Indian meal templates)
- Daily nutrition logging (calories, protein, carbs, fat, water)
- Weekly average summary

### UI
- Responsive sidebar nav (desktop) + bottom nav (mobile)
- Dark mode via next-themes
- Cursor-following glow (60fps via `requestAnimationFrame`)
- Four slow-drifting ambient gradient orbs + SVG noise texture
- 3D perspective tilt on cards with inner spotlight
- Framer Motion page transitions and stagger animations
- Skeleton loaders, empty states, error states on every data-dependent view
- Premium SaaS design (Linear / Stripe Dashboard / Vercel aesthetic)

## API surface (38 endpoints)

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/users/me` | Current user + profile + metrics |
| PATCH | `/users/me` | Update profile |
| GET | `/exercises` | Exercise catalog (filterable) |
| GET | `/exercises/{id}` | Single exercise |
| POST | `/workouts/recommend` | Recommend a split (stateless) |
| POST | `/workouts/generate` | Generate + persist weekly plan |
| GET | `/workouts/current` | Active plan |
| GET | `/workouts/today` | Today's workout day |
| POST | `/workouts/start` | Start session |
| POST | `/workouts/{id}/pause` | Pause session |
| POST | `/workouts/{id}/resume` | Resume session |
| POST | `/workouts/{id}/exercise/{eid}/complete` | Mark exercise done |
| POST | `/workouts/{id}/exercise/{eid}/skip` | Skip exercise |
| POST | `/workouts/{id}/finish` | Finish session |
| GET | `/workouts/history` | All completed sessions |
| GET | `/workouts/history/{id}` | Session detail |
| GET | `/workouts/stats/summary` | Totals, streaks |
| GET | `/workouts/stats/weekly-volume` | Weekly session + minute counts |
| GET | `/workouts/stats/personal-records` | Best session PRs |
| GET | `/workouts/stats/heatmap` | 365-day activity heatmap |
| POST | `/progress/logs` | Log weight/body fat/sleep |
| GET | `/progress/logs` | Progress log history |
| GET | `/progress/summary` | Current stats + 30d change |
| POST | `/progress/measurements` | Log body measurements |
| GET | `/progress/measurements` | Measurement history |
| POST | `/nutrition/plans/generate` | Generate meal plan |
| GET | `/nutrition/plans/current` | Active meal plan |
| POST | `/nutrition/logs` | Log daily intake |
| GET | `/nutrition/logs` | Nutrition log history |
| GET | `/nutrition/logs/today` | Today's log |
| GET | `/nutrition/summary/weekly` | 7-day average macros |
| GET | `/health` | Liveness check |

## Running locally

### Backend

```bash
cd backend
pip install -e ".[dev]"
cp .env.example .env
# Set JWT_SECRET_KEY in .env:
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(48))"

uvicorn app.main:app --reload
# → http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Tests

```bash
cd backend && pytest          # 214 tests
cd frontend && npm run build  # type-check + build
```

## Design decisions

- **Sync SQLAlchemy, not async** — FastAPI runs sync deps in a threadpool; no async overhead needed at this scale.
- **No Alembic yet** — `create_all()` at startup; add before a real Postgres migration with live data.
- **UUIDs as `String(36)`** — SQLite has no native UUID; this keeps the schema Postgres-portable.
- **One JWT access token** — no refresh rotation; right amount of complexity for a portfolio demo.
- **`CORS_ORIGINS` uses `NoDecode`** — pydantic-settings v2 would JSON-decode the env var before the validator runs without it.
- **Pause/resume uses `accumulated_active_seconds`** — naive `completed_at - started_at` would count paused time as training time.
- **Cursor glow on `requestAnimationFrame`** — bypasses React's render cycle entirely; stays at 60fps on heavy pages.
- **Meal plan is rule-based, not ML** — calories from Mifflin-St Jeor, macros split by goal (NSCA guidelines), meals from a curated library keyed on diet preference. ML model (workout recommendation) is trained separately in Colab and loaded as a `.joblib` artifact.
