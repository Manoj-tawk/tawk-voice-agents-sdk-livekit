#!/bin/bash

set -e

echo "🚀 LiveKit Multi-Provider Agent - Quick Start"
echo "=============================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    
    echo ""
    echo "📝 Please edit .env and add your API keys:"
    echo "   - LIVEKIT_API_KEY (generate with: npm run generate-keys)"
    echo "   - LIVEKIT_API_SECRET (generate with: npm run generate-keys)"
    echo "   - Provider API keys (OpenAI, Anthropic, etc.)"
    echo ""
    echo "After editing .env, run this script again."
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "🐳 Starting Docker services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check LiveKit health
echo "🔍 Checking LiveKit server..."
if curl -s http://localhost:7880 > /dev/null; then
    echo "✅ LiveKit server is running"
else
    echo "⚠️  LiveKit server not responding yet, give it a few more seconds..."
fi

# Check Agent service health
echo "🔍 Checking Agent service..."
for i in {1..10}; do
    if curl -s http://localhost:8080/health > /dev/null; then
        echo "✅ Agent service is running"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ Agent service failed to start. Check logs with: npm run docker:logs"
        exit 1
    fi
    sleep 2
done

echo ""
echo "✨ All services are running!"
echo ""
echo "📊 Service URLs:"
echo "   - LiveKit Server: ws://localhost:7880"
echo "   - Agent Service:  http://localhost:8080"
echo "   - Health Check:   http://localhost:8080/health"
echo "   - Metrics:        http://localhost:8080/metrics"
echo ""
echo "🧪 To test the agent:"
echo "   1. Open test-client.html in your browser"
echo "   2. Click 'Connect & Start Talking'"
echo "   3. Allow microphone access"
echo "   4. Start speaking!"
echo ""
echo "📝 View logs: npm run docker:logs"
echo "🛑 Stop services: npm run docker:down"
echo ""
