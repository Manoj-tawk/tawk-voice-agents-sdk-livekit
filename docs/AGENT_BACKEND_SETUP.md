# Agent Backend Setup Guide

This guide shows how to use `agent-starter-node` as your backend with the self-hosted LiveKit server.

## Quick Start

### 1. Navigate to Agent Directory

```bash
cd repos/agent-starter-node
```

### 2. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# OR using npm
npm install
```

### 3. Set Up Environment

The `.env.local` file has been created with:
```env
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
OPENAI_API_KEY=your_openai_key_here
```

**Important**: Add your `OPENAI_API_KEY` to `.env.local` if you haven't already.

### 4. Download Model Files

The agent needs to download ML models (VAD, turn detector, etc.):

```bash
pnpm download-files
```

Or if using npm:
```bash
npm run download-files
```

### 5. Start the Agent

Run in development mode:

```bash
pnpm dev
```

Or with npm:
```bash
npm run dev
```

## How It Works

### Agent Framework

The `agent-starter-node` uses the official `@livekit/agents` framework which:
- Automatically connects to LiveKit server
- Handles room creation and joining
- Manages agent lifecycle
- Provides voice AI pipeline (STT → LLM → TTS)

### Connection Flow

1. **Agent starts** → Connects to LiveKit server at `ws://localhost:7880`
2. **Frontend requests connection** → Calls `/api/connection-details`
3. **Frontend gets token** → Connects to LiveKit room
4. **LiveKit server** → Automatically assigns agent to room
5. **Agent joins room** → Voice AI conversation begins

### No Custom Backend Needed!

Unlike the custom backend, this approach:
- ✅ Uses official LiveKit Agents framework
- ✅ Handles all connection logic automatically
- ✅ No need for custom `/agent/create` endpoint
- ✅ Works seamlessly with LiveKit's agent system
- ✅ Production-ready out of the box

## Frontend Integration

The frontend (`agent-starter-react`) works automatically with this setup:

1. Frontend calls `/api/connection-details`
2. Next.js API generates token (no agent creation needed)
3. Frontend connects to LiveKit
4. LiveKit automatically assigns the running agent to the room

## Configuration

### Environment Variables

Edit `.env.local` in `repos/agent-starter-node/`:

```env
# LiveKit Server (self-hosted)
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret

# AI Provider Keys
OPENAI_API_KEY=your_key_here
```

### Agent Configuration

Edit `src/agent.ts` to customize:
- Agent instructions
- STT/LLM/TTS models
- Voice options
- Turn detection settings

## Production Deployment

For production:

1. **Build the agent:**
   ```bash
   pnpm build
   ```

2. **Start in production mode:**
   ```bash
   pnpm start
   ```

3. **Or use Docker:**
   ```bash
   docker build -t livekit-agent .
   docker run -e LIVEKIT_URL=... -e LIVEKIT_API_KEY=... livekit-agent
   ```

## Troubleshooting

### Agent Not Connecting

- Verify LiveKit server is running: `curl http://localhost:7880/`
- Check `.env.local` has correct keys
- Ensure agent is running: `pnpm dev`

### Model Files Missing

- Run `pnpm download-files` before starting
- Check internet connection (models download from internet)

### Frontend Can't Connect

- Verify agent is running and connected
- Check LiveKit server is accessible
- Ensure frontend `.env.local` has correct `LIVEKIT_URL`

## Advantages Over Custom Backend

✅ **Official Framework**: Uses `@livekit/agents` - the recommended way
✅ **Automatic Management**: LiveKit handles agent assignment
✅ **Better Error Handling**: Built-in retry and error recovery
✅ **Production Ready**: Includes metrics, logging, and monitoring
✅ **Easier Updates**: Follow LiveKit's update path
✅ **Less Code**: No need to manage connections manually

