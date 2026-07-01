<div align="center">

# Athlyt

**Train smarter. Progress faster.**

An AI-powered fitness coaching platform — personalised workout plans, nutrition tracking, progress analytics, and workout session management. Built as a production-quality portfolio project demonstrating full-stack + ML engineering.

[![Backend Tests](https://img.shields.io/badge/tests-214%20passing-brightgreen)](backend/tests)
[![Python](https://img.shields.io/badge/python-3.12-blue)](backend/pyproject.toml)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](frontend/package.json)
[![License](https://img.shields.io/badge/license-MIT-blue)](#license)

</div>

---

## Features

| Module | Capabilities |
|---|---|
| **Auth** | Register, login, JWT authentication |
| **Profile** | Onboarding wizard, BMI, daily calorie estimate (Mifflin-St Jeor) |
| **Workouts** | Rule-based split recommendation, dynamic weekly plan generation, session tracking (start/pause/resume/complete/skip/finish) |
| **Statistics** | Streaks, personal records, weekly volume, 365-day activity heatmap |
| **Progress** | Weight/body fat/sleep logging, body measurements, weight trend chart |
| **Nutrition** | Rule-based meal plan generation (non-veg/vegetarian/vegan), daily macro logging |
| **UI** | Dark mode, cursor-following glow, ambient gradient orbs, 3D tilt cards, responsive sidebar |

---

## Tech stack

| | Technology |
|---|---|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, Recharts |
| **Backend** | FastAPI, SQLAlchemy 2.0, Pydantic v2, PyJWT, bcrypt |
| **Database** | SQLite (dev) / PostgreSQL-compatible (prod) |
| **ML** | scikit-learn — trained offline in Colab, loaded via joblib |
| **Testing** | pytest (214 tests), ruff, black |

---

## Architecture

```
Browser
  └── Next.js 15 (Vercel)
        └── FastAPI /api/v1 (Render/Railway)
              ├── Router → Service → Repository → SQLAlchemy ORM → SQLite/PostgreSQL
              └── ML inference layer (joblib model, loaded at startup)
```

Full architecture documentation: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## Quick start

### Prerequisites
- Python 3.12+
- Node.js 18+

### Backend

```bash
cd backend

# Install dependencies
pip install -e ".[dev]"

# Configure environment
cp .env.example .env
# Edit .env — generate JWT_SECRET_KEY:
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(48))"

# Start development server
uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

### Frontend

```bash
cd frontend

npm install

# Configure environment
# Create .env.local:
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local

npm run dev
# → http://localhost:3000
```

---

## Environment variables

### Backend (`.env`)

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET_KEY` | ✅ | Random string ≥ 32 chars. Generate: `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `DATABASE_URL` | ✅ | `sqlite:///./athlyt.db` (dev) or `postgresql+psycopg2://...` (prod) |
| `CORS_ORIGINS` | ✅ | Comma-separated: `http://localhost:3000` (dev) or `https://your-app.vercel.app` (prod) |
| `ENVIRONMENT` | — | `local` \| `production` (default: `local`) |
| `DEBUG` | — | `true` \| `false` (default: `false`) |

### Frontend (`.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL, e.g. `http://localhost:8000/api/v1` |

---

## Project structure

```
athlyt/
├── backend/
│   ├── app/
│   │   ├── api/v1/routers/   — HTTP endpoints (thin layer)
│   │   ├── services/          — Business logic
│   │   ├── repositories/      — Database access
│   │   ├── models/            — SQLAlchemy ORM models
│   │   ├── schemas/           — Pydantic request/response schemas
│   │   ├── core/              — Config, security, exceptions
│   │   └── db/                — Engine, session, seed data
│   └── tests/                 — 214 pytest tests
├── frontend/
│   ├── app/                   — Next.js App Router pages
│   ├── components/            — UI components (shared + domain)
│   ├── hooks/                 — TanStack Query data hooks
│   ├── lib/                   — API client, validators, utilities
│   └── types/                 — TypeScript interfaces
├── ml/
│   ├── notebooks/             — Colab training notebooks
│   └── models/                — Exported .joblib artifacts
└── docs/
    ├── ARCHITECTURE.md
    ├── DATABASE_SCHEMA.md
    ├── DEPLOYMENT.md
    ├── PROJECT_BIBLE.md
    └── API_REFERENCE.md
```

---

## API reference

All endpoints are under `/api/v1`. See [docs/API_REFERENCE.md](docs/API_REFERENCE.md) for the full reference, or browse the live Swagger UI at `http://localhost:8000/docs`.

**Quick reference (38 endpoints):**

```
Auth:        POST /auth/register, /auth/login
Users:       GET /users/me, PATCH /users/me
Exercises:   GET /exercises, /exercises/{id}
Workouts:    POST /workouts/recommend, /workouts/generate, /workouts/start
             POST /workouts/{id}/pause|resume|finish
             POST /workouts/{id}/exercise/{eid}/complete|skip
             GET  /workouts/current, /workouts/today, /workouts/history
Stats:       GET  /workouts/stats/summary|weekly-volume|personal-records|heatmap
Progress:    POST /progress/logs, /progress/measurements
             GET  /progress/logs, /progress/measurements, /progress/summary
Nutrition:   POST /nutrition/plans/generate, /nutrition/logs
             GET  /nutrition/plans/current, /nutrition/logs, /nutrition/logs/today
             GET  /nutrition/summary/weekly
Health:      GET  /health, /health/detailed
```

---

## Testing

```bash
# Backend — 214 tests
cd backend && pytest

# Lint & format
ruff check . && black --check .

# Frontend — TypeScript type check + build
cd frontend && npm run build

# Frontend lint
npm run lint
```

---

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full Vercel + Render deployment guide.

**Short version:**
- Frontend → Vercel (zero config, auto-detected Next.js)
- Backend → Render/Railway/Fly.io (`pip install -e . && uvicorn app.main:app --host 0.0.0.0 --port $PORT`)
- Database → PostgreSQL managed add-on (one-line `DATABASE_URL` change)

---

## Database schema

13 tables. See [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for the full schema.

Key design: SQLite in dev, PostgreSQL-compatible by design (UUIDs as `String(36)`, enums as `VARCHAR` with `native_enum=False`, no SQLite-specific SQL anywhere).

---

## Roadmap

- [ ] Alembic migrations (before first production deployment)
- [ ] ML workout recommendation model (scikit-learn, Colab training pipeline)
- [ ] AI coach (LLM-backed chatbot)
- [ ] Progress photo upload (S3/R2)
- [ ] Email verification + password reset
- [ ] Push notifications / workout reminders
- [ ] Docker Compose for one-command local setup
- [ ] CI/CD (GitHub Actions)

---

## Design decisions

A few non-obvious choices worth knowing:

- **Synchronous SQLAlchemy** — FastAPI runs sync deps in a threadpool; no async overhead needed at this scale.
- **No Alembic (yet)** — `create_all()` at startup is correct for a project with no live database. Alembic gets added before the first real deployment.
- **Single JWT** — 7-day access token, no refresh rotation. Right tradeoff for a portfolio demo.
- **`CORS_ORIGINS` with `NoDecode`** — pydantic-settings v2 would JSON-decode a list env var before the validator runs; `NoDecode` prevents this.
- **Pause/resume uses `accumulated_active_seconds`** — naive `completed_at - started_at` would count paused time as training time.
- **Cursor glow on `requestAnimationFrame`** — style mutations bypass React's render cycle entirely; stays at 60fps on heavy pages.

Full decision log: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/PROJECT_BIBLE.md](docs/PROJECT_BIBLE.md).

---

## License

MIT — see [LICENSE](LICENSE) for details.
