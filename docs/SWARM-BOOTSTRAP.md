# Docker Swarm — First-Deploy Bootstrap Guide

This guide covers the **one-off database population jobs** and **infrastructure scheduling** for Hushnav on Docker Swarm.

**Design principles:**

- Schema is applied **manually** (pgAdmin preferred) — Postgres does not auto-run `schema.sql`
- Bootstrap jobs run as **one-off containers** that exit when complete
- The weekly forecast is scheduled via **Swarm cronjob** (`forecast-job`), not supercronic or a long-running container
- Live data jobs (noise, crowd, construction, cleanup) run inside the **backend** via node-cron

For local Compose development, see [DOCKER.md](../DOCKER.md).

## Overview

```mermaid
flowchart TD
  deploy[Deploy stack: postgres backend frontend forecast-job]
  schema[Step 1: Apply schema.sql in pgAdmin]
  graph[Step 2: Graph import one-off]
  quiet[Step 3: Quiet places one-off]
  forecastOpt[Step 4 optional: One-off forecast]
  ready[App fully usable]

  deploy --> schema
  schema --> graph
  graph --> quiet
  quiet --> forecastOpt
  forecastOpt --> ready
```

| Step | Job | Frequency | Required? |
|------|-----|-----------|-----------|
| 1 | Apply `schema.sql` | Once per fresh Postgres volume | Yes |
| 2 | Graph import | Once per fresh DB | Yes |
| 3 | Quiet places import | Once per fresh DB | Yes |
| 4 | One-off forecast | Optional before first Monday | Recommended |

## What runs automatically (no manual step)

| Job | How | Schedule |
|-----|-----|----------|
| Edge cost pipeline | node-cron in `backend` | Every 5 minutes |
| Construction pipeline | node-cron in `backend` | Every 5 minutes |
| Noise report cleanup | node-cron in `backend` | Every 5 minutes |
| Weekly forecast | Swarm cron on `forecast-job` | Monday 00:00 UTC |

See [swarm-stack.example.yml](swarm-stack.example.yml) for the `forecast-job` service definition.

---

## Prerequisites

1. Stack deployed and Postgres healthy:
   ```bash
   docker service ps hushnav_postgres
   ```

2. [`schema.sql`](../schema.sql) available locally for copy-paste into pgAdmin.

3. Overlay network name (if stack is `hushnav` with network `hushnav`):
   ```bash
   docker network ls | grep hushnav
   # typically: hushnav_hushnav
   ```

4. Set variables (adjust to match your stack):
   ```bash
   export IMAGE_TAG=dockerise-d08ec3e
   export DATABASE_URL='postgresql://postgres:hushnav123@postgres:5432/postgres?sslmode=disable'
   export NETWORK=hushnav_hushnav
   ```

---

## Step 1 — Apply database schema (pgAdmin)

**Required once** when the Postgres data volume is new.

### pgAdmin (preferred)

1. In pgAdmin, register your Postgres server (host, port, user, password from your stack).
2. Connect to the target database (e.g. `postgres`).
3. Right-click the database → **Query Tool**.
4. Open [`schema.sql`](../schema.sql) in a text editor, copy the entire file, paste into Query Tool.
5. Click **Execute** (F5).

### Alternative: psql via temporary container

```bash
docker run --rm -i \
  --network "$NETWORK" \
  -v "$(pwd)/schema.sql:/schema.sql:ro" \
  postgres:17 \
  psql "$DATABASE_URL" -f /schema.sql
```

### Verify

```bash
docker run --rm --network "$NETWORK" postgres:17 \
  psql "$DATABASE_URL" -c "\dt"
```

You should see tables including `node`, `edge`, `safe_space`, `edge_weight`, `forecast_runs`.

---

## Step 2 — Graph import

**Required once** per fresh database. Downloads the City of Melbourne walk network and loads `node` and `edge`.

```bash
docker service create \
  --name hushnav-bootstrap-graph \
  --network "$NETWORK" \
  --env DATABASE_URL="$DATABASE_URL" \
  --restart-condition none \
  ghcr.io/cassandra-l/hushnav-import:${IMAGE_TAG}

docker service logs -f hushnav-bootstrap-graph
docker service rm hushnav-bootstrap-graph
```

Verify:

```bash
docker run --rm --network "$NETWORK" postgres:17 \
  psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM node; SELECT COUNT(*) FROM edge;"
```

Newer import images skip automatically if `node` already has rows. Re-running on a populated DB without the idempotent entrypoint will append duplicates.

---

## Step 3 — Quiet places import

