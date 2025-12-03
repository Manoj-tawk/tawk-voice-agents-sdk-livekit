#!/bin/bash
# Test script for Agent Management API

API_URL="http://localhost:3001"

echo "=== Testing Agent Management API ==="
echo ""

# Test 1: Health check
echo "1. Health check..."
curl -s "$API_URL/health" | jq '.' || echo "Failed"
echo ""

# Test 2: List agents (should be empty initially)
echo "2. List all agents..."
curl -s "$API_URL/api/agents" | jq '.' || echo "Failed"
echo ""

# Test 3: Create a test agent
echo "3. Create test agent..."
curl -s -X POST "$API_URL/api/agents" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-agent",
    "instructions": "You are a helpful test assistant.",
    "enabled": true,
    "stt": {
      "provider": "deepgram",
      "model": "nova-3"
    },
    "llm": {
      "provider": "openai",
      "model": "gpt-4o-mini"
    },
    "tts": {
      "provider": "elevenlabs",
      "voiceId": "Xb7hH8MSUJpSbSDYk0k2",
      "voiceName": "Alice"
    }
  }' | jq '.' || echo "Failed"
echo ""

# Test 4: Get the agent
echo "4. Get test agent..."
curl -s "$API_URL/api/agents/test-agent" | jq '.' || echo "Failed"
echo ""

# Test 5: List agents again
echo "5. List all agents (should have one now)..."
curl -s "$API_URL/api/agents" | jq '.' || echo "Failed"
echo ""

# Test 6: Update agent
echo "6. Update test agent..."
curl -s -X PUT "$API_URL/api/agents/test-agent" \
  -H "Content-Type: application/json" \
  -d '{
    "instructions": "You are an updated test assistant with new instructions."
  }' | jq '.' || echo "Failed"
echo ""

# Test 7: Delete agent
echo "7. Delete test agent..."
curl -s -X DELETE "$API_URL/api/agents/test-agent" | jq '.' || echo "Failed"
echo ""

# Test 8: Verify deletion
echo "8. Verify agent deleted..."
curl -s "$API_URL/api/agents/test-agent" | jq '.' || echo "Agent not found (expected)"
echo ""

echo "=== Tests Complete ==="

