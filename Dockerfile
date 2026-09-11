# Root Dockerfile for Project Submission & Review Portal
# Builds both backend and frontend in a single image
# Suitable for simple single-container deployment

# Build argument for API URL (passed during docker build)
ARG NEXT_PUBLIC_API_URL=http://localhost:8000

FROM node:18-alpine AS frontend-builder

ARG NEXT_PUBLIC_API_URL

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./

# Set build-time environment variable for Next.js
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Backend and runtime
FROM python:3.11-slim

WORKDIR /app

# Install Node.js for frontend runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
    supervisor \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy frontend build
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules

# Supervisor config to run both services
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Environment
ENV PYTHONPATH=/app/backend \
    NODE_ENV=production

EXPOSE 8000 3000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
