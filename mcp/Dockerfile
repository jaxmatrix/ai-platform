# Base stage
FROM python:3.11-slim AS base

WORKDIR /app

# Install uv
RUN pip install uv

# Copy Python files
COPY . .

# Development target
FROM base AS dev

# Install dev dependencies
RUN uv pip install --system fastapi uvicorn python-multipart

# Expose port
EXPOSE 8000

# Start with hot reload for development
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production target
FROM base AS prod

# Install only production dependencies
RUN uv pip install --system fastapi uvicorn

# Expose port
EXPOSE 8000

# Start the application in production mode
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]