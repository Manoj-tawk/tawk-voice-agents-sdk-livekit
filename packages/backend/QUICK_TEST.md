# Quick Test Guide - Create and Dispatch Agent

## Step 1: Start Backend Server

```bash
cd packages/backend
pnpm dev
```

Wait for:
- ✅ "Agent API server running on port 3001"
- ✅ Agent server connected to LiveKit

## Step 2: Create an Agent via API

In a new terminal:

```bash
curl -X POST http://localhost:3001/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-agent",
    "instructions": "You are a friendly and helpful voice assistant.",
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

Expected response:
```json
{
  "agent": {
    "id": "agent_...",
    "name": "test-agent",
    "instructions": "...",
    "enabled": true,
    ...
  }
}
```

## Step 3: Verify Agent Created

```bash
curl http://localhost:3001/api/agents
```

Should show your agent in the list.

## Step 4: Use Agent in Frontend

The frontend already supports dynamic agent names. When you connect:

1. Open browser: http://localhost:3000
2. The frontend will request a token
3. Update the frontend code to request "test-agent" OR
4. Use the API to set agent name in the request

### Option A: Update Frontend Code

Edit `packages/frontend/app/api/connection-details/route.ts`:

Change line 25 from:
```typescript
"Quinn_353";
```

To:
```typescript
"test-agent"; // or get from query param
```

### Option B: Pass Agent Name in Request

The frontend already reads from request body:
```typescript
body?.room_config?.agents?.[0]?.agent_name || body?.agentName
```

So you can pass it when connecting.

## Step 5: Test the Agent

1. Start frontend: `cd packages/frontend && pnpm dev`
2. Open http://localhost:3000
3. Click "Start call"
4. Allow microphone access
5. Speak to the agent!

The agent will:
- Load configuration from database
- Use the STT/LLM/TTS providers you configured
- Respond with the instructions you set

## Troubleshooting

**API not responding:**
- Check backend server is running: `ps aux | grep "tsx.*agent"`
- Check port 3001: `lsof -ti:3001`
- Check logs in backend terminal

**Agent not joining:**
- Verify agent exists: `curl http://localhost:3001/api/agents/test-agent`
- Check agent is enabled: `"enabled": true`
- Check backend logs for errors
- Verify LiveKit server is running: `docker-compose ps`

**Agent name mismatch:**
- Frontend must request the exact agent name from database
- Check token generation logs for agent name

