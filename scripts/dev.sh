#!/bin/bash
# Start both frontend and backend concurrently

echo "🚀 Starting LiveKit Voice Agent Monorepo..."
echo ""

# Check if LiveKit is running
if ! curl -s http://localhost:7880/ > /dev/null 2>&1; then
  echo "⚠️  LiveKit server not running. Starting it..."
  docker-compose up -d livekit redis
  echo "⏳ Waiting for LiveKit to be ready..."
  sleep 5
fi

echo "✅ LiveKit server: $(curl -s http://localhost:7880/ > /dev/null && echo 'Running' || echo 'Starting...')"
echo ""

# Start backend and frontend
echo "📦 Starting backend and frontend..."
pnpm --filter backend dev &
BACKEND_PID=$!

pnpm --filter frontend dev &
FRONTEND_PID=$!

# Wait for both
wait $BACKEND_PID $FRONTEND_PID
