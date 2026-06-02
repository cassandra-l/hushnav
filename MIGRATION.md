# Hushnav Migration to Docker

## Overview

The Hushnav application has been successfully containerized and migrated away from AWS Amplify to a self-contained Docker setup. This document summarizes the changes made and the new architecture.

## What Changed

### Architecture Changes

**Before (AWS Amplify):**
- Frontend: SPA hosted on AWS Amplify
- Backend: 7 Lambda functions deployed via Amplify
- Database: AWS RDS PostgreSQL with PostGIS
- Authentication: AWS Cognito (not used in production)
- GraphQL: AppSync (not used in production)
- Scheduled jobs: EventBridge

**After (Docker):**
- Frontend: React/Vite SPA served by NGINX container
- Backend: Node.js/Express server in a container
- Database: PostgreSQL with PostGIS in a container
- Scheduled jobs: node-cron running in the backend container
- Orchestration: Docker Compose on VPS or any Docker-capable host

### New Directory Structure

```
hushnav/
├── backend/                          # New: Backend service
│   ├── src/
│   │   ├── server.ts                 # Express app entry point
│   │   ├── db.ts                     # PostgreSQL connection pool
│   │   ├── scheduler.ts              # Scheduled jobs via node-cron
│   │   ├── services/                 # Core business logic (copied from amplify/navigation)
│   │   ├── spatialData/              # Spatial data handlers (copied from amplify/spatialData)
│   │   ├── edgeCost/                 # Edge weight pipeline (copied from amplify/edgeCost)
│   │   ├── construction/             # Construction data pipeline (copied from amplify/construction)
│   │   └── functions/                # Lambda function wrappers (copied from amplify/functions)
│   ├── Dockerfile                    # Multi-stage build for backend
│   ├── package.json                  # Backend dependencies only
│   ├── tsconfig.json                 # TypeScript config
│   └── .dockerignore
│
├── nginx/                            # New: Web server config
│   └── nginx.conf                    # SPA routing and static file serving
│
├── docker/                           # New: Docker-related files
│   └── init-db/
│       └── 01-schema.sql            # Database schema initialization
│
├── Dockerfile.frontend               # Multi-stage build for frontend
├── docker-compose.yml                # Service orchestration
├── .env.example                      # Environment variables template
├── DOCKER.md                         # New: Docker deployment guide
├── MIGRATION.md                      # New: This file - migration guide
│
├── src/                              # Frontend sources (unchanged)
├── public/                           # Frontend assets (unchanged)
├── database_schema_dataimports/      # Original DB schema (reference)
├── amplify/                          # Original Amplify config (kept for reference)
└── ...                               # Other files unchanged
```

## Key File Changes

### Backend Service Files

**New files:**
- `backend/src/server.ts` - Main Express application with all REST endpoints
- `backend/src/db.ts` - PostgreSQL connection management
- `backend/src/scheduler.ts` - Background job scheduler using node-cron
- `backend/Dockerfile` - Multi-stage Node.js build
- `backend/package.json` - Backend dependencies (express, pg, node-cron, etc.)
- `backend/tsconfig.json` - TypeScript configuration

**Copied and refactored from amplify/:
- All files from `amplify/navigation/` → `backend/src/services/`
- All files from `amplify/spatialData/` → `backend/src/spatialData/`
- All files from `amplify/edgeCost/` → `backend/src/edgeCost/` (function exports refactored)
- All files from `amplify/construction/` → `backend/src/construction/`
- All files from `amplify/functions/` → `backend/src/functions/`

**Database connection changes:**
- Changed from Amplify's managed RDS to direct PostgreSQL connection string
- Connection pooling via `pg.Pool` (already in place, just adapted)

### Frontend Changes

**Minimal changes required:**
- `Dockerfile.frontend` - Multi-stage build for Vite + NGINX
- Environment variable `VITE_API_BASE_URL` now set via Docker build args
- React code uses existing `import.meta.env.VITE_API_BASE_URL` (already correct)

### Docker & Orchestration

**New files:**
- `docker-compose.yml` - Orchestrates 3 services (frontend, backend, postgres)
- `Dockerfile.frontend` - Frontend build & NGINX serving
- `backend/Dockerfile` - Backend build & Node.js runtime
- `nginx/nginx.conf` - NGINX configuration for SPA routing
- `docker/init-db/01-schema.sql` - Database schema initialization
- `.env.example` - Environment variable template
- `DOCKER.md` - Deployment and usage documentation
- `.dockerignore` - Excluded files for Docker builds

## Migration Details

### 1. Backend Refactoring

The original Lambda functions in `amplify/functions/` were thin wrappers around core logic in `amplify/navigation/`, `amplify/spatialData/`, etc.

For Docker deployment:
- Copied all core business logic to `backend/src/`
- Updated all imports to use relative paths within backend
- Changes made to exports:
  - `amplify/edgeCost/runEdgeCostPipeline.ts`: Refactored to export `runEdgeCostPipeline()` function
  - `amplify/construction/runConstructionPipeline.ts`: Already exported properly
  - `amplify/spatialData/noiseReports.ts`: Added `cleanupNoiseReports()` wrapper export

### 2. Database Connection

**Before:**
```typescript
// amplify/navigation/db.ts
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
```

**After:**
```typescript
// backend/src/db.ts
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});
```

The database connection code remained essentially the same - just reorganized and placed at the backend root.

### 3. Express Server Implementation

**New `backend/src/server.ts`:**
- Sets up Express application
- Registers all REST endpoints (POST /api/plan-route, GET /api/noise-map, etc.)
- Initializes database connection pool
- Starts scheduler for background jobs
- Implements health checks
- Graceful shutdown handling

### 4. Scheduler Migration

**Before (AWS EventBridge):**
- Separate Lambda functions triggered on 5-minute schedules

