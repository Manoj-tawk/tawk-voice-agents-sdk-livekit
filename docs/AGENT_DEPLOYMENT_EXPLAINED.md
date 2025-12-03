# 🚀 How Agent Deployment Works with LiveKit

## Architecture Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │────────▶│ LiveKit      │────────▶│   Agent     │
│  (Browser)  │  Token  │   Server     │ Dispatch│   Worker    │
└─────────────┘         └──────────────┘         └─────────────┘
                              │
                              │ Manages
                              ▼
                        ┌──────────────┐
                        │ Agent Server │
                        │  (Worker)    │
                        └──────────────┘
```

## How It Works: Step-by-Step

### 1. **Agent Server (Worker) Registration**

When you run `pnpm dev` in the backend, your agent code:

```typescript
cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: 'Quinn_353',  // ← Agent registers with this name
  }),
);
```

**What happens:**
- Agent server connects to LiveKit server
- Registers itself as available worker
- Announces: "I can handle agent jobs for agent name: `Quinn_353`"
- Waits for job requests from LiveKit server

### 2. **Frontend Requests Connection**

When user clicks "Start call" in frontend:

```typescript
// Frontend generates token with agent dispatch request
at.roomConfig = new RoomConfiguration({
  agents: [
    new RoomAgentDispatch({
      agentName: 'Quinn_353',  // ← Requests this agent
    }),
  ],
});
```

**What happens:**
- Frontend generates LiveKit token
- Token includes `RoomConfiguration` with `agentName: 'Quinn_353'`
- Frontend connects to LiveKit room with this token

### 3. **LiveKit Server Dispatches Agent**

LiveKit server receives the connection request:

**What happens:**
- Sees token has `RoomConfiguration` with `agentName: 'Quinn_353'`
- Looks for available agent server that handles `'Quinn_353'`
- Finds your agent server (from step 1)
- Creates a **Job** and sends it to your agent server
- Job includes: room name, participant info, metadata

### 4. **Agent Server Spawns Job Process**

Your agent server receives the job:

**What happens:**
- Agent server spawns a **new process** for this job
- Runs your `entry` function in that process
- Each job runs in isolation (crash in one job doesn't affect others)

### 5. **Agent Joins Room**

Your agent code executes:

```typescript
export default defineAgent({
  entry: async (ctx: JobContext) => {
    // ctx.room is already set up by LiveKit
    const session = new voice.AgentSession({...});
    
    await session.start({
      agent: new DefaultAgent(),
      room: ctx.room,  // ← Agent connects to this room
    });
  },
});
```

**What happens:**
- Agent connects to the LiveKit room
- Agent becomes a participant in the room
- Frontend sees agent participant join
- Conversation begins!

## Deployment Modes

### Development Mode (`pnpm dev`)

```typescript
// Runs: tsx src/agent.ts dev
cli.runApp(new ServerOptions({ agent: ... }));
```

**Characteristics:**
- Runs locally on your machine
- Connects to LiveKit server (local or cloud)
- Good for testing and debugging
- Single worker instance

### Production Mode (Deployed)

**Option 1: LiveKit Cloud Deployment**

```bash
lk agent create  # Deploys to LiveKit Cloud
```

**What happens:**
- CLI creates Dockerfile
- Builds Docker image
- Pushes to LiveKit Cloud
- LiveKit Cloud runs your agent as a managed service
- Auto-scales based on load

**Option 2: Self-Hosted Deployment**

```bash
# Build Docker image
docker build -t my-agent .

# Run agent server
docker run -e LIVEKIT_URL=... -e LIVEKIT_API_KEY=... my-agent
```

**What happens:**
- Your agent server runs in your infrastructure
- Connects to your LiveKit server
- You manage scaling and availability

## Agent Dispatch Types

### 1. **Explicit Dispatch** (What You're Using)

```typescript
// Backend: Register with agentName
new ServerOptions({ agentName: 'Quinn_353' })

