# ==============================================================================
# Multi-Stage Dockerfile for SI MANDAU KEMENAG Monorepo
# Stage 1: Golang Backend Builder (Go Alpine)
# Stage 2: Astro Frontend Builder (Node.js 22 Alpine)
# Stage 3: Minimal Production Runtime with Infisical CLI (Node.js 22 Alpine)
# ==============================================================================

# ── Stage 1: Build Golang API Backend ──
FROM golang:alpine AS backend-builder
WORKDIR /app/backend
RUN apk add --no-cache git ca-certificates tzdata
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -trimpath -o /app/api-mandau main.go

# ── Stage 2: Build Astro Frontend ──
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --include=dev --no-audit
COPY frontend/ ./
ENV ASTRO_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: Production Runner with Infisical Universal Auth ──
FROM node:22-alpine AS runner
WORKDIR /app

# Install runtime utilities, timezone data, and Infisical CLI
RUN apk add --no-cache ca-certificates tzdata bash curl wget \
    && curl -1sLf 'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.alpine.sh' | bash \
    && apk add --no-cache infisical

ENV TZ=Asia/Jakarta

# Production environment configurations
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV GO_PORT=8080
ENV GO_ENV=production

# Copy compiled Go backend binary
COPY --from=backend-builder /app/api-mandau /app/api-mandau

# Copy and install production frontend dependencies
COPY --from=frontend-builder /app/frontend/package.json /app/package.json
COPY --from=frontend-builder /app/frontend/package-lock.json* /app/package-lock.json
RUN npm install --omit=dev --no-audit && npm cache clean --force

# Copy pre-rendered Astro production build
COPY --from=frontend-builder /app/frontend/dist /app/dist

# Copy entrypoint and startup scripts with LF line endings and execution permissions
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY start.sh /app/start.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh \
    && sed -i 's/\r$//' /app/start.sh && chmod +x /app/start.sh

# Expose Web (3000) and Backend (8080)
EXPOSE 3000 8080

# Health check to ensure service stability (with start period for Infisical injection)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://127.0.0.1:3000/api/health || exit 1

# Universal Auth Entrypoint & Multi-Process Supervisor Command
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["/bin/bash", "/app/start.sh"]
