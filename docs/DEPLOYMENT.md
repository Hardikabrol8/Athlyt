# Athlyt — Deployment Guide

## Architecture

```
Vercel (frontend)  ←→  Render / Railway (backend API)  ←→  PostgreSQL (managed)
```

Both tiers are stateless. The only stateful component is the database.

---

## Backend — Render / Railway / Fly.io

### Environment variables (required)

| Variable | Description | Example |
|---|---|---|
| `JWT_SECRET_KEY` | Min 32-char random string. Generate: `python -c "import secrets; print(secrets.token_urlsafe(48))"` | `abc123...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg2://user:pass@host:5432/athlyt` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `https://athlyt.vercel.app` |
| `ENVIRONMENT` | `production` | `production` |
| `DEBUG` | `false` | `false` |

### Build command
```bash
pip install -e .
```

### Start command
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### PostgreSQL migration (SQLite → Postgres)

1. Install psycopg2: `pip install psycopg2-binary`
2. Set `DATABASE_URL=postgresql+psycopg2://...` in `.env`
3. The schema creates itself on first boot (`Base.metadata.create_all()` in lifespan)
4. Seed data re-runs automatically and is idempotent
5. **Before first real user data**: add Alembic for proper migrations

### Render-specific notes
- Set `PORT` is provided automatically by Render; uvicorn reads it via `$PORT`
- Add a health check on `/api/v1/health` with 30s interval, 3 retries

### Fly.io-specific notes
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
```

---

## Frontend — Vercel

### Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL, e.g. `https://athlyt-api.onrender.com/api/v1` |

### Deploy settings (auto-detected)
- **Framework**: Next.js
- **Build command**: `npm run build`
- **Output directory**: `.next`
- **Install command**: `npm install`

### Notes
- `reactStrictMode: true` is set in `next.config.ts`
- Security headers are configured in `next.config.ts`
- No server components or API routes — purely static + client-side after first load

---

## Pre-deployment checklist

- [ ] `JWT_SECRET_KEY` is a cryptographically random string ≥ 32 chars (never committed)
- [ ] `CORS_ORIGINS` contains only your Vercel domain, not `localhost`
- [ ] `ENVIRONMENT=production` and `DEBUG=false`
- [ ] `DATABASE_URL` points to managed PostgreSQL (not SQLite)
- [ ] `NEXT_PUBLIC_API_URL` points to the deployed backend
- [ ] Health check passes at `/api/v1/health`
- [ ] Test the full auth flow (register → onboard → generate plan) on production

---

## Adding Alembic (before first real user data)

```bash
cd backend
pip install alembic
alembic init alembic

# Edit alembic/env.py — replace target_metadata line:
from app.db.base import Base
target_metadata = Base.metadata

# Generate first migration from existing models:
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

Then replace `Base.metadata.create_all()` in `app/main.py` with:
```python
# Don't use create_all in production — Alembic handles this
if settings.ENVIRONMENT == "local":
    Base.metadata.create_all(bind=engine)
```

---

## Scaling notes (for interview discussions)

- **Backend**: horizontal scaling is safe (stateless, no in-process caches). SQLAlchemy's connection pool handles concurrent requests.
- **Database**: PostgreSQL's connection pooling (PgBouncer) recommended if running many backend instances.
- **ML inference**: currently loaded at process startup (`joblib.load`). Move to a separate worker or cache warming if cold starts become an issue.
- **Media storage**: progress photos would go to S3/Cloudflare R2 — not implemented yet, but the pattern is `progress_photos` table with `photo_url` pointing to object storage, not the blob itself.
