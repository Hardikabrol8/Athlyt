# Athlyt — Deployment Guide

## Architecture

```
Vercel (frontend)  ←→  Render / Railway / Fly.io (backend API)  ←→  PostgreSQL (managed)
```

---

## Alembic — Database Migration Workflow

Alembic is now the single source of truth for the database schema in production.

### Day-to-day commands

```bash
# Apply all pending migrations to the database
alembic upgrade head

# Show current migration version on the connected database
alembic current

# Show migration history
alembic history --verbose

# Generate a new migration after changing a model
alembic revision --autogenerate -m "describe_what_changed"

# Roll back one migration
alembic downgrade -1

# Roll back to the very beginning (drops all tables)
alembic downgrade base

# Generate a SQL script instead of running live (for review)
alembic upgrade head --sql
```

### Environment

Alembic reads `DATABASE_URL` from your environment — the same variable the app uses. Set it before running any Alembic command:

```bash
# Local SQLite (default)
export DATABASE_URL=sqlite:///./athlyt.db

# Local PostgreSQL
export DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/athlyt

# Production (use the value from your deployment platform)
export DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/dbname
```

### Schema management strategy

| Environment | Schema managed by |
|---|---|
| `ENVIRONMENT=local` (SQLite dev) | `create_all()` at startup — no migrations needed |
| `ENVIRONMENT=test` (pytest) | `create_all()` via conftest.py — tests never use Alembic |
| `ENVIRONMENT=production` (PostgreSQL) | **Alembic only** — `alembic upgrade head` before deploy |

**Never run `alembic upgrade head` against your test database or an in-memory SQLite.** Tests use `create_all()` directly against a fresh in-memory SQLite for each test run — fast, isolated, Alembic-free.

### Adding a new model (workflow)

1. Create the model in `app/models/<name>.py`
2. Register it in `app/models/__init__.py`
3. Generate a migration: `alembic revision --autogenerate -m "add_<name>_table"`
4. Review the generated file in `alembic/versions/`
5. Apply locally: `alembic upgrade head`
6. Commit both the model file and the migration file
7. In production deploy: run `alembic upgrade head` before starting the server

---

## Backend — Render / Railway / Fly.io

### Environment variables (required in production)

| Variable | Description | Example |
|---|---|---|
| `JWT_SECRET_KEY` | Min 32-char random string | `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg2://user:pass@host:5432/athlyt` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `https://athlyt.vercel.app` |
| `ENVIRONMENT` | Must be `production` | `production` |
| `DEBUG` | `false` in production | `false` |

### Build command
```bash
pip install -e .
```

### Start command (pre-deploy step runs migrations first)
```bash
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Alternatively, split into a pre-deploy command and a start command on platforms that support it (Render, Railway):
- **Pre-deploy**: `alembic upgrade head`
- **Start**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Render-specific setup

1. Create a new **Web Service** pointing to your GitHub repo
2. Set root directory to `backend/`
3. Build command: `pip install -e .`
4. Start command: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add a **PostgreSQL** database add-on → copy the connection string to `DATABASE_URL`
6. Add all required environment variables
7. Set health check path: `/api/v1/health`

### Railway-specific setup

1. Create a new project → deploy from GitHub
2. Add a **PostgreSQL** plugin → Railway sets `DATABASE_URL` automatically
3. Set the start command in `railway.toml` or the UI:
   ```
   alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### Fly.io-specific setup

```toml
# fly.toml
[http_service]
  internal_port = 8000
  force_https = true

[[http_service.checks]]
  grace_period = "10s"
  interval = "30s"
  method = "GET"
  path = "/api/v1/health"

[deploy]
  release_command = "alembic upgrade head"
```

---

## Frontend — Vercel

### Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL e.g. `https://athlyt-api.onrender.com/api/v1` |

### Deploy settings (auto-detected by Vercel)
- **Framework**: Next.js
- **Build command**: `npm run build`
- **Install command**: `npm install`

---

## PostgreSQL — Local development

If you want to develop against PostgreSQL locally instead of SQLite:

```bash
# Install PostgreSQL (macOS)
brew install postgresql@16 && brew services start postgresql@16

# Create database
createdb athlyt

# Update .env
DATABASE_URL=postgresql+psycopg2://localhost/athlyt

# Run migrations
cd backend
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

---

## Pre-deployment checklist

- [ ] `JWT_SECRET_KEY` is a cryptographically random string ≥ 32 chars (never committed)
- [ ] `CORS_ORIGINS` contains only your Vercel domain, not `localhost`
- [ ] `ENVIRONMENT=production` and `DEBUG=false`
- [ ] `DATABASE_URL` points to managed PostgreSQL (not SQLite)
- [ ] `NEXT_PUBLIC_API_URL` points to the deployed backend
- [ ] `alembic upgrade head` runs successfully against the production database before server start
- [ ] Health check passes at `/api/v1/health`
- [ ] Full auth flow tested on production (register → onboard → generate plan)

---

## Connection pool notes

`session.py` configures PostgreSQL-specific pool settings when `DATABASE_URL` starts with `postgresql`:

| Setting | Value | Why |
|---|---|---|
| `pool_size` | 5 | Sufficient for a small deployment |
| `max_overflow` | 10 | Allows burst traffic |
| `pool_pre_ping` | True | Reconnects stale connections — prevents errors after database idles (common on free-tier Render/Railway) |
| `pool_recycle` | 300s | Recycles connections every 5 minutes |

Adjust these in `app/db/session.py` if you're running under higher concurrency or behind PgBouncer.
