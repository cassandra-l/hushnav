# HushNav

A sensory-friendly navigation platform designed to help individuals that are sensitive to noise to explore Melbourne CBD with greater confidence, comfort, and control. The platform provides personalised routing, noise-awareness features and calming support tools to reduce sensory overload during travel and daily activities.

The project was created to address a common challenge faced by individuals with sensory sensitivities, which is the uncertainty and stress when navigating noisy, crowded, or overstimulating environments.

🔗 **Website Link: https://hushnav.app/**  
<img width="1470" height="798" alt="image" src="https://github.com/user-attachments/assets/09c81ecd-3633-42cd-82da-5427346c87aa" />

## Features

### 🌿 Personalised Sensory Routing
- Custom routes based on sensory preferences
- Avoid crowded or noisy areas
- Accessibility-focused navigation experience

### 🗺️ Interactive Map Experience
- Filter locations based on sensory needs and noise sensitivity
- Discover nearby quiet spaces along routes for emotional regulation and recovery

### 🔊 Noise Awareness & Monitoring
- Real-time noise insights
- Surroundings sound-level visualisation

### 🧘 Calming Support Tools
- Guided breathing exercises
- Soundscape support for relaxation

## Architecture

Hushnav is a containerized full-stack application:

- **Frontend**: React 18 + TypeScript + Vite, served by NGINX
- **Backend**: Node.js + Express REST API with PostgreSQL + PostGIS
- **Database**: PostgreSQL with PostGIS spatial extensions
- **Orchestration**: Docker Compose for local development and VPS deployment

See [DOCKER.md](DOCKER.md) for deployment instructions and [MIGRATION.md](MIGRATION.md) for technical architecture details.

## Quick Start

### Prerequisites
- Docker Engine 24.0+
- Docker Compose 2.20+

### Running Locally with Docker

```bash
# Copy environment template
cp .env.example .env

# Edit .env to add your Mapbox token and set database password
nano .env

# Build and start all services
docker-compose build
docker-compose up -d

# Access the application
# Frontend: http://localhost
# API: http://localhost:3000/api/health
```

For detailed setup and troubleshooting, see [QUICKSTART.md](QUICKSTART.md).

## Development

### Frontend Development

```bash
# Install dependencies
npm install

# Run Vite dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Development

The backend runs in a Docker container. To modify backend code:

```bash
# Backend is in backend/ directory
cd backend

# Install dependencies
npm install

# Run development server (inside container via docker-compose)
docker-compose restart backend

# View logs
docker-compose logs -f backend
```

### Database

PostgreSQL runs in Docker. To access it:

```bash
# Connect via psql
docker-compose exec postgres psql -U hushnav -d hushnav

# Or use GUI tools like pgAdmin, DBeaver with:
# Host: localhost | Port: 5432
# User: hushnav | Password: (from .env)
```

## Project Structure

```
hushnav/
├── backend/              # Node.js/Express backend service
│   ├── src/
│   │   ├── server.ts     # Express app
│   │   ├── db.ts         # Database connection
│   │   ├── scheduler.ts  # Background jobs (node-cron)
│   │   ├── services/     # Core business logic
│   │   ├── spatialData/  # Spatial queries
│   │   ├── edgeCost/     # Edge weight algorithms
│   │   ├── construction/ # Construction data pipeline
│   │   └── functions/    # API endpoint handlers
│   └── Dockerfile
│
├── src/                  # React frontend source
├── public/               # Static assets
├── nginx/                # NGINX configuration
├── docker/               # Docker utilities
│   └── init-db/          # Database initialization scripts
│
├── docker-compose.yml    # Service orchestration
├── Dockerfile.frontend   # Frontend build configuration
├── DOCKER.md             # Docker deployment guide
├── MIGRATION.md          # Architecture & technical details
└── QUICKSTART.md         # Quick start guide
```

## API Documentation

All endpoints are REST-based and return JSON:

- `POST /api/plan-route` - Plan a route with noise/crowd avoidance
- `GET /api/noise-map` - Get high-noise areas as GeoJSON
- `GET /api/safe-spaces` - Get quiet spaces near a route
- `GET /api/noise-reports` - Get user-submitted noise reports
- `POST /api/noise-reports` - Create a noise report
- `GET /api/geocode-suggestions` - Location name autocomplete
- `GET /api/health` - Health check endpoint

## Technologies

### Frontend
- React 18, TypeScript, Vite
- React Router for navigation
- Maplibre GL for map visualization
- Framer Motion for animations
- Tailwind CSS for styling

### Backend
- Node.js with Express
- PostgreSQL with PostGIS
- node-cron for scheduled tasks
- Axios for external API calls

### Infrastructure
- Docker & Docker Compose
- NGINX for static file serving
- PostgreSQL 17 with PostGIS 3.4

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

See [LICENSE](LICENSE) file for license information.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.