**Required once** per fresh database. Loads Melbourne landmarks into `safe_space`.

```bash
docker service create \
  --name hushnav-bootstrap-quiet-places \
  --network "$NETWORK" \
  --env DATABASE_URL="$DATABASE_URL" \
  --restart-condition none \
  --entrypoint node \
  ghcr.io/cassandra-l/hushnav-backend:${IMAGE_TAG} \
  dist/bootstrap/quietPlaces.js

docker service logs -f hushnav-bootstrap-quiet-places
docker service rm hushnav-bootstrap-quiet-places
```

Verify:

```bash
docker run --rm --network "$NETWORK" postgres:17 \
  psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM safe_space;"
```

---

## Step 4 — Optional: one-off forecast before Monday

Your `forecast-job` Swarm cron runs every Monday 00:00 UTC. For immediate forecast-mode routing, run the forecast image once (it exits when done):

```bash
docker service create \
  --name hushnav-bootstrap-forecast \
  --network "$NETWORK" \
  --env DATABASE_URL="$DATABASE_URL" \
  --env DATABASE_SSLMODE=disable \
  --env FORECAST_HISTORY_DAYS=28 \
  --restart-condition none \
  ghcr.io/cassandra-l/hushnav-forecast:${IMAGE_TAG}

docker service logs -f hushnav-bootstrap-forecast
docker service rm hushnav-bootstrap-forecast
```

---

## Swarm cron: weekly forecast job

Add this to your stack file (see [swarm-stack.example.yml](swarm-stack.example.yml)). The service stays at `replicas: 0` until the Swarm cron plugin triggers it:

```yaml
forecast-job:
  image: ghcr.io/cassandra-l/hushnav-forecast:${IMAGE_TAG}
  networks:
    - hushnav
  environment:
    DATABASE_URL: postgresql://postgres:PASSWORD@postgres:5432/postgres?sslmode=disable
    DATABASE_SSLMODE: disable
    FORECAST_HISTORY_DAYS: 28
    PEDESTRIAN_HISTORY_SOURCE: hourly
  deploy:
    mode: replicated
    replicas: 0
    restart_policy:
      condition: none
    labels:
      - swarm.cronjob.enable=true
      - swarm.cronjob.schedule=0 0 * * 1
      - swarm.cronjob.skip-running=false
```

The forecast image runs `python forecast_edge_weights.py` and exits — no supercronic or long-running scheduler needed.

---

## Quick reference

```bash
export IMAGE_TAG=your-tag
export DATABASE_URL='postgresql://postgres:PASSWORD@postgres:5432/postgres?sslmode=disable'
export NETWORK=hushnav_hushnav

# 1. Schema — apply schema.sql in pgAdmin Query Tool

# 2. Graph import
docker service create --name hushnav-bootstrap-graph \
  --network "$NETWORK" --env DATABASE_URL="$DATABASE_URL" \
  --restart-condition none ghcr.io/cassandra-l/hushnav-import:${IMAGE_TAG}
docker service logs -f hushnav-bootstrap-graph && docker service rm hushnav-bootstrap-graph

# 3. Quiet places
docker service create --name hushnav-bootstrap-quiet-places \
  --network "$NETWORK" --env DATABASE_URL="$DATABASE_URL" \
  --restart-condition none --entrypoint node \
  ghcr.io/cassandra-l/hushnav-backend:${IMAGE_TAG} dist/bootstrap/quietPlaces.js
docker service logs -f hushnav-bootstrap-quiet-places && docker service rm hushnav-bootstrap-quiet-places

# 4. Optional forecast
docker service create --name hushnav-bootstrap-forecast \
  --network "$NETWORK" --env DATABASE_URL="$DATABASE_URL" \
  --env DATABASE_SSLMODE=disable --env FORECAST_HISTORY_DAYS=28 \
  --restart-condition none ghcr.io/cassandra-l/hushnav-forecast:${IMAGE_TAG}
docker service logs -f hushnav-bootstrap-forecast && docker service rm hushnav-bootstrap-forecast
```

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| `relation "node" does not exist` | Schema not applied | Step 1 in pgAdmin |
| Graph import hangs | OSMnx downloading data | Wait; check service logs |
| Forecast fails | No graph data | Complete Step 2 first |
| Forecast SSL error | Wrong sslmode | Set `DATABASE_SSLMODE=disable` |
| Duplicate nodes/edges | Re-ran import on populated DB | Truncate tables first, or use newer import image |
| No safe spaces in API | Step 3 not run | Run quiet places import |
