# 🚀 Quick Test Guide - LiveKit Voice Agent

## Architecture Overview (What We're Testing)

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │────────▶│ LiveKit      │────────▶│   Agent     │
│  (Frontend) │  Token  │   Server     │ Dispatch│   Worker    │
│             │         │              │         │  (Backend)   │
└─────────────┘         └──────────────┘         └─────────────┘
   Port 3000              Port 7880              Port (dynamic)
```

## 🎯 Quick Start (One Command!)

```bash
./test-agent.sh
```

This script will:
1. ✅ Check prerequisites
2. ✅ Verify environment files
3. ✅ Install dependencies (if needed)
4. ✅ Download model files
5. ✅ Start LiveKit server
6. ✅ Start backend agent
7. ✅ Start frontend

## 📋 Manual Start (Step by Step)

### Terminal 1: LiveKit Server
```bash
pnpm start:livekit
```

**Expected output:**
```
LiveKit server starting...
Listening on 0.0.0.0:7880
```

### Terminal 2: Backend Agent + Frontend
```bash
pnpm dev
```

**Expected output:**
```
[backend] Agent server starting...
[backend] Registered agent: Quinn_353
[frontend] Next.js dev server starting...
[frontend] Ready on http://localhost:3000
```

### Terminal 3: Open Browser
```
http://localhost:3000
```

## ✅ What to Expect

### 1. **Frontend Loads**
- You see the LiveKit Voice Agent UI
- "Start call" button is visible

### 2. **Click "Start call"**
- Browser asks for microphone permission
- Frontend generates token with `agentName: 'Quinn_353'`
- Connects to LiveKit room

### 3. **Agent Joins** (Backend logs show)
```
[agent-Quinn_353] Job received
[agent-Quinn_353] Connecting to room: voice_assistant_room_XXXX
[agent-Quinn_353] Agent session started
```

### 4. **Agent Greets You**
- Agent says: "Hello! How can I help you today?"
- You can start talking!

### 5. **Conversation**
- You speak → Agent listens (STT: Deepgram)
- Agent thinks → (LLM: OpenAI GPT-4o-mini)
- Agent responds → (TTS: ElevenLabs)

## 🔍 How to Verify It's Working

### Check Agent Registration
Look for this in backend logs:
```
Registered agent server for: Quinn_353
```

### Check Frontend Connection
Look for this in browser console:
```
Connected to LiveKit room
Agent participant joined
```

### Check Agent Joining
Look for this in backend logs:
```
[agent-Quinn_353] Entry function called
[agent-Quinn_353] Session started
```

## 🐛 Troubleshooting

### Agent Not Joining?

1. **Check agent name matches:**
   - Backend: `agentName: 'Quinn_353'` in `packages/backend/src/agent.ts`
   - Frontend: `agentName: 'Quinn_353'` in `packages/frontend/app/api/connection-details/route.ts`

2. **Check LiveKit server is running:**
   ```bash
   curl http://localhost:7880/
   ```

3. **Check backend is running:**
   ```bash
   # Should see: "Registered agent server"
   ```

4. **Check frontend token generation:**
   - Open browser DevTools → Network tab
   - Click "Start call"
   - Check `/api/connection-details` request
   - Response should have `participant_token` and `server_url`

### Connection Errors?

1. **ERR_CONNECTION_REFUSED:**
   - LiveKit server not running → Start it: `pnpm start:livekit`

2. **Agent not found:**
   - Backend not running → Start it: `pnpm dev:backend`
   - Agent name mismatch → Check both files match

3. **WebRTC connection failed:**
   - Check LiveKit server logs
   - Ensure ports 7880, 7881, 50000-50100 are available

## 📊 Monitoring

### LiveKit Server Logs
```bash
# If started with test-agent.sh
tail -f /tmp/livekit.log

# If started manually, check the terminal
```

### Backend Logs
- Check Terminal 2 (where `pnpm dev` is running)
- Look for `[agent-Quinn_353]` prefixed messages

### Frontend Logs
- Open browser DevTools → Console
- Look for LiveKit connection messages

## 🎉 Success Indicators

✅ **All working when you see:**
1. Frontend loads at http://localhost:3000
2. "Start call" button works
3. Microphone permission granted
4. Agent says "Hello! How can I help you?"
5. You can talk and agent responds
6. Backend logs show conversation metrics

## 🔄 Testing Flow

```
1. Start services
   ↓
2. Open browser → http://localhost:3000
   ↓
3. Click "Start call"
   ↓
4. Allow microphone
   ↓
5. Agent greets you
   ↓
6. Start talking!
   ↓
7. Agent responds
   ↓
8. Continue conversation
```

## 📝 Next Steps

Once it's working:
- ✅ Test different questions
- ✅ Test interruptions (agent should handle them)
- ✅ Check metrics in backend logs
- ✅ Try deploying to LiveKit Cloud: `lk agent create`

## 🆘 Need Help?

Check the full documentation:
- `docs/AGENT_DEPLOYMENT_EXPLAINED.md` - Architecture details
- `docs/TEST_AGENT.md` - Detailed testing guide