// Frontend: Request specific agent
new RoomAgentDispatch({ agentName: 'Quinn_353' })
```

**How it works:**
- Agent only joins when explicitly requested
- Frontend must include agent in token
- Allows multiple agents in same project
- **This is what you're using!**

### 2. **Automatic Dispatch**

```typescript
// Backend: No agentName specified
new ServerOptions({ agent: ... })  // No agentName
```

**How it works:**
- Agent automatically joins every new room
- No need to request in token
- Simpler but less flexible

## Job Lifecycle

```
1. Job Created
   └─ LiveKit server creates job request
   
2. Job Dispatched
   └─ Sent to available agent server
   
3. Process Spawned
   └─ Agent server creates new process
   
4. Entry Function Runs
   └─ Your `entry` function executes
   
5. Agent Connects
   └─ Agent joins LiveKit room
   
6. Session Active
   └─ Agent handles conversation
   
7. Job Completes
   └─ All participants leave or agent shuts down
   
8. Process Terminates
   └─ Cleanup and shutdown hooks run
```

## Key Concepts

### Agent Server (Worker)
- **What:** The process that runs your agent code
- **Role:** Receives job requests, spawns processes
- **Lifetime:** Runs continuously, handles multiple jobs

### Job
- **What:** A single agent instance assignment
- **Role:** One conversation/session
- **Lifetime:** From dispatch to room empty

### Job Process
- **What:** Isolated process for one job
- **Role:** Runs your agent code safely
- **Lifetime:** Spawned per job, terminates when done

### Agent Name
- **What:** Identifier for your agent type
- **Role:** Routes dispatch requests to correct agent
- **Your case:** `'Quinn_353'`

## Your Current Setup

### Backend (Agent Server)
```typescript
// Registers as agent server for 'Quinn_353'
cli.runApp(new ServerOptions({
  agent: fileURLToPath(import.meta.url),
  agentName: 'Quinn_353',  // ← Registers with this name
}));
```

### Frontend (Token Generation)
```typescript
// Requests 'Quinn_353' agent when connecting
at.roomConfig = new RoomConfiguration({
  agents: [
    new RoomAgentDispatch({
      agentName: 'Quinn_353',  // ← Requests this agent
    }),
  ],
});
```

### Flow
1. Backend runs → Registers as `'Quinn_353'` handler
2. Frontend connects → Token requests `'Quinn_353'`
3. LiveKit matches → Dispatches job to your agent server
4. Agent joins → Conversation starts!

## Deployment Checklist

### For Development (Current Setup)
- ✅ LiveKit server running (`pnpm start:livekit`)
- ✅ Backend agent running (`pnpm dev:backend`)
- ✅ Frontend running (`pnpm dev:frontend`)
- ✅ Agent name matches: `'Quinn_353'` in both

### For Production (LiveKit Cloud)
```bash
# 1. Link your project
lk cloud auth

# 2. Deploy agent
lk agent create

# 3. Agent auto-deploys and scales
```

### For Production (Self-Hosted)
```bash
# 1. Build Docker image
docker build -t my-agent packages/backend

# 2. Run agent server
docker run \
  -e LIVEKIT_URL=wss://your-server.com \
  -e LIVEKIT_API_KEY=... \
  -e LIVEKIT_API_SECRET=... \
  my-agent
```

## Important Notes

1. **Agent Name Must Match**
   - Backend `agentName` = Frontend `agentName`
   - Case-sensitive: `'Quinn_353'` ≠ `'quinn_353'`

2. **Explicit Dispatch Required**
   - When you set `agentName`, automatic dispatch is disabled
   - Frontend MUST request agent in token

3. **One Agent Server, Many Jobs**
   - One agent server can handle many concurrent jobs
   - Each job runs in separate process

4. **LiveKit Manages Load Balancing**
   - Multiple agent servers → LiveKit balances jobs
   - High availability and scaling

## References

- [Agent Dispatch Docs](https://docs.livekit.io/agents/server/agent-dispatch)
- [Job Lifecycle Docs](https://docs.livekit.io/agents/server/job)
- [Deployment Docs](https://docs.livekit.io/agents/ops/deployment)

