# Base stage with dependencies
FROM node:20-alpine AS base

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Development target
FROM base AS dev

EXPOSE 3000 
CMD ["pnpm", "run", "dev", "--host"]

# Build stage
FROM base AS build

# Copy package files
COPY ui/package.json ui/pnpm-lock.yaml ui/pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY ui/ ./

RUN pnpm run build

# Production target
FROM docker.io/library/nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
