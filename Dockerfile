FROM golang:1.23-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o api-mandau main.go

FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN npm install
COPY frontend/ ./frontend/
COPY .env* ./
WORKDIR /app/frontend
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata bash

COPY --from=backend-builder /app/backend/api-mandau /app/api-mandau
COPY --from=frontend-builder /app/frontend/public /app/frontend/public
COPY --from=frontend-builder /app/frontend/.next/standalone /app/
COPY --from=frontend-builder /app/frontend/.next/static /app/frontend/.next/static

EXPOSE 3000 8080

CMD ["sh", "-c", "/app/api-mandau & HOSTNAME=0.0.0.0 PORT=3000 node frontend/server.js"]
