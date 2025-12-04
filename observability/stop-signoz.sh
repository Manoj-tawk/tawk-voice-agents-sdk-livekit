#!/bin/bash

# Stop SigNoz Observability Stack

set -e

echo "🛑 Stopping SigNoz Observability Stack..."
echo ""

docker-compose -f docker-compose.signoz.yml down

echo ""
echo "✅ SigNoz stopped!"
echo ""
echo "💡 To remove all data (WARNING: Deletes everything!):"
echo "   docker-compose -f docker-compose.signoz.yml down -v"
echo ""
echo "To restart: ./start-signoz.sh"

