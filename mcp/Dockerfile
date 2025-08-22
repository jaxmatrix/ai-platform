# Base stage
FROM python:3.11-slim AS base

WORKDIR /app

# Install system dependencies for unstructured and other packages
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libmagic1 \
    libmagic-dev \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN pip install uv

# Development target
FROM base AS dev

# Expose port
EXPOSE 8000

# Start with hot reload for development
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production target
FROM base AS prod

# Copy requirements file first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN uv pip install --system -r requirements.txt

# Copy application files
COPY . .

# Expose port
EXPOSE 8000

# Start the application in production mode
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]