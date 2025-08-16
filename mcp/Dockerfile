FROM python:3.11-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy Python files
COPY . .

# Install dependencies using uv
RUN uv pip install --system fastapi uvicorn

# Expose port
EXPOSE 8000

# Start the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]