**After (node-cron):**
```typescript
// backend/src/scheduler.ts
- 3 scheduled jobs using node-cron
- All run within the backend container
- Started on server boot
- Stopped on graceful shutdown
```

Jobs run every 5 minutes:
1. `edgeCostPipeline` - Updates noise/crowd edge weights
2. `constructionPipeline` - Refreshes construction blockages
3. `noiseReportsCleanup` - Deletes reports older than 30 minutes

### 5. Database Initialization

**Before:** AWS RDS initialization via Amplify

**After:** Docker entrypoint initialization
```sql
-- docker/init-db/01-schema.sql
-- Automatically runs when PostgreSQL container starts
-- Creates all tables, indexes, and enables PostGIS extension
```

## Removed AWS Dependencies

The following AWS Amplify packages have been removed from backend dependencies:

- `@aws-amplify/backend`
- `@aws-amplify/backend-cli`
- `@aws-amplify/ui-react`
- `aws-amplify`

All AWS-specific configuration and infrastructure as code have been removed. The application now uses only standard open-source and vendor-agnostic technologies.

## New Dependencies

### Backend
```json
{
  "express": "^5.2.1",
  "pg": "^8.20.0",
  "cors": "^2.8.6",
  "dotenv": "^17.4.1",
  "node-cron": "^3.0.3",
  "axios": "^1.14.0"
}
```

### Frontend
- No new dependencies; existing dependencies already support environment injection

## Unchanged Business Logic

The following core algorithms and logic remain completely unchanged:

- **Dijkstra's routing algorithm** (`services/planRoute.ts`)
- **Edge weighting calculations** (`edgeCost/updateEdgeWeights.ts`)
- **Safe space proximity queries** (`services/safeSpaces.ts`)
- **Noise/crowd data integration** (`edgeCost/fetchNoise.ts`, `fetchCrowd.ts`)
- **Noise report management** (`spatialData/noiseReports.ts`)
- **Geocoding** (`functions/geocode-suggestions/handler.ts`)

Only the deployment infrastructure changed; business logic is identical.

## Environment Variables

### Docker Compose Configuration

The `docker-compose.yml` file reads from `.env` file. Key variables:

```env
# Database
POSTGRES_DB=hushnav
POSTGRES_USER=hushnav
POSTGRES_PASSWORD=<secure-password>

# Backend
NODE_ENV=production
MAPBOX_TOKEN=<your-mapbox-key>
SKIP_NOISE_FETCH=false
SKIP_CROWD_FETCH=false
CROWD_MODE=incremental

# Frontend
VITE_API_BASE_URL=http://backend:3000

# Service Ports
FRONTEND_PORT=80
BACKEND_PORT=3000
POSTGRES_PORT=5432
```

## Running the Application

### Build
```bash
docker-compose build
```

### Start
```bash
docker-compose up -d
```

### Access
- Frontend: http://localhost (port 80)
- Backend API: http://localhost:3000
- API from frontend internally: http://backend:3000 (Docker network resolution)

### Stop
```bash
docker-compose down
```

## Differences from AWS

| Aspect | AWS Amplify | Docker |
|--------|------------|--------|
| Frontend hosting | AWS S3 + CloudFront | NGINX container |
| Backend compute | Lambda functions | Express container |
| Database | AWS RDS | PostgreSQL container |
| Scheduled jobs | EventBridge | node-cron |
| Networking | API Gateway | Direct HTTP |
| Secrets | AWS Secrets Manager | Environment variables (.env) |
| Scaling | Auto-scaling groups | Manual docker-compose scaling |
| Monitoring | CloudWatch | Container logs |
| CI/CD | Amplify CLI | Docker build steps |

## Backward Compatibility

### API Endpoints
All REST endpoints remain identical:
- `POST /api/plan-route`
- `GET /api/noise-map`
- `GET /api/safe-spaces`
- `GET /api/noise-reports`
- `POST /api/noise-reports`
- `GET /api/geocode-suggestions`
- `GET /api/health`

Request/response formats are unchanged.

### Frontend
The frontend requires no code changes because:
- It already reads `VITE_API_BASE_URL` from environment
- Fetch API calls are identical
- No Cognito/Auth0 auth was actually in use

### Database Schema
The database schema is identical to the AWS RDS version, including all PostGIS types and functions.

## Testing the Migration

See [DOCKER.md](DOCKER.md) for detailed testing instructions, including:
- Building images locally
- Running health checks
- Verifying API endpoints
- Testing scheduler jobs
- Checking database persistence

## Deployment Scenarios

### Development
```bash
docker-compose up
# Frontend: http://localhost
# Backend: http://localhost:3000
```

### Production on VPS
```bash
# Set production secrets
docker-compose -f docker-compose.yml up -d

# External reverse proxy (nginx/Caddy/HAProxy) handles:
# - SSL/TLS termination
# - Domain routing
# - Request forwarding to port 80 (frontend)
```

### Kubernetes
The Docker images can be deployed to Kubernetes with custom manifests or Helm charts.

## Future Enhancements

Possible improvements not implemented yet:

1. **Separate scheduler container** - Extract node-cron to its own build/deployment unit
2. **Database backups** - Automated backup strategy to external storage
3. **Horizontal scaling** - Multiple backend instances with load balancing
4. **Monitoring stack** - Prometheus, Grafana, ELK for observability
5. **Kubernetes deployment** - Helm charts or Kustomize overlays
6. **Multi-region** - Database replication and failover

## Support

For deployment issues, see:
- [DOCKER.md](DOCKER.md) - Troubleshooting guide
- Docker documentation: https://docs.docker.com/
- PostgreSQL/PostGIS docs: https://postgis.net/documentation/
- Express.js docs: http://expressjs.com/
