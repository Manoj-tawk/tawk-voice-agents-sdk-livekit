# 🚀 LiveKit Multi-Interface Voice Agent - START HERE

## 📦 What You've Downloaded

This is a **complete, production-ready** voice agent system that works with:
- ☎️ **Phone Calls** (via Twilio)
- 💬 **WhatsApp** (voice & text via Twilio)
- 🌐 **Web Calls** (Zoom-like browser calls)

**The AI agent joins LiveKit rooms for ALL call types!**

## ⚡ Quick Start (3 Steps)

### Step 1: Install Dependencies

```bash
# Extract the zip file
unzip livekit-multi-provider-poc.zip
cd livekit-multi-provider-poc

# Install Node.js dependencies
npm install
```

### Step 2: Configure Environment

```bash
# Generate LiveKit credentials
npm run generate-keys
# This will output: LIVEKIT_API_KEY and LIVEKIT_API_SECRET

# Create environment file
cp .env.example .env

# Edit .env and add:
nano .env
```

**Required configuration in .env:**

```env
# LiveKit (from generate-keys output)
LIVEKIT_API_KEY=APIxxxxxxxxxx
LIVEKIT_API_SECRET=your-secret-here

# AI Providers (add at least one per category)
OPENAI_API_KEY=sk-...                    # For LLM & TTS
DEEPGRAM_API_KEY=...                     # For STT (recommended)
ELEVENLABS_API_KEY=...                   # For TTS (optional)

# For Phone/WhatsApp (optional - add later)
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
WEBHOOK_URL=https://yourdomain.com
```

### Step 3: Start Services

```bash
# Build and start all services
npm run docker:build
npm run docker:up

# Check if everything is running
curl http://localhost:8080/health
```

**Expected output:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-03T...",
  "agents": 0,
  "uptime": 5.123
}
```

## 🎯 Test It Now

### Option A: Web Call (No Extra Setup Needed)

```bash
# 1. Make sure services are running
npm run docker:up

# 2. Open test-client.html in your browser
open test-client.html  # or double-click the file

# 3. Click "Connect & Start Talking"
# 4. Allow microphone access
# 5. Say "Hello, how are you?"
# 6. Agent will respond!
```

### Option B: Phone Call (Requires Twilio)

```bash
# 1. Sign up at twilio.com
# 2. Buy a phone number ($1/month)
# 3. Configure webhook in Twilio Console:
#    Voice & Fax → Your Number → Voice Configuration
#    URL: https://yourdomain.com/twilio/voice
# 4. Call your Twilio number
# 5. Agent answers and talks to you!
```

### Option C: WhatsApp (Requires Twilio)

```bash
# 1. In Twilio Console → Messaging → WhatsApp Sandbox
# 2. Send "join <code>" to sandbox number
# 3. Configure webhook:
#    URL: https://yourdomain.com/whatsapp/message
# 4. Send a message to the WhatsApp number
# 5. Agent responds!
```

## 📂 What's Included (31 Files)

```
livekit-multi-provider-poc/
├── 📄 Documentation (9 files)
│   ├── START_HERE.md           ← You are here
│   ├── README_UPDATED.md       ← Complete API reference
│   ├── PRODUCTION_READY.md     ← Production readiness guide
│   ├── INTEGRATION.md          ← Integration examples
│   ├── ARCHITECTURE.md         ← System architecture
│   ├── DEPLOYMENT.md           ← Production deployment
│   ├── PROJECT_SUMMARY.md      ← Project overview
│   └── OVERVIEW.md             ← Feature summary
│
├── 🐳 Docker Setup (3 files)
│   ├── docker-compose.yml      ← Service orchestration
│   ├── Dockerfile              ← Agent container
│   └── livekit.yaml            ← LiveKit config
│
├── ⚙️ Configuration (4 files)
│   ├── package.json            ← Dependencies
│   ├── tsconfig.json           ← TypeScript config
│   ├── .env.example            ← Environment template
│   └── .gitignore              ← Git ignore rules
│
├── 🧪 Testing
│   └── test-client.html        ← Browser test client
│
├── 🔧 Scripts (2 files)
│   ├── generate-keys.js        ← Generate LiveKit keys
│   └── quick-start.sh          ← One-command setup
│
└── 💻 Source Code (14 TypeScript files)
    ├── src/
    │   ├── index.ts                    ← Main server
    │   ├── types.ts                    ← TypeScript types
    │   │
    │   ├── agent/
    │   │   └── livekit-agent.ts        ← Voice agent core
    │   │
    │   ├── connectors/                 ← 🆕 Multi-interface support
    │   │   ├── twilio.ts               ← Phone calls
    │   │   ├── whatsapp.ts             ← WhatsApp integration
    │   │   ├── web.ts                  ← Web calls
    │   │   └── unified.ts              ← Unified manager
    │   │
    │   ├── config/
    │   │   └── index.ts                ← Config loader
    │   │
    │   ├── pipeline/
    │   │   └── multi-provider.ts       ← AI provider orchestrator
    │   │
    │   ├── providers/
    │   │   ├── base.ts                 ← Base provider
    │   │   ├── stt/                    ← Speech-to-Text
    │   │   │   ├── deepgram.ts
    │   │   │   └── openai.ts
    │   │   ├── llm/                    ← Language Models
    │   │   │   ├── openai.ts
    │   │   │   ├── anthropic.ts
    │   │   │   └── groq.ts
    │   │   └── tts/                    ← Text-to-Speech
    │   │       ├── elevenlabs.ts
    │   │       └── openai.ts
    │   │
    │   └── utils/
    │       └── logger.ts               ← Logging utility
