# Testing the Dynamic Agent System

## Quick Test Guide

### 1. Start the Backend Server

The backend server includes both the agent server and the API server:

```bash
cd packages/backend
pnpm dev
```

This will:
- Start the agent server (connects to LiveKit)
- Start the API server on port 3001

### 2. Test the API

#### Health Check
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","service":"agent-api"}
```

#### Create an Agent
```bash
curl -X POST http://localhost:3001/api/agents \
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
  }'
```

#### List All Agents
```bash
curl http://localhost:3001/api/agents
```

#### Get Specific Agent
```bash
curl http://localhost:3001/api/agents/test-agent
```

#### Update Agent
```bash
curl -X PUT http://localhost:3001/api/agents/test-agent \
  -H "Content-Type: application/json" \
  -d '{
    "instructions": "Updated instructions..."
  }'
```

#### Delete Agent
```bash
curl -X DELETE http://localhost:3001/api/agents/test-agent
```

### 3. Test with Frontend

1. Create an agent via API (see above)
2. Update frontend to request that agent:

In `packages/frontend/app/api/connection-details/route.ts`, the agent name is already configurable via the request body:

```typescript
const agentName = body?.room_config?.agents?.[0]?.agent_name || "Quinn_353";
```

3. Start frontend: `cd packages/frontend && pnpm dev`
4. Connect and test the agent

### 4. Automated Test Script

Run the test script (requires `jq` for JSON formatting):

```bash
cd packages/backend
./test-api.sh
```

Or manually test each endpoint.

## Expected Behavior

✅ **API Server**: Should start on port 3001  
✅ **Agent Server**: Should connect to LiveKit  
✅ **Create Agent**: Should return 201 with agent config  
✅ **List Agents**: Should return array of agents  
✅ **Get Agent**: Should return agent config  
✅ **Update Agent**: Should return updated config  
✅ **Delete Agent**: Should return success message  

## Troubleshooting

- **Port 3001 in use**: Change `AGENT_API_PORT` environment variable
- **Agent not found**: Make sure agent exists and is enabled
- **Type errors**: Run `pnpm typecheck` to verify
- **API not responding**: Check that backend server is running

