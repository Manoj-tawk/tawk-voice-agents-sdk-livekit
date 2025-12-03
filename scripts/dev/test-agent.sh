#!/bin/bash

# Development test script - Not for production use
# This script helps test the agent locally during development

echo "🚀 Starting LiveKit Voice Agent Test (Development)"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is not installed"; exit 1; }
command -v livekit-server >/dev/null 2>&1 || { echo "❌ livekit-server is not installed. Install via: brew install livekit-server"; exit 1; }
echo -e "${GREEN}✅ Prerequisites met${NC}"
echo ""

# Check if .env.local files exist
echo "📝 Checking environment files..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [ ! -f "$REPO_ROOT/packages/backend/.env.local" ]; then
  echo -e "${YELLOW}⚠️  packages/backend/.env.local not found${NC}"
  echo "   Please copy packages/backend/.env.example to packages/backend/.env.local and configure it"
  exit 1
fi

if [ ! -f "$REPO_ROOT/packages/frontend/.env.local" ]; then
  echo -e "${YELLOW}⚠️  packages/frontend/.env.local not found${NC}"
  echo "   Please copy packages/frontend/.env.example to packages/frontend/.env.local and configure it"
  exit 1
fi

cd "$REPO_ROOT"
echo -e "${GREEN}✅ Environment files ready${NC}"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ ! -d "packages/backend/node_modules" ] || [ ! -d "packages/frontend/node_modules" ]; then
  echo "📦 Installing dependencies..."
  NODE_OPTIONS="--max-old-space-size=4096" pnpm install || {
    echo -e "${YELLOW}⚠️  Installation had issues, but continuing...${NC}"
  }
  echo -e "${GREEN}✅ Dependencies check complete${NC}"
  echo ""
fi

# Download model files
echo "📥 Downloading model files..."
cd packages/backend
pnpm download-files 2>/dev/null || echo -e "${YELLOW}⚠️  download-files script may not exist, skipping...${NC}"
cd "$REPO_ROOT"
echo ""

# Start LiveKit server in background
echo -e "${BLUE}🎯 Starting LiveKit server...${NC}"
pnpm start:livekit > /tmp/livekit.log 2>&1 &
LIVEKIT_PID=$!
echo "   LiveKit server PID: $LIVEKIT_PID"
echo "   Logs: tail -f /tmp/livekit.log"

# Wait for LiveKit to start
echo "   Waiting for LiveKit server to initialize..."
sleep 5

# Check if LiveKit is running
if curl -s http://localhost:7880/ > /dev/null 2>&1; then
  echo -e "${GREEN}✅ LiveKit server is running on http://localhost:7880${NC}"
else
  echo -e "${YELLOW}⚠️  LiveKit server may not be ready yet, but continuing...${NC}"
fi
echo ""

# Start backend and frontend
echo -e "${BLUE}🎯 Starting backend agent and frontend...${NC}"
echo "   Backend will register as agent: 'Quinn_353'"
echo "   Frontend will be available at: http://localhost:3000"
echo ""
echo -e "${YELLOW}📌 IMPORTANT: Keep this terminal open!${NC}"
echo -e "${YELLOW}   Press Ctrl+C to stop all services${NC}"
echo ""
echo "=================================================="
echo "✅ Setup complete!"
echo ""
echo "🌐 Open your browser:"
echo "   http://localhost:3000"
echo ""
echo "🎤 Click 'Start call' and start talking!"
echo ""
echo "📊 Monitor logs:"
echo "   LiveKit: tail -f /tmp/livekit.log"
echo "   Backend/Frontend: Check the terminal output above"
echo ""
echo "=================================================="
echo ""

# Start dev servers
pnpm dev

# Cleanup on exit
trap "echo ''; echo '🛑 Stopping services...'; kill $LIVEKIT_PID 2>/dev/null; pkill -f 'pnpm.*dev' 2>/dev/null; echo '✅ All services stopped'; exit" INT TERM

wait
