# Agent Management API

This API allows you to create, update, and manage voice agents dynamically without modifying code.

## Base URL

```
http://localhost:3001
```

## Endpoints

### List All Agents

```http
GET /api/agents
```

**Response:**
```json
{
  "agents": [
    {
      "id": "agent_1234567890_abc123",
      "name": "customer-support",
      "instructions": "You are a helpful customer support agent...",
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
      },
      "createdAt": "2024-12-03T10:00:00.000Z",
      "updatedAt": "2024-12-03T10:00:00.000Z"
    }
  ]
}
```

### Get Agent by Name

```http
GET /api/agents/:name
```

**Example:**
```http
GET /api/agents/customer-support
```

**Response:**
```json
{
  "agent": {
    "id": "agent_1234567890_abc123",
    "name": "customer-support",
    "instructions": "...",
    "enabled": true,
    ...
  }
}
```

### Create Agent

```http
POST /api/agents
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "customer-support",
  "instructions": "You are a friendly customer support agent. Help users with their questions and resolve issues efficiently.",
  "enabled": true,
  "stt": {
    "provider": "deepgram",
    "model": "nova-3"
  },
  "llm": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "maxTokens": 500
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
}
```

**Response:**
```json
{
  "agent": {
    "id": "agent_1234567890_abc123",
    "name": "customer-support",
    ...
  }
}
```

### Update Agent

```http
PUT /api/agents/:name
Content-Type: application/json
```

**Request Body:** (all fields optional)
```json
{
  "instructions": "Updated instructions...",
  "enabled": false,
  "llm": {
    "model": "gpt-4"
  }
}
```

**Response:**
```json
{
  "agent": {
    "id": "agent_1234567890_abc123",
    "name": "customer-support",
    ...
  }
}
```

### Delete Agent

```http
DELETE /api/agents/:name
```

**Response:**
```json
{
  "message": "Agent deleted successfully"
}
```

## Configuration Options

### STT (Speech-to-Text) Providers

**Deepgram:**
```json
{
  "provider": "deepgram",
  "model": "nova-3",
  "apiKey": "optional-override" // Uses DEEPGRAM_API_KEY env var if not provided
}
```

**OpenAI:**
```json
{
  "provider": "openai",
  "model": "whisper-1",
  "apiKey": "optional-override" // Uses OPENAI_API_KEY env var if not provided
}
```

### LLM (Language Model) Providers

**OpenAI:**
```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "maxTokens": 500,
  "apiKey": "optional-override"
}
```

### TTS (Text-to-Speech) Providers

**ElevenLabs:**
```json
{
  "provider": "elevenlabs",
  "voiceId": "Xb7hH8MSUJpSbSDYk0k2",
  "voiceName": "Alice",
  "modelId": "eleven_turbo_v2_5",
  "apiKey": "optional-override"
}
```

**OpenAI:**
```json
{
  "provider": "openai",
  "voiceName": "alloy",
  "modelId": "tts-1",
  "apiKey": "optional-override"
}
```

## Usage Example

### 1. Create an Agent

```bash
curl -X POST http://localhost:3001/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "sales-agent",
    "instructions": "You are a sales assistant. Help customers find products and answer questions.",
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

### 2. Use the Agent in Frontend

Update your frontend to request the agent by name:

```typescript
// In your token generation
at.roomConfig = new RoomConfiguration({
  agents: [
    new RoomAgentDispatch({
      agentName: 'sales-agent', // Use the agent name from database
    }),
  ],
});
```

### 3. Update Agent Configuration

```bash
curl -X PUT http://localhost:3001/api/agents/sales-agent \
  -H "Content-Type: application/json" \
  -d '{
    "instructions": "Updated sales instructions...",
    "llm": {
      "model": "gpt-4"
    }
  }'
```

## Notes

- Agent names must be unique
- Agents must be `enabled: true` to be used
- API keys can be provided per-agent or use environment variables
- Changes take effect immediately for new connections
- The database is currently in-memory (restarts clear data)
- For production, replace the in-memory database with PostgreSQL, MongoDB, etc.

## Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "agent-api"
}
```

