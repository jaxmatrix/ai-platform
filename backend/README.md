# Backend Service

This directory contains the backend service for the platform project.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- Socket.IO
- PostgreSQL with pgvector
- MinIO

## Getting Started

1.  **Install dependencies:**

    ```bash
    pnpm install
    ```

2.  **Start the services:**

    This will start the PostgreSQL and MinIO services in Docker.

    ```bash
    docker-compose up -d
    ```

3.  **Run the development server:**

    This will start the Node.js server in development mode with auto-reloading.

    ```bash
    pnpm dev
    ```

The server will be running at `http://localhost:3000`.

## Database

The PostgreSQL database is running on port `5432`. The credentials are in the `.env` file.

The `pgvector` extension is automatically enabled.

## Storage

MinIO is used for S3-like object storage. The MinIO server is running on port `9000` and the console is on port `9001`. The credentials are in the `.env` file.
