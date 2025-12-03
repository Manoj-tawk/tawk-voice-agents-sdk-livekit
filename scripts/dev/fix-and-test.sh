#!/bin/bash

echo "🔧 Fixing and Starting Services"
echo "================================"
echo ""

# Kill all existing processes
echo "🧹 Cleaning up old processes..."
pkill -f "livekit-server" 2>/dev/null
pkill -f "tsx.*agent" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2
echo "✅ Cleaned up"
echo ""

# Check environment files
echo "📝 Checking environment files..."
if [ ! -f packages/frontend/.env.local ]; then
  echo "Creating packages/frontend/.env.local..."
  cat > packages/frontend/.env.local << EOF
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
NEXT_PUBLIC_LIVEKIT_URL=ws://localhost:7880
EOF
  echo "✅ Created frontend .env.local"
fi

if [ ! -f packages/backend/.env.local ]; then
  echo "Creating packages/backend/.env.local..."
  cat > packages/backend/.env.local << EOF
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
EOF
  echo "✅ Created backend .env.local"
fi
echo ""

# Start LiveKit server
echo "🚀 Starting LiveKit server..."
cd /Users/manoj/Downloads/livekit-multi-provider-poc
pnpm start:livekit > /tmp/livekit.log 2>&1 &
LIVEKIT_PID=$!
echo "   LiveKit PID: $LIVEKIT_PID"
sleep 5

# Check if LiveKit started
if curl -s http://localhost:7880/ > /dev/null 2>&1; then
  echo "✅ LiveKit server is running"
else
  echo "⚠️  LiveKit may still be starting..."
fi
echo ""

# Start backend and frontend
echo "🚀 Starting backend and frontend..."
echo "   This will take a moment..."
echo ""

# Run in foreground so we can see errors
pnpm dev

