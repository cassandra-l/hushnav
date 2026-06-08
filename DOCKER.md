# Hushnav Docker Deployment

This document describes how to build and run the Hushnav application using Docker and Docker Compose.

## Overview

The Hushnav application is containerized into 3 services:

1. **Frontend** (NGINX) - Serves the React/Vite SPA on port 80
2. **Backend** (Node.js Express) - Provides REST API endpoints on port 3000
3. **PostgreSQL** - Database with PostGIS extension on port 5432 (internal)

All services communicate over a shared Docker bridge network and are orchestrated using Docker Compose.

## Prerequisites

- Docker Engine 24.0 or higher
- Docker Compose 2.20 or higher

## Quick Start

### 1. Create Environment File

Copy the example environment file and customize it:

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:
- `POSTGRES_PASSWORD`: A secure password for the PostgreSQL database
- `MAPBOX_TOKEN`: Your Mapbox API key for geocoding functionality

Example `.env`:
```
POSTGRES_DB=hushnav
POSTGRES_USER=hushnav
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_PORT=5432
NODE_ENV=production
MAPBOX_TOKEN=your_mapbox_api_key
SKIP_NOISE_FETCH=false
SKIP_CROWD_FETCH=false
CROWD_MODE=incremental
BACKEND_PORT=3000
FRONTEND_PORT=80
VITE_API_BASE_URL=http://backend:3000
```

### 2. Build Images

```bash
docker-compose build
```

This will:
- Build the backend image from `backend/Dockerfile`
- Build the frontend image from `Dockerfile.frontend`
- Use pre-built `postgis/postgis:17-3.4` image for PostgreSQL

### 3. Start Services

```bash
docker-compose up -d
```

The `-d` flag runs services in the background (detached mode).

### 4. Verify Services

Check if all services are running:

```bash
docker-compose ps
```

You should see 3 containers with status "Up":
```
NAME                 STATUS
hushnav-frontend     Up (healthy)
hushnav-backend      Up (healthy)
hushnav-postgres     Up (healthy)
```

### 5. Access the Application

- **Frontend**: http://localhost (or http://localhost:80)
- **API Health**: http://localhost:3000/api/health
- **API Base URL** (from frontend): http://backend:3000

## Common Commands

### View Logs

View logs from all services:
```bash
docker-compose logs -f
```

View logs from a specific service:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop Services

```bash
docker-compose stop
```

### Restart Services

```bash
docker-compose restart
```

### Down: Stop and Remove Containers

```bash
docker-compose down
```

Note: This removes containers but preserves the `postgres_data` volume.

### Remove All Data (including database)

```bash
docker-compose down -v
```

## Accessing PostgreSQL

Connect to the PostgreSQL database from the host:

```bash
psql -h localhost -U hushnav -d hushnav
```

Or use a GUI tool like pgAdmin or DBeaver with connection details:
- Host: `localhost`
- Port: `5432`
- Database: `hushnav`
- User: `hushnav`
- Password: (from `.env` POSTGRES_PASSWORD)

### Apply schema to a self-hosted database

For a fresh Postgres/PostGIS instance (local Docker applies this automatically on first start):

```bash
psql "$DATABASE_URL" -f schema.sql
```

## Architecture

### Frontend Container

- **Image**: Vite + React/TypeScript built into static files, served by NGINX
- **Port**: 80 (HTTP inside container)
- **SPA Routing**: NGINX configured to serve `index.html` for all non-file requests
- **Asset Caching**: 1-year cache for versioned assets
- **Environment**: `VITE_API_BASE_URL=http://backend:3000` (injected at build time)

### Backend Container

- **Image**: Node.js 20 Alpine with Express.js server
- **Port**: 3000 (HTTP inside container)
- **Services**:
  - `POST /api/plan-route` - Route planning with noise/crowd avoidance
  - `GET /api/noise-map` - High-noise areas as GeoJSON
  - `GET /api/safe-spaces` - Quiet spaces near routes
  - `GET /api/noise-reports` - User-submitted noise incident reports
  - `POST /api/noise-reports` - Create new noise report
  - `GET /api/geocode-suggestions` - Location name autocomplete
  - `GET /api/health` - Health check
- **Scheduled Jobs** (node-cron):
  - Every 5 minutes: Update edge weights (noise + crowd data)
  - Every 5 minutes: Update construction blockages
  - Every 5 minutes: Clean up expired noise reports (30-min TTL)
