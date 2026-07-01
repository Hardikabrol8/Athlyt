# Changelog

All notable changes to Athlyt are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned
- Alembic migrations (before PostgreSQL production deployment)
- ML workout recommendation model (scikit-learn, trained in Colab)
- Progress photo upload (S3/R2 object storage)
- Push notifications / reminders
- AI coach chatbot (LLM-backed conversation)

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
