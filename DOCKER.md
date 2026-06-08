# Hushnav Docker Deployment

This document describes how to build, run, and deploy the Hushnav application with Docker Compose and Docker Swarm.

## Overview

### Long-running services (`docker compose up -d`)

| Service | Purpose |
|---------|---------|
| `postgres` | PostGIS database (empty on first start — schema applied manually) |
| `backend` | REST API + scheduled JS jobs (noise, crowd, construction, cleanup) |
| `frontend` | React SPA served by NGINX |

### Manual bootstrap (once per fresh database)

| Step | How | Purpose |
|------|-----|---------|
| 1. Schema | pgAdmin or `psql` — paste [`schema.sql`](schema.sql) | Create tables |
| 2. Graph import | `docker compose --profile bootstrap run --rm graph-import` | Load `node` / `edge` |
| 3. Quiet places | `docker compose --profile bootstrap run --rm quiet-places-import` | Load `safe_space` |

Bootstrap services use the `bootstrap` profile and are **not** started by `docker compose up -d`.

### Scheduled jobs

| Job | Where | Schedule |
|-----|-------|----------|
| Edge cost pipeline | `backend` (node-cron) | Every 5 minutes |
| Construction pipeline | `backend` (node-cron) | Every 5 minutes |
| Noise report cleanup | `backend` (node-cron) | Every 5 minutes |
| Weekly forecast | Swarm cron (`forecast-job`) | Monday 00:00 UTC |

The forecast image is a run-to-completion container — it is **not** a long-running service. Schedule it at the infrastructure layer (Docker Swarm cronjob). See [docs/SWARM-BOOTSTRAP.md](docs/SWARM-BOOTSTRAP.md) and [docs/swarm-stack.example.yml](docs/swarm-stack.example.yml).

## Prerequisites

- Docker Engine 24.0 or higher
- Docker Compose 2.20 or higher
- For production images: access to GitHub Container Registry (`ghcr.io`)

## Quick Start (local development)

### 1. Create environment file

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

- `POSTGRES_PASSWORD` — database password
- `MAPBOX_TOKEN` — Mapbox API key for geocoding
- `TRANSPORT_VIC_API_KEY` — Transport Victoria API key for construction data

### 2. Start Postgres

```bash
docker compose up -d postgres
```

Wait until healthy:

```bash
docker compose ps postgres
```

### 3. Apply schema manually

**Option A — pgAdmin (preferred):**

1. Connect pgAdmin to `localhost:5432` (user/password from `.env`)
2. Open Query Tool on your database
3. Open [`schema.sql`](schema.sql), paste the full contents, and execute

**Option B — psql:**

```bash
psql "postgresql://hushnav:your_password@localhost:5432/hushnav?sslmode=disable" -f schema.sql
```

### 4. Run bootstrap jobs (once per fresh DB)

```bash
docker compose --profile bootstrap run --rm graph-import
docker compose --profile bootstrap run --rm quiet-places-import
```

Both jobs are idempotent — they skip automatically if data already exists.

### 5. Start the application

```bash
docker compose up -d backend frontend
```

### 6. Verify

```bash
docker compose ps
```

Expected running services: `postgres`, `backend`, `frontend`.

- Frontend: http://localhost
- API health: http://localhost:3000/api/health

## Scheduled and background jobs

### Inside the backend container (automatic)

Configured in [`backend/src/scheduler.ts`](backend/src/scheduler.ts), started when the backend server starts:

| Job | Schedule | What it does |
|-----|----------|--------------|
| Edge cost pipeline | Every 5 min | Fetches live noise + pedestrian data, updates `edge_weight` |
| Construction pipeline | Every 5 min | Fetches Transport Vic disruptions, updates blocked edges |
| Noise report cleanup | Every 5 min | Deletes `noise_report` rows older than 30 minutes |

### Weekly forecast (infrastructure-scheduled)

The forecast image runs once and exits. On Docker Swarm, schedule it with a cronjob service (`replicas: 0`, `swarm.cronjob.*` labels). See [docs/swarm-stack.example.yml](docs/swarm-stack.example.yml).

Run a one-off forecast manually (local):

```bash
docker build -t hushnav-forecast -f database_schema_dataimports/Dockerfile.forecast database_schema_dataimports
docker run --rm --network hushnav_hushnav-net \
  -e DATABASE_URL="postgresql://hushnav:password@postgres:5432/hushnav?sslmode=disable" \
  -e DATABASE_SSLMODE=disable \
  -e FORECAST_HISTORY_DAYS=28 \
  hushnav-forecast
```

Or use a pre-built image from GHCR with the same `docker run` pattern.

## Environment variables

See [`.env.example`](.env.example) for the full list.