- **Environment Variables**:
  - `DATABASE_URL`: Connection string to PostgreSQL
  - `MAPBOX_TOKEN`: API key for geocoding
  - `NODE_ENV`: `production` or `development`
  - Other optional config flags

### PostgreSQL Container

- **Image**: PostGIS 3.4 (PostgreSQL 17 + spatial extensions)
- **Port**: 5432 (internal to network, not exposed by default)
- **Initialization**: Runs `schema.sql` on first start
- **Volume**: `postgres_data` - persists database across container restarts
- **Schema**: Includes tables for nodes, edges, sensors, noise reports, safe spaces, and forecast data

## Environment Variables Reference

See `.env.example` for all available options:

### Backend
- `DATABASE_URL` - PostgreSQL connection string (auto-generated from POSTGRES_* vars)
- `NODE_ENV` - `production` or `development`
- `MAPBOX_TOKEN` - Required for geocoding functionality
- `SKIP_NOISE_FETCH` - Set to `true` to disable live noise data fetching
- `SKIP_CROWD_FETCH` - Set to `true` to disable live pedestrian count fetching
- `CROWD_MODE` - `incremental` (default) or `full`

### Frontend
- `VITE_API_BASE_URL` - Base URL for API calls (injected at build time)

### Database
- `POSTGRES_DB` - Database name
- `POSTGRES_USER` - Database user
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_PORT` - Port (internal: 5432, exposed port configurable)

## Storage & Persistence

### Volumes

- `postgres_data` - Where PostgreSQL stores all database files
  - Location on host: Docker's default volume storage
  - Persists across container restarts and down events
  - Removed only with `docker-compose down -v`

### Backup

To backup the database:
```bash
docker-compose exec postgres pg_dump -U hushnav -d hushnav > backup.sql
```

To restore from backup:
```bash
docker-compose exec -T postgres psql -U hushnav -d hushnav < backup.sql
```

## Network

All containers communicate over the `hushnav-net` bridge network:
- Frontend can reach backend at `http://backend:3000`
- Backend can reach database at `postgres:5432`
- Only FRONTEND (port 80) and BACKEND (port 3000) are exposed to the host by default
- PostgreSQL is internal-only (port 5432 mapped to host per `.env` POSTGRES_PORT)

## Development

### Local Development without Docker

To run locally during development (without Docker):

1. Ensure PostgreSQL is running on localhost:5432
2. Set environment variables:
   ```bash
   export DATABASE_URL="postgresql://hushnav:password@localhost:5432/hushnav"
   export MAPBOX_TOKEN="your_token"
   export VITE_API_BASE_URL="http://localhost:3000"
   ```

3. Run frontend dev server:
   ```bash
   npm run dev
   ```

4. In another terminal, run backend:
   ```bash
   npm run dev:backend
   ```

### Modifying Images

If you change source code:

**Backend changes**: 
```bash
docker-compose build backend
docker-compose up -d backend
```

**Frontend changes**:
```bash
docker-compose build frontend
docker-compose up -d frontend
```

## Troubleshooting

### Container won't start

Check logs:
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Database connection errors

Ensure `DATABASE_URL` is correctly formatted and PostgreSQL is healthy:
```bash
docker-compose ps postgres
docker-compose logs postgres
```

### API calls from frontend fail

Verify `VITE_API_BASE_URL` is set correctly (should be `http://backend:3000` inside Docker).

### PostgreSQL permission denied

Regenerate the database:
```bash
docker-compose down -v
docker-compose up -d postgres
```

## Production Considerations

1. **Secrets Management**: Use environment files or secrets managers (not `.env` in git)
2. **SSL/TLS**: Configure SSL certificates in external reverse proxy, not in containers
3. **Database Backups**: Implement automated backup strategy to external storage
4. **Resource Limits**: In docker-compose, add `limits` and `reservations` for memory/CPU
5. **Logging**: Consider Docker logging drivers (syslog, JSON-file, etc.) for aggregation
6. **Monitoring**: Add health check endpoints and monitoring tools
7. **Network**: Ensure only frontend is publicly exposed; database and backend internal

## Additional Resources

- Docker Compose documentation: https://docs.docker.com/compose/
- PostGIS documentation: https://postgis.net/documentation/
- Express.js documentation: http://expressjs.com/
- NGINX documentation: http://nginx.org/en/docs/
- Vite documentation: https://vitejs.dev/
