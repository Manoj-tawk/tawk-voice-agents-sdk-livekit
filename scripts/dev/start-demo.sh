#!/bin/bash

# Demo Startup Script
# This script starts LiveKit server and the dev servers

echo "🚀 Starting LiveKit Voice Agent Demo..."
echo ""

# Check if LiveKit is installed
if ! command -v livekit-server &> /dev/null; then
    echo "❌ LiveKit not found. Installing..."
    brew install livekit
fi

# Kill any existing LiveKit servers
pkill -f livekit-server 2>/dev/null

# Start LiveKit in background
echo "✅ Starting LiveKit server..."
livekit-server --dev --bind 0.0.0.0 > /tmp/livekit.log 2>&1 &
LIVEKIT_PID=$!

# Wait for LiveKit to start
sleep 3

# Check if LiveKit started successfully
if curl -s http://localhost:7880/ > /dev/null 2>&1; then
    echo "✅ LiveKit server is running on http://localhost:7880"
    echo "   PID: $LIVEKIT_PID"
    echo ""
else
    echo "❌ LiveKit server failed to start. Check /tmp/livekit.log"
    exit 1
fi

# Start dev servers
echo "✅ Starting frontend and backend..."
echo ""
echo "📋 Open http://localhost:3000 in your browser"
echo ""
echo "Press Ctrl+C to stop everything"
echo ""

# Start dev servers (this will block)
pnpm dev

# Cleanup on exit
echo ""
echo "🛑 Stopping LiveKit server..."
kill $LIVEKIT_PID 2>/dev/null
pkill -f livekit-server 2>/dev/null