```

## 🔑 Key Features

### ✅ Multi-Interface Calling
Every interface creates a LiveKit room where the AI agent joins:
- **Phone** → Room: `twilio-{CallSid}` → Agent joins
- **WhatsApp** → Room: `whatsapp-{CallSid}` → Agent joins
- **Web** → Room: `{custom-name}` → Agent joins

### ✅ Multi-Provider AI
Automatic fallback if providers fail:
- **STT**: Deepgram → OpenAI Whisper
- **LLM**: OpenAI GPT → Anthropic Claude → Groq Llama
- **TTS**: ElevenLabs → OpenAI TTS

### ✅ Production Features
- Docker containerization
- Health checks & metrics
- Comprehensive logging
- Error handling at every layer
- Session management
- Webhook handling
- Audio format conversion

## 📚 Documentation Guide

**Start with these in order:**

1. **START_HERE.md** (this file)
   - Quick setup
   - First tests
   - What's included

2. **PRODUCTION_READY.md**
   - What's actually production-ready
   - What you still need
   - Verification steps

3. **README_UPDATED.md**
   - Complete API reference
   - Usage examples
   - All endpoints

4. **INTEGRATION.md**
   - Phone call setup
   - WhatsApp setup
   - Web call integration
   - Code examples

5. **DEPLOYMENT.md**
   - Production deployment
   - SSL/TLS setup
   - Scaling strategies
   - Security

6. **ARCHITECTURE.md**
   - System design
   - Data flow
   - Component details

## 🛠️ Commands Reference

```bash
# Development
npm install                 # Install dependencies
npm run dev                 # Run in development mode
npm run build               # Build TypeScript
npm start                   # Run production build

# Docker
npm run docker:build        # Build Docker images
npm run docker:up           # Start all services
npm run docker:down         # Stop all services
npm run docker:logs         # View logs

