# LiveKit Voice Agent Monorepo

A complete voice AI application with frontend and backend in a pnpm monorepo.

## 🏗️ Structure

```
livekit-voice-agent-monorepo/
├── packages/
│   ├── backend/          # LiveKit Agent (Node.js)
│   └── frontend/         # React Frontend (Next.js)
├── docker-compose.yml    # LiveKit server & Redis
├── livekit.yaml          # LiveKit server config
└── package.json          # Monorepo root
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Backend (Download Models)

```bash
pnpm --filter backend download-files
```

Or use the setup script:

```bash
pnpm setup
```

### 3. Start LiveKit Server

```bash
pnpm start:livekit
```

### 4. Start Development (Both Frontend & Backend)

```bash
pnpm dev
```

This starts:
- **Backend**: Agent service on default port (connects to LiveKit)
- **Frontend**: Next.js app on http://localhost:3000

## 📋 Available Commands

### Root Level

- `pnpm dev` - Start both frontend and backend
- `pnpm dev:backend` - Start only backend
- `pnpm dev:frontend` - Start only frontend
- `pnpm build` - Build both packages
- `pnpm setup` - Full setup (install + download models)
- `pnpm start:livekit` - Start LiveKit server
- `pnpm stop:livekit` - Stop LiveKit server
- `pnpm logs:livekit` - View LiveKit logs

### Backend (`packages/backend`)

- `pnpm dev` - Run agent in development mode
- `pnpm build` - Build TypeScript
- `pnpm start` - Run in production mode
- `pnpm download-files` - Download ML models

### Frontend (`packages/frontend`)

- `pnpm dev` - Start Next.js dev server
- `pnpm build` - Build for production
- `pnpm start` - Start production server

## ⚙️ Configuration

### Backend Environment

Edit `packages/backend/.env.local`:

```env
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
OPENAI_API_KEY=your_key_here
```

### Frontend Environment

Edit `packages/frontend/.env.local`:

```env
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
```

## 🎯 How It Works

1. **LiveKit Server** runs in Docker (port 7880)
2. **Backend Agent** connects to LiveKit and waits for rooms
3. **Frontend** generates tokens and connects to rooms
4. **LiveKit** automatically assigns agent to room
5. **Voice conversation** begins!

## 🧹 Clean Up

```bash
# Stop all services
pnpm stop:livekit

# Clean build artifacts
pnpm clean

# Remove all node_modules
rm -rf node_modules packages/*/node_modules
```

## 📦 Production Deployment

### Build Everything

```bash
pnpm build
```

### Deploy Backend

```bash
cd packages/backend
docker build -t livekit-agent .
docker run -e LIVEKIT_URL=... -e LIVEKIT_API_KEY=... livekit-agent
```

### Deploy Frontend

```bash
cd packages/frontend
pnpm build
pnpm start
```

## 🔧 Troubleshooting

### Port Conflicts

- Backend: Uses LiveKit's default agent port
- Frontend: Runs on port 3000 (Next.js default)
- LiveKit: Port 7880 (HTTP), 50000-60000 (UDP)

### Agent Not Connecting

- Verify LiveKit server: `curl http://localhost:7880/`
- Check backend logs for connection errors
- Ensure `.env.local` has correct keys

### Frontend Can't Connect

- Verify agent is running: `pnpm dev:backend`
- Check LiveKit server is accessible
- Ensure frontend `.env.local` is configured

## 📚 Documentation

- [Backend Setup](./AGENT_BACKEND_SETUP.md)
- [Frontend Setup](./FRONTEND_SETUP.md)
- [LiveKit Documentation](https://docs.livekit.io)

## 📄 License

MIT
