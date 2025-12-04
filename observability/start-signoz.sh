#!/bin/bash

# Start SigNoz Observability Stack
# Open-source monitoring for Tawk.to Voice Agents

set -e

echo "🚀 Starting SigNoz Observability Stack..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Error: Docker is not running!"
  echo "Please start Docker Desktop and try again."
  exit 1
fi

echo "✓ Docker is running"
echo ""

# Start SigNoz services
echo "📦 Starting SigNoz services..."
docker-compose -f docker-compose.signoz.yml up -d

echo ""
echo "⏳ Waiting for services to be healthy (this may take 30-60 seconds)..."
sleep 10

# Check service health
echo ""
echo "🔍 Checking service status..."
docker-compose -f docker-compose.signoz.yml ps

echo ""
echo "✅ SigNoz is starting!"
echo ""
echo "📊 Access SigNoz UI:"
echo "   http://localhost:3301"
echo ""
echo "📈 OTEL Collector endpoints:"
echo "   gRPC: localhost:4317"
echo "   HTTP: localhost:4318"
echo ""
echo "💡 Next steps:"
echo "   1. Open http://localhost:3301 in your browser"
echo "   2. Create your account (local, no internet needed)"
echo "   3. Start your voice agent: cd ../packages/backend && pnpm start"
echo "   4. Make a test call and watch metrics flow in!"
echo ""
echo "📚 Documentation: observability/README.md"
echo ""
echo "🎉 Happy monitoring!"