# Utilities
npm run generate-keys       # Generate LiveKit keys
./scripts/quick-start.sh    # One-command setup (Linux/Mac)
```

## 🔌 API Endpoints (Quick Reference)

### Phone Calls
```bash
POST /phone/call              # Make outbound call
POST /phone/end/:callSid      # End call
POST /twilio/voice            # Incoming call webhook
```

### WhatsApp
```bash
POST /whatsapp/send           # Send message
POST /whatsapp/call           # Make call
POST /whatsapp/message        # Incoming message webhook
```

### Web Calls
```bash
POST /room/create             # Create room
POST /room/join               # Join room
POST /room/:name/agent        # Toggle agent
DELETE /room/:name            # Close room
```

### Monitoring
```bash
GET /health                   # Service health
GET /metrics                  # Performance metrics
GET /sessions                 # All active sessions
GET /sessions/type/:type      # Filter by type
```

## 🎯 What You Need to Provide

### Immediately (to test)
- ✅ AI Provider API Keys
  - At least: OpenAI OR (Deepgram + Anthropic + ElevenLabs)
  - Get from: openai.com, deepgram.com, anthropic.com, elevenlabs.io

### For Phone/WhatsApp
- ✅ Twilio Account
  - Sign up: twilio.com
  - Buy phone number: ~$1/month
  - Get WhatsApp access (sandbox = free, production = approval needed)

### For Production
- ✅ Public Domain
  - For Twilio webhooks
  - Use: Your own domain OR ngrok (for testing)
- ✅ SSL Certificate
  - Use: Let's Encrypt (free)
  - Or: Your certificate provider

### For Web Calls (Optional)
- ✅ Frontend Application
  - React/Vue/Angular app
  - Use our integration examples
  - See: INTEGRATION.md

## 🚨 Troubleshooting

### Services won't start

```bash
# Check Docker is running
docker info

# Check ports are free
lsof -i :8080  # Agent service
lsof -i :7880  # LiveKit
lsof -i :6379  # Redis

# View logs
npm run docker:logs
```

### Twilio webhooks not working

```bash
# For local testing, use ngrok
ngrok http 8080

# Update .env with ngrok URL
WEBHOOK_URL=https://abc123.ngrok.io

# Restart services
npm run docker:down
npm run docker:up

# Update Twilio Console with ngrok URL
```

### Agent not responding

```bash
# Check API keys in .env
cat .env | grep API_KEY

# Check agent logs
docker-compose logs agent

# Test agent service
curl http://localhost:8080/health
```

## 📞 Getting Help

1. **Check logs**: `npm run docker:logs`
2. **Review docs**: See documentation files
3. **Test endpoints**: `curl http://localhost:8080/health`
4. **Check configuration**: Review `.env` file

## ✅ Pre-Flight Checklist

Before deploying to production:

**Configuration:**
- [ ] LiveKit credentials generated
- [ ] AI provider API keys added
- [ ] Twilio account configured (if using phone/WhatsApp)
- [ ] Webhook URL set correctly
- [ ] Environment variables secured

**Testing:**
- [ ] Web call test successful
- [ ] Phone call test successful (if applicable)
- [ ] WhatsApp test successful (if applicable)
- [ ] Health check passing
- [ ] Logs are clean

**Production:**
- [ ] SSL certificates installed
- [ ] Firewall rules configured
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Documentation reviewed

## 🎉 Next Steps

### 1. Get It Running (5 minutes)
```bash
npm install
npm run generate-keys
cp .env.example .env
# Add your API keys to .env
npm run docker:up
```

### 2. Test Web Call (1 minute)
```bash
open test-client.html
# Click connect, allow mic, start talking!
```

### 3. Add Phone Integration (15 minutes)
- Sign up for Twilio
- Buy phone number
- Configure webhooks
- Call your number!

### 4. Deploy to Production (30 minutes)
- Follow DEPLOYMENT.md
- Set up SSL
- Configure domain
- Deploy!

## 🌟 You're All Set!

You now have a **complete, production-ready** multi-interface voice agent system.

**Questions?**
- Architecture: Read `ARCHITECTURE.md`
- Integration: Read `INTEGRATION.md`
- Deployment: Read `DEPLOYMENT.md`
- API: Read `README_UPDATED.md`

**Ready to go?**
```bash
npm run docker:up
open test-client.html
# Start talking! 🎤
```

---

**Built with ❤️ for the voice AI community**

Version: 1.0.0 | Production Ready | All Interfaces Supported
