# 02. Quick Start Guide

> **Get your TAWK.To Voice Agent up and running in 10 minutes.**

---

## Prerequisites

- **Node.js**: v20 or higher
- **pnpm**: v8 or higher (`npm install -g pnpm`)
- **API Keys**:
  - OpenAI API key (https://platform.openai.com/api-keys)
  - Deepgram API key (https://console.deepgram.com/)
  - ElevenLabs API key (https://elevenlabs.io/)
  - LiveKit credentials (self-hosted or https://cloud.livekit.io)

---

## Step 1: Clone & Install

```bash
# Clone the repository
cd tawk-voice-agents-sdk-livekit

# Install dependencies (monorepo)
pnpm install
```

---

## Step 2: Start LiveKit Server

### Option A: Local (Recommended for Development)

```bash
# Download LiveKit server binary
# macOS
curl -L https://github.com/livekit/livekit/releases/latest/download/livekit_darwin_amd64 -o livekit-server
chmod +x livekit-server

# Start server with defaults
./livekit-server --dev
```

The server will start on `ws://localhost:7880` with auto-generated dev keys.

### Option B: LiveKit Cloud

1. Sign up at https://cloud.livekit.io
2. Create a project
3. Copy your API Key, API Secret, and WebSocket URL

---

## Step 3: Configure Backend Environment

Create `packages/backend/.env.local`:

```bash
# LiveKit Server
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret

# AI Services
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=...
ELEVENLABS_API_KEY=...

# Agent Configuration
AGENT_NAME=marketplace-agent
```

**Note**: If using `livekit-server --dev`, the default keys are:
- `LIVEKIT_API_KEY=devkey`
- `LIVEKIT_API_SECRET=secret`

---

## Step 4: Configure Frontend Environment

Create `packages/frontend/.env.local`:

```bash
# LiveKit Server (same as backend)
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret

# Public URL for frontend (used to generate connection tokens)
NEXT_PUBLIC_LIVEKIT_URL=ws://localhost:7880
```

---

## Step 5: Start Backend (Agent Server)

```bash
cd packages/backend
pnpm start
```

You should see:
```
[backend] Starting agent server...
[backend] Marketplace agent started and ready for customer interactions
[backend] Agent server listening on port 8080
```

---

## Step 6: Start Frontend

In a **new terminal**:

```bash
cd packages/frontend
pnpm dev
```

You should see:
```
[frontend] ▲ Next.js 15.x
[frontend] - Local:        http://localhost:3000
[frontend] ✓ Ready in 2.3s
```

---

## Step 7: Test Your Agent!

### Option A: Meet App (Recommended)

1. Open http://localhost:3000
2. Click **"Start Meeting with AI Agent"**
3. Allow microphone access
4. Wait for agent to join (green "AI" participant tile)
5. Speak: **"Hello!"**
6. Agent responds: **"Welcome to TAWK.To Marketplace! ..."**

### Option B: Voice Assistant

1. Open http://localhost:3000/voice-assistant
2. Click **"Start Voice Session"**
3. Allow microphone access
4. Speak: **"I want to buy an iPhone"**
5. Agent responds with product search results

---

## Verify Everything Works

### Check 1: LiveKit Server Running

```bash
# Check LiveKit server status
curl http://localhost:7880
```

Expected: `{"version":"...","protocol":...}`

### Check 2: Agent Server Running

```bash
# Check agent server logs
# You should see:
[backend] Agent server listening on port 8080
```

### Check 3: Frontend Running

Open http://localhost:3000 - you should see the landing page.

### Check 4: Agent Joins Room

1. Start a meeting
2. Check backend logs:
```
[backend] Creating speech handle
[backend] Executing LLM tool call: searchProducts
```

---

## Common Issues

### Issue 1: "Connection failed" in frontend

**Cause**: LiveKit server not running or wrong URL

**Fix**:
```bash
# Verify server is running
curl http://localhost:7880

# Check .env.local has correct URL
cat packages/frontend/.env.local
```

### Issue 2: Agent doesn't join

**Cause**: Backend not running or missing agent name

**Fix**:
```bash
# Restart backend
cd packages/backend
pnpm start

# Check logs for errors
```

### Issue 3: No audio from agent

**Cause**: Missing API keys (OpenAI, Deepgram, ElevenLabs)

**Fix**:
```bash
# Verify all API keys are set
cat packages/backend/.env.local

# Check backend logs for API errors
```

### Issue 4: "Module not found" errors

**Cause**: Dependencies not installed

**Fix**:
```bash
# Reinstall dependencies
pnpm install

# Clear cache and reinstall
rm -rf node_modules
pnpm install
```

---

## What's Next?

### Try These Commands

**1. Search for products**
> "I want to buy an iPhone"

**2. Get product details**
> "Tell me about the Pro Max"

**3. Add to cart**
> "Add it to my cart"

**4. Checkout**
> "Let's checkout with overnight shipping to zip code 10001"

**5. Check inventory**
> "Is the iPhone 15 in stock?"

---

## Learn More

- **[Building Agents](./07-building-agents.md)** - Create custom agents
- **[Tools & Functions](./08-tools-functions.md)** - Add more tools
- **[Configuration](./14-environment-configuration.md)** - All config options
- **[Troubleshooting](./24-troubleshooting.md)** - Fix common issues

---

## Architecture Overview

```
┌──────────────┐      WebRTC       ┌──────────────┐
│   Browser    │◄──────────────────►│   LiveKit    │
│  (Frontend)  │                    │    Server    │
└──────────────┘                    └──────────────┘
                                           ▲
                                           │
                                           │ Agent
                                           │ Protocol
                                           │
                                    ┌──────────────┐
                                    │    Agent     │
                                    │    Server    │
                                    │   (Backend)  │
                                    └──────────────┘
                                           │
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
             ┌──────▼──────┐      ┌───────▼──────┐      ┌───────▼──────┐
             │  Deepgram   │      │   OpenAI     │      │  ElevenLabs  │
             │   (STT)     │      │   (LLM)      │      │    (TTS)     │
             └─────────────┘      └──────────────┘      └──────────────┘
```

---

## Development Workflow

```bash
# Terminal 1: LiveKit Server
./livekit-server --dev

# Terminal 2: Backend (Agent Server)
cd packages/backend && pnpm start

# Terminal 3: Frontend (Next.js)
cd packages/frontend && pnpm dev

# Terminal 4: Watch for changes
pnpm --filter backend build --watch
```

---

## Production Deployment

For production deployment, see:
- **[Production Deployment](./16-production-deployment.md)**
- **[Performance Optimization](./17-performance-optimization.md)**
- **[Security & Authentication](./21-security-authentication.md)**

---

[← Back to Index](./README.md) | [Next: Installation & Setup →](./03-installation-setup.md)

