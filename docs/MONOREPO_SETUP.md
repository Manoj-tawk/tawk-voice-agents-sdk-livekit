# Monorepo Setup Guide

This project is now organized as a pnpm monorepo with frontend and backend packages.

## 📁 Structure

```
livekit-voice-agent-monorepo/
├── packages/
│   ├── backend/          # LiveKit Agent (Node.js)
│   │   ├── src/
│   │   ├── .env.local
│   │   └── package.json
│   └── frontend/         # React Frontend (Next.js)
│       ├── app/
│       ├── .env.local
│       └── package.json
├── docker-compose.yml    # LiveKit server & Redis
├── livekit.yaml          # LiveKit server config
├── pnpm-workspace.yaml   # Workspace configuration
└── package.json          # Root package with scripts
```

## 🚀 Quick Start

### One Command Setup

```bash
pnpm setup
```

This will:
1. Install all dependencies
2. Download ML models for backend

### Start Everything

```bash
# Start LiveKit server
pnpm start:livekit

# Start both frontend and backend
pnpm dev
```

Then open http://localhost:3000

## 📋 Available Commands

### Root Level (Monorepo)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start both frontend and backend concurrently |
| `pnpm dev:backend` | Start only backend |
| `pnpm dev:frontend` | Start only frontend |
| `pnpm build` | Build both packages |
| `pnpm setup` | Install dependencies + download models |
| `pnpm start:livekit` | Start LiveKit server (Docker) |
| `pnpm stop:livekit` | Stop LiveKit server |
| `pnpm logs:livekit` | View LiveKit logs |

### Backend (`packages/backend`)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run agent in development mode |
| `pnpm build` | Build TypeScript |
| `pnpm start` | Run in production mode |
| `pnpm download-files` | Download ML models (VAD, turn detector) |

### Frontend (`packages/frontend`)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js dev server (port 3000) |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |

## ⚙️ Configuration

### Backend Environment

`packages/backend/.env.local`:

```env
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
OPENAI_API_KEY=your_key_here
```

### Frontend Environment

`packages/frontend/.env.local`:

```env
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
```

## 🔄 Development Workflow

1. **Start LiveKit server:**
   ```bash
   pnpm start:livekit
   ```

2. **Start development:**
   ```bash
   pnpm dev
   ```
   
   This starts:
   - Backend agent (connects to LiveKit)
   - Frontend (http://localhost:3000)

3. **Open browser:**
   - Navigate to http://localhost:3000
   - Click "Start call"
   - Agent automatically joins the room

## 🧪 End-to-End Testing

### Full E2E Test

```bash
# 1. Setup (first time only)
pnpm setup

# 2. Start LiveKit
pnpm start:livekit

# 3. Start both services
pnpm dev

# 4. Test in browser
# Open http://localhost:3000
# Click "Start call"
# Speak to the agent
```

### Verify Services

```bash
# Check LiveKit
curl http://localhost:7880/

# Check backend (should see agent logs)
# Check frontend (should be accessible at http://localhost:3000)
```

## 🧹 Clean Up

```bash
# Stop all services
pnpm stop:livekit

# Clean build artifacts
pnpm clean

# Remove all dependencies
rm -rf node_modules packages/*/node_modules
```

## 📦 Package Details

### Backend (`@livekit-voice-agent/backend`)

- **Framework**: `@livekit/agents`
- **Language**: TypeScript
- **Models**: AssemblyAI (STT), OpenAI (LLM), Cartesia (TTS)
- **Features**: VAD, turn detection, noise cancellation

### Frontend (`@livekit-voice-agent/frontend`)

- **Framework**: Next.js 15 + React 19
- **UI**: Tailwind CSS + Radix UI
- **SDK**: `@livekit/components-react`
- **Features**: Voice, video, screen share, transcription

## 🔧 Troubleshooting

### pnpm Version

If you see version errors, update pnpm:
```bash
pnpm i -g pnpm@latest
```

### Port Conflicts

- **Frontend**: 3000 (Next.js default)
- **Backend**: Uses LiveKit agent port
- **LiveKit**: 7880 (HTTP), 50000-60000 (UDP)

### Agent Not Connecting

1. Verify LiveKit is running: `curl http://localhost:7880/`
2. Check backend logs for connection errors
3. Ensure `.env.local` files are configured

### Models Not Downloaded

Run manually:
```bash
pnpm --filter backend download-files
```

## 📚 Next Steps

- Customize agent instructions in `packages/backend/src/agent.ts`
- Modify frontend UI in `packages/frontend/components/`
- Add more AI providers
- Deploy to production

## 🎯 Production Deployment

### Build Everything

```bash
pnpm build
```

### Deploy Backend

```bash
cd packages/backend
docker build -t livekit-agent .
docker run -e LIVEKIT_URL=... livekit-agent
```

### Deploy Frontend

```bash
cd packages/frontend
pnpm build
pnpm start
```

Or use Vercel/Netlify for automatic deployments.

