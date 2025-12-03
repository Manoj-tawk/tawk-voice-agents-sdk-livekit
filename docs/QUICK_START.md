# Quick Start Guide

## 🚀 One Command to Run Everything

```bash
pnpm dev
```

This starts both frontend and backend concurrently!

## 📋 Full Setup (First Time)

```bash
# 1. Install dependencies
pnpm install

# 2. Download ML models
pnpm --filter backend download-files

# 3. Start LiveKit server
pnpm start:livekit

# 4. Start both services
pnpm dev
```

## 🎯 What Happens

1. **Backend** connects to LiveKit server
2. **Frontend** starts on http://localhost:3000
3. **User** opens browser and clicks "Start call"
4. **Agent** automatically joins the room
5. **Voice conversation** begins!

## ⚙️ Configuration

Both packages have `.env.local` files configured with:
- `LIVEKIT_URL=ws://localhost:7880`
- `LIVEKIT_API_KEY=devkey`
- `LIVEKIT_API_SECRET=secret`

## 🛑 Stop Everything

```bash
# Stop dev servers (Ctrl+C)
# Stop LiveKit
pnpm stop:livekit
```

## 📚 More Info

- [Monorepo Setup](./MONOREPO_SETUP.md)
- [Backend Setup](./AGENT_BACKEND_SETUP.md)
- [Frontend Setup](./FRONTEND_SETUP.md)
