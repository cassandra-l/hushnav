# Quick Start Guide - Running Hushnav with Docker

## 30-Second Quick Start

```bash
# 1. Create .env file
cp .env.example .env

# Edit .env and set MAPBOX_TOKEN and POSTGRES_PASSWORD
# (Use your text editor or run: nano .env)

# 2. Build and start
docker-compose build
docker-compose up -d

# 3. Access application
# Frontend: http://localhost
# API: http://localhost:3000/api/health
```

## Verify It's Running

```bash
# Check all services are healthy
docker-compose ps

# Should show 3 services all "Up (healthy)"
```

## Essential Commands

```bash
# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Stop all services
docker-compose stop

# Remove containers (keeps data)
docker-compose down

# Remove everything including database
docker-compose down -v

# Restart after changes
docker-compose restart
```

## Configuration

### Set Mapbox Token

Get your Mapbox API key from https://account.mapbox.com/tokens/

Edit `.env`:
```bash
MAPBOX_TOKEN=pk.eyJ1Ijoi...your_token_here...
POSTGRES_PASSWORD=your_secure_password_here
```

### Change Ports

Edit `.env` to use different ports:
```env
FRONTEND_PORT=8080      # Instead of 80
BACKEND_PORT=3001       # Instead of 3000
POSTGRES_PORT=5433      # Instead of 5432
```

## Common Issues

### Port already in use
```bash
# Change FRONTEND_PORT or BACKEND_PORT in .env
docker-compose up -d
```

### Container won't start
```bash
# Check logs for errors
docker-compose logs

# Restart with rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database permission errors
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### Can't reach backend from frontend
- Make sure VITE_API_BASE_URL in `.env` matches deployment
- Inside Docker: `http://backend:3000`
- From host: `http://localhost:3000`

## Database Access

```bash
# Connect to PostgreSQL CLI
docker-compose exec postgres psql -U hushnav -d hushnav

# Or use GUI tool (pgAdmin, DBeaver):
# Host: localhost | Port: 5432 (or your POSTGRES_PORT)
# User: hushnav | Password: (from .env POSTGRES_PASSWORD)
```

## Stopping and Removing

```bash
# Graceful shutdown (keeps database)
docker-compose down

# Complete cleanup (removes database)
docker-compose down -v

# Remove all Docker images
docker-compose down -v --rmi all
```

## Production Deployment

On your VPS, the same commands work:

```bash
cd /opt/hushnav  # Your deployment directory

# Create .env with production secrets
cp .env.example .env
# Edit .env with production values

# Build and start
docker-compose build
docker-compose up -d

# Set up external HTTPS reverse proxy (nginx/Caddy/HAProxy)
# that forwards to http://localhost:80
```

## Next Steps

- Read [DOCKER.md](DOCKER.md) for complete documentation
- Read [MIGRATION.md](MIGRATION.md) for technical details about the Docker migration
- Check container logs: `docker-compose logs -f`
- Test API endpoints: `curl http://localhost:3000/api/health`
- Visit frontend: http://localhost in your browser
