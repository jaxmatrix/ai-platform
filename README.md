# Introduction

This is a setup project that will be used to create services for building ai base application

In this setup following services will be created

- [x] 1. Backend service using node js
- [x] 2. Frontend service that will be used to render the ui
- [x] 3. Storage service using `MiniIO` this will help in ensuring s3 like storage protocols
- [ ] 4. n8n runner this service will contain an instance of n8n that will host the ai side the applcation
- [x] 5. Python mcp service that will expose different functionality not present in n8n
- [ ] 6. Python service that will host all the support service that will be required by the application
- [-] 7. Lastly there will a final folder for research related things like finetuning, references etc.

# Code guidelines

1. For front end we will be using React (PReact) with VITE. No next-js bullshit
2. Function name will start with a small letter and following the camelCase
3. Variable names will follow PascalCase
4. All the documentation will be in markdown and we will generate the complete markdown using mdbook or something similar

# Frontend UI

This section contains the instructions for running the frontend UI application.

## Setup

To set up the frontend UI application, run the following command in the `frontend/ui` directory:

```bash
pnpm install
```

## Running the application

To run the frontend UI application in development mode, run the following command in the `frontend/ui` directory:

```bash
pnpm dev
```

The application will be available at `http://localhost:3001`.

The dev server is also configured to proxy requests to the backend API. Any requests to `/api` will be forwarded to `http://localhost:5000`.

To build the application, run the following command:

```bash
pnpm build
```

To preview the built application, run the following command:

```bash
pnpm preview
```

The preview will be available at `http://localhost:4000`.

# Docker Compose Profiles

The project includes Docker Compose profiles for both development and production environments. Each service (backend, frontend, and mcp) has dedicated configurations for both profiles.

## Development Environment

The development profile includes hot-reloading, volume mounting for live code changes, and development-optimized configurations.

### Running Development Environment

To start all services in development mode:

```bash
docker compose --profile dev up
```

To start specific services:

```bash
# Start only backend and database services
docker compose --profile dev up backend-dev postgres minio

# Start frontend with its dependencies
docker compose --profile dev up frontend-dev backend-dev postgres minio
```

### Development Services

- **backend-dev**: Node.js backend with hot reload on port 5000
- **frontend-dev**: Vite dev server on port 3000 with hot reload
- **mcp-dev**: Python MCP service with hot reload on port 8000

All development services include volume mounting for live code changes.

## Production Environment

The production profile uses optimized builds, static file serving, and production-ready configurations.

### Running Production Environment

To start all services in production mode:

```bash
docker compose --profile prod up
```

To start specific services:

```bash
# Start only backend services
docker compose --profile prod up backend-prod postgres minio

# Start frontend with dependencies
docker compose --profile prod up frontend-prod backend-prod postgres minio
```

### Production Services

- **backend-prod**: Optimized Node.js build on port 5000
- **frontend-prod**: Nginx serving static files on port 3000 (mapped to 80 internally)
- **mcp-prod**: Optimized Python service on port 8000

## Service Ports

| Service    | Development Port | Production Port |
| ---------- | ---------------- | --------------- |
| Frontend   | 3000             | 3000            |
| Backend    | 5000             | 5000            |
| MCP        | 8000             | 8000            |
| PostgreSQL | 5432             | 5432            |
| MinIO      | 9000, 9001       | 9000, 9001      |
| N8N        | 5678             | 5678            |

## Additional Docker Commands

```bash
# Build images without starting services
docker compose --profile dev build
docker compose --profile prod build

# View configuration for a profile
docker compose --profile dev config
docker compose --profile prod config

# Stop and remove containers
docker compose --profile dev down
docker compose --profile prod down

# Remove all containers, networks, and volumes
docker compose --profile dev down -v
docker compose --profile prod down -v
```

## N8N Access Denied Error

Make sure you have right permission for the n8n folder withing the data directory.

```
sudo chown -R 1000:1000 ./data/n8n
chmod 700 ./n8n
```

# Changelog

- **2025-08-18:** Added Docker Compose profiles documentation for development and production environments.
- **2025-08-17:** Added instructions for running the frontend UI application.
