# Dynamic Agent System

This system allows you to create and manage voice agents dynamically via API, loading configurations from a database instead of hardcoding them.

## Architecture

### How It Works

1. **Agent Registration**: The agent server runs without a specific `agentName`, allowing it to handle multiple agent types
2. **Database Storage**: Agent configurations are stored in a database (currently in-memory, can be replaced with PostgreSQL/MongoDB)
3. **Dynamic Loading**: When a job is dispatched, the agent loads its configuration from the database based on the requested agent name
4. **API Management**: REST API provides CRUD operations for managing agents

### Flow

```
1. Frontend requests agent "sales-agent" in token
   ↓
2. LiveKit dispatches job to agent server
   ↓
3. Agent entry function loads "sales-agent" config from database
   ↓
4. Agent session created with database configuration
   ↓
5. Agent joins room and starts conversation
```

## Setup

### 1. Start the Agent Server

The agent server now includes an API server on port 3001:

```bash
cd packages/backend
pnpm dev
```

This starts:
- Agent server (connects to LiveKit)
- API server (port 3001) for managing agents

### 2. Create an Agent via API

```bash
curl -X POST http://localhost:3001/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "sales-agent",
    "instructions": "You are a sales assistant...",
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

### 3. Use the Agent in Frontend

Update your frontend token generation to request the agent by name:

```typescript
// In packages/frontend/app/api/connection-details/route.ts
at.roomConfig = new RoomConfiguration({
  agents: [
    new RoomAgentDispatch({
      agentName: 'sales-agent', // Use agent name from database
      metadata: JSON.stringify({ agentName: 'sales-agent' }), // Also include in metadata
    }),
  ],
});
```

## Important Notes

### Agent Name Resolution

The system tries to get the agent name in this order:
1. From `ctx.agentName` (if available)
2. From metadata JSON (`metadata.agentName` or `metadata.agent_name`)
3. Falls back to default `'Quinn_353'` for backward compatibility

**Recommendation**: Always include the agent name in both the `RoomAgentDispatch.agentName` and in the metadata to ensure reliable resolution.

### Current Limitation

The agent server is registered without a specific `agentName` to support multiple agents. This means:
- ✅ Can handle multiple agent types dynamically
- ⚠️ Will auto-dispatch to all rooms (unless filtered)
- ⚠️ Agent must exist in database, otherwise it exits gracefully

### Production Considerations

For production, consider:
1. **Replace in-memory database** with PostgreSQL, MongoDB, or similar
2. **Add authentication** to the API endpoints
3. **Add rate limiting** to prevent abuse
4. **Add validation** for agent configurations
5. **Add monitoring** for agent usage and performance
6. **Consider using explicit agent registration** per agent type if you have a limited, known set

## Database Schema

See `src/db/schema.ts` for the full schema. Key fields:

- `name`: Unique agent identifier
- `instructions`: System prompt for the agent
- `enabled`: Whether the agent is active
- `stt`, `llm`, `tts`: Provider configurations
- `voiceOptions`: Voice-specific settings

## API Documentation

See `API.md` for complete API documentation.

## Migration from Static Agents

If you have existing static agents:

1. Create agent configurations via API
2. Update frontend to use agent names from database
3. Remove hardcoded agent configurations from code
4. All agents are now managed via API

## Example: Multiple Agents

```bash
# Create customer support agent
curl -X POST http://localhost:3001/api/agents -d '{
  "name": "support",
  "instructions": "You are a customer support agent...",
  ...
}'

# Create sales agent
curl -X POST http://localhost:3001/api/agents -d '{
  "name": "sales",
  "instructions": "You are a sales agent...",
  ...
}'

# Frontend can now request either agent
# Token with support agent:
at.roomConfig = new RoomConfiguration({
  agents: [new RoomAgentDispatch({ agentName: 'support' })]
});

# Token with sales agent:
at.roomConfig = new RoomConfiguration({
  agents: [new RoomAgentDispatch({ agentName: 'sales' })]
});
```

