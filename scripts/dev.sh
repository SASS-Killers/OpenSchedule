#!/bin/bash
set -e

# Kill existing processes on our ports
lsof -ti:6970 2>/dev/null | xargs kill -9 2>/dev/null || true

# Start Mailpit (local email catcher)
docker start mailpit 2>/dev/null || docker run -d --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit 2>/dev/null || echo "ℹ Mailpit not running"

# Load env vars and start PostgREST
export $(grep -v '^#' .env | xargs)
envsubst < postgrest.conf > /tmp/pgrst.conf
nohup postgrest /tmp/pgrst.conf > /tmp/postgrest.log 2>&1 &
disown

# Wait for PostgREST to be ready
sleep 2

# Start Astro dev server
astro dev --host 127.0.0.1 --port 6969
