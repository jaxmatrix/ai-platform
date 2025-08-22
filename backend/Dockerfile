# Base stage
FROM node:18-alpine as base

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Development stage
FROM base as dev

# Expose port
EXPOSE 5000

# Start the application in development mode
CMD ["pnpm", "dev"]

# Production stage
FROM base as prod

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["pnpm", "start"]
