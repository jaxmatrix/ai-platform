# MCP Server

This directory contains the MCP server, a Python-based service using FastAPI.

## Tech Stack

- Python
- FastAPI
- Uvicorn
- UV

## Getting Started

1.  **Activate the virtual environment:**

    ```bash
    source .venv/bin/activate
    ```

2.  **Run the development server:**

    This will start the FastAPI server using Uvicorn.

    ```bash
    uvicorn main:app --reload
    ```

    Alternatively, you can use `uv` to run the server:

    ```bash
    uv uvicorn main:app --reload
    ```

The server will be running at `http://localhost:8000`.

## API Endpoints

The following endpoints are available:

- `GET /`: Root endpoint, returns a simple hello world message.
- `GET /items/{item_id}`: Endpoint with a path parameter and an optional query parameter.
- `PUT /items/{item_id}`: Endpoint with a request body, using Pydantic for data validation.
