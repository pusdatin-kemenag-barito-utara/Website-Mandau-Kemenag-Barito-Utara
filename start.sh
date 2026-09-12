#!/bin/bash
set -e

# Set internal container communication defaults without overriding injected variables
export GO_API_URL="${GO_API_URL:-http://127.0.0.1:8080}"
export GO_PORT="${GO_PORT:-8080}"
export PORT="${PORT:-3000}"
export HOST="${HOST:-0.0.0.0}"

echo "===================================================="
echo "🚀 Starting SI MANDAU Kemenag Barito Utara Services"
echo "===================================================="

# 1. Start Go Fiber Backend API on port 8080
echo "-> Starting Go Fiber Backend API (Port 8080)..."
/app/api-mandau &
BACKEND_PID=$!

# 2. Wait for backend port 8080 to become ready
echo "-> Waiting for Go Fiber API readiness..."
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:8080/health >/dev/null 2>&1; then
    echo "-> Go Fiber API is ready and operational on port 8080!"
    break
  fi
  sleep 0.3
done

# 3. Start Astro Frontend on port 3000
echo "-> Starting Astro Frontend SSR (Port 3000)..."
node /app/dist/server/entry.mjs &
FRONTEND_PID=$!

# 4. Graceful termination handler
cleanup() {
  echo "-> Shutting down services gracefully..."
  kill -TERM "$FRONTEND_PID" 2>/dev/null || true
  kill -TERM "$BACKEND_PID" 2>/dev/null || true
  wait "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" 2>/dev/null || true
  exit 0
}
trap cleanup SIGTERM SIGINT

# 5. Keep running and wait for either process to exit
wait -n "$BACKEND_PID" "$FRONTEND_PID"
EXIT_CODE=$?
cleanup
exit $EXIT_CODE
