FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace file
COPY pnpm-workspace.yaml ./

# Copy package files
COPY ui/package.json ui/pnpm-lock.yaml ./ui/

# Install dependencies
WORKDIR /app/ui
RUN pnpm install --frozen-lockfile

# Copy source code
COPY ui/ ./

# Build the application
RUN pnpm run build

# Use nginx to serve the built app
FROM nginx:alpine
COPY --from=0 /app/ui/dist /usr/share/nginx/html

# Copy nginx config (optional)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]