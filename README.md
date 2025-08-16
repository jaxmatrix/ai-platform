# Introduction 

This is a setup project that will be used to create services for building ai base application

In this setup following services will be created 
1. Backend service using node js
2. Frontend service that will be used to render the ui
3. Storage service using `MiniIO` this will help in ensuring s3 like storage protocols 
4. n8n runner this service will contain an instance of n8n that will host the ai side the applcation 
5. Python mcp service that will expose different functionality not present in n8n 
6. Python service that will host all the support service that will be required by the application 
7. Lastly there will a final folder for research related things like finetuning, references etc.

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

# Changelog

- **2025-08-17:** Added instructions for running the frontend UI application. 