### Shared database connection

```
postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?sslmode=disable
```

| Variable | Used by | Required | Description |
|----------|---------|----------|-------------|
| `POSTGRES_DB` | postgres | yes | Database name |
| `POSTGRES_USER` | postgres | yes | Database user |
| `POSTGRES_PASSWORD` | postgres | yes | Database password |
| `POSTGRES_PORT` | postgres | no | Host port mapping (default `5432`) |
| `DATABASE_SSLMODE` | forecast job | no | Postgres SSL mode (default `disable`) |

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `MAPBOX_TOKEN` | yes | Geocoding API key |
| `TRANSPORT_VIC_API_KEY` | yes | Construction disruption API key |
| `SKIP_NOISE_FETCH` | no | Set `true` to skip live noise fetch |
| `SKIP_CROWD_FETCH` | no | Set `true` to skip live crowd fetch |
| `CROWD_MODE` | no | `incremental` (default) or `full` |

### Forecast job

| Variable | Required | Description |
|----------|----------|-------------|
| `FORECAST_HISTORY_DAYS` | no | Days of history to fetch (default `28`) |
| `PEDESTRIAN_HISTORY_SOURCE` | no | `hourly` (default) or other source |

### Production images (`docker-compose.prod.yml`)

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_OWNER` | yes | GitHub org/user owning the images |
| `GITHUB_REPO` | yes | Repository name |
| `IMAGE_TAG` | no | Image tag (default `latest`) |

## Production deployment with Docker Compose

```bash
cp .env.example .env
docker login ghcr.io -u <github-username> -p <github-token>
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d postgres

# Apply schema (pgAdmin or psql), then bootstrap:
docker compose -f docker-compose.prod.yml --profile bootstrap run --rm graph-import
docker compose -f docker-compose.prod.yml --profile bootstrap run --rm quiet-places-import

docker compose -f docker-compose.prod.yml up -d backend frontend
```

## Production deployment with Docker Swarm

> **First-deploy bootstrap:** See [docs/SWARM-BOOTSTRAP.md](docs/SWARM-BOOTSTRAP.md) for schema (pgAdmin), graph import, and quiet places steps.
>
> **Stack reference:** See [docs/swarm-stack.example.yml](docs/swarm-stack.example.yml) for a complete Swarm stack including the `forecast-job` cronjob.

Swarm does not support Compose bootstrap profiles on `docker stack deploy`. Run bootstrap jobs manually with `docker service create` (documented in SWARM-BOOTSTRAP.md), then deploy the long-running stack.

### What you may need to run manually

| Situation | Action |
|-----------|--------|
| Fresh database | Apply `schema.sql` in pgAdmin, then run graph + quiet places bootstrap |
| First forecast before Monday cron | One-off forecast container (see SWARM-BOOTSTRAP.md Step 4) |
| Re-import graph | Truncate `node`/`edge`, re-run graph import |
| Refresh safe spaces | Truncate `safe_space`, re-run quiet places import |

## Common commands

```bash
docker compose logs -f backend
docker compose down
docker compose down -v   # wipes DB volume — re-run schema + bootstrap after
```

## Database access

```bash
psql -h localhost -U hushnav -d hushnav
```

Backup / restore:

```bash
docker compose exec postgres pg_dump -U hushnav -d hushnav > backup.sql
docker compose exec -T postgres psql -U hushnav -d hushnav < backup.sql
```

## Architecture notes

### Bootstrap idempotency

- **graph-import** — skips if `node` table already has rows
- **quiet-places-import** — skips if `safe_space` already has rows

### SSL

Self-hosted Postgres uses `sslmode=disable`. The forecast job reads `DATABASE_SSLMODE` (default `disable`).

## Troubleshooting

### Backend won't start — `TRANSPORT_VIC_API_KEY is not set`

Set `TRANSPORT_VIC_API_KEY` in `.env`.

### `relation "node" does not exist`

Schema not applied. Run Step 3 (apply `schema.sql` via pgAdmin or psql).

### Bootstrap container failed

```bash
docker compose --profile bootstrap run --rm graph-import
```

Common causes: Postgres not healthy, schema not applied, OSMnx download timeout.

### Forecast connection errors

Ensure `DATABASE_SSLMODE=disable` and graph import completed successfully.

## Additional resources

- [docs/SWARM-BOOTSTRAP.md](docs/SWARM-BOOTSTRAP.md) — Swarm first-deploy guide
- [docs/swarm-stack.example.yml](docs/swarm-stack.example.yml) — reference Swarm stack
- [Docker Compose docs](https://docs.docker.com/compose/)
- [Docker Swarm docs](https://docs.docker.com/engine/swarm/)
