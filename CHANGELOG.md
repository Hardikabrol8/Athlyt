# Changelog

All notable changes to Athlyt are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned
- ML workout recommendation model (scikit-learn, trained in Colab — inference layer already wired)
- Progress photo upload (S3/R2 object storage)
- Push notifications / reminders
- AI coach chatbot (LLM-backed conversation)
- Refresh-token rotation (currently a single 7-day access token)

---

## [1.0.0] — Live Production Deployment

### Added
- Deployed live: frontend on Vercel, backend on Render, database on Neon PostgreSQL
- Comprehensive root-level `DEPLOYMENT.md` — codebase-specific step-by-step guide covering Render/Vercel/Neon setup, environment variable reference, security review, custom domain + SSL setup, pre-deployment testing checklist, post-deployment verification checklist, and a 20-item troubleshooting table

### Fixed
- Ruff/black version drift between local dev and CI — pinned both to exact versions (`ruff==0.15.20`, `black==25.12.0`) after a newer CI-resolved ruff version flagged `UP042` (str+Enum pattern) and a newer black reformatted an Alembic-generated migration file that had never been run through black
- Ignored `UP042` explicitly in `ruff` config — the project deliberately uses `(str, Enum)` throughout `app/models/enums.py` for SQLAlchemy compatibility, not `StrEnum`

---

## [0.5.0] — Production Readiness (Backend Hardening)

### Added
- `app/core/logging_config.py` — structured logging, DEBUG in local/test, INFO in production, correctly scoped so `app.*` loggers propagate to root without duplicate output
- `app/core/security_headers.py` — `SecurityHeadersMiddleware` adding baseline security headers to every API response
- `TrustedHostMiddleware` + `ALLOWED_HOSTS` setting — rejects requests with an unrecognized `Host` header
- Dedicated Neon PostgreSQL section in deployment docs (SSL requirement, autosuspend behavior, connection limits)
- `docker-compose.yml`, `docker-compose.override.yml` — full local stack (postgres + backend + frontend) with dev-mode hot reload
- `backend/Dockerfile`, `frontend/Dockerfile` (+ `Dockerfile.dev`) — multi-stage production builds
- GitHub Actions CI — `backend-ci.yml` (pytest/ruff/black) and `frontend-ci.yml` (install/lint/build), path-filtered and cached

### Fixed
- **Silent unhandled exceptions** — registering a custom `Exception` handler had replaced Starlette's default traceback-logging middleware; every unhandled 500 was previously invisible in logs. Fixed with explicit `logger.exception(...)`.
- Alembic migration file's trailing whitespace (auto-generated, never previously run through `black`)

### Changed
- `app/main.py` — `create_all()` now only runs in `local`/`test` environments; production schema is managed exclusively by Alembic

---

## [0.4.1] — Alembic & PostgreSQL Migration Readiness

### Added
- Alembic initialized — `alembic/env.py` supports both SQLite (dev/test) and PostgreSQL (production) from the same codebase, with `render_as_batch=True` for SQLite ALTER support and `compare_type=True` for enum change detection
- Initial migration (`alembic/versions/..._initial_schema.py`) covering all 13 tables, every FK with CASCADE rules, every index, all `native_enum=False` enums
- PostgreSQL connection pool tuning in `app/db/session.py` (`pool_pre_ping`, `pool_size`, `pool_recycle`) — handles free-tier database autosuspend gracefully

---

## [0.4.0] — Production Audit & Polish

### Added
- `docs/` folder: ARCHITECTURE.md, DATABASE_SCHEMA.md, DEPLOYMENT.md, API_REFERENCE.md, PROJECT_BIBLE.md, CHANGELOG.md
- `loading.tsx` for every app route (Next.js App Router loading UI)
- `error.tsx` app-level error boundary with retry
- `not-found.tsx` 404 page with ambient background
- `GET /api/v1/health/detailed` extended health check endpoint
- Security headers in `next.config.ts` (X-Content-Type-Options, X-Frame-Options, etc.)
- Proper TypeScript types for all API responses — eliminated `eslint-disable any` from pages
- Dedicated `hooks/use-dashboard-data.ts` for progress, nutrition, and stats hooks
- `reactStrictMode: true` in Next.js config

### Fixed
- Settings page `SelectField` was re-created on every render (moved outside component)
- Progress/nutrition/workouts pages used inline `useQuery` hooks (extracted to `use-dashboard-data.ts`)
- `pyproject.toml` version pins were too narrow (would block installs in ~12 months)
- CRLF trailing bytes in `config.py`
- Missing `htmlFor` attributes on form labels in progress and nutrition pages

### Changed
- Version pins loosened from patch-level to minor-level compatibility

---

## [0.3.0] — Complete Feature Set

### Added
- **Progress module**: weight/body-fat/sleep logging (upsert), body measurements, 30-day change summary, weight trend chart
- **Nutrition module**: rule-based meal plan generation (non-veg/vegetarian/vegan + Indian templates), daily macro logging, weekly summary
- **Workout statistics**: total sessions, total minutes, current/longest streak, weekly volume, personal records, 365-day activity heatmap
- **Sidebar navigation** (desktop) + bottom nav (mobile)
- **/workouts page**: stats dashboard + history + today's workout
- **/progress page**: weight chart (Recharts), log form, history table
- **/nutrition page**: macro donut chart, meal cards, daily log form
- **/settings page**: full profile edit with all onboarding fields

---

## [0.2.0] — Workout Tracking + Dynamic UI

### Added
- `WorkoutSession` and `ExerciseCompletion` models
- Full session lifecycle: start → complete/skip exercises → pause/resume → finish
- Accurate duration tracking (`accumulated_active_seconds` — excludes paused time)
- MET-based calorie burn estimate
- Workout history (permanent append-only)
- `POST /workouts/start`, `/{id}/pause`, `/{id}/resume`, `/{id}/exercise/{eid}/complete`, `/{id}/exercise/{eid}/skip`, `/{id}/finish`
- `GET /workouts/history`, `GET /workouts/history/{id}`
- **Active workout card**: live timer, animated progress bar, exercise checklist, finish screen
- **Cursor-following glow** (60fps via `requestAnimationFrame`)
- **Ambient gradient orbs** (4 slow-drifting, CSS animation)
- **SVG noise texture** overlay
- **3D perspective tilt cards** with inner spotlight
- `TiltCard` and `AmbientBackground` shared components

---

## [0.1.0] — Foundation

### Added
- Monorepo: `frontend/`, `backend/`, `ml/`
- **Auth**: register, login, JWT (7-day), bcrypt password hashing
- **Profile & onboarding**: multi-field onboarding, BMI, Mifflin-St Jeor calorie estimate
- **Exercise library**: 100 exercises across 7 muscle groups, idempotent seeding
- **Workout recommendation engine**: modular rule-based split selection (PPL, Upper/Lower, Full Body, Bro Split, Home)
- **Workout planner**: dynamic exercise selection from DB, weekly plan generation, plan persistence
- **Dashboard**: welcome card, today's workout, weekly plan grid, exercise detail
- Repository Pattern + Service Layer architecture
- 214 backend tests (pytest)
- Ruff + Black linting
- Responsive layout, dark mode, Framer Motion animations
- `DashboardStatCard`, `GlassCard`, `SectionHeader`, `PrimaryButton` shared components
