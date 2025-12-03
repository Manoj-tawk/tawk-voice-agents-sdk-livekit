#!/bin/bash
# Wait for API server to be ready
echo "Waiting for API server..."
for i in {1..10}; do
  if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "API server is ready!"
    break
  fi
  echo "Attempt $i/10..."
  sleep 2
done

# Create test agent
echo ""
echo "Creating test agent..."
curl -X POST http://localhost:3001/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-agent",
    "instructions": "You are a friendly and helpful voice assistant. Keep your responses brief and conversational.",
    "enabled": true,
    "stt": {
      "provider": "deepgram",
      "model": "nova-3"
    },
    "llm": {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "temperature": 0.7
    },
    "tts": {
      "provider": "elevenlabs",
      "voiceId": "Xb7hH8MSUJpSbSDYk0k2",
      "voiceName": "Alice",
      "modelId": "eleven_turbo_v2_5"
    },
    "voiceOptions": {
      "preemptiveGeneration": true,
      "noiseCancellation": true
    }
  }'

echo ""
echo ""
echo "Listing all agents..."
curl -s http://localhost:3001/api/agents | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3001/api/agents
