# LiveKit Multi-Provider Voice Agent - Production Ready

A **truly production-ready** voice agent system that connects to ANY calling interface:
- ☎️ **Phone Calls** (via Twilio)
- 💬 **WhatsApp** (voice & text via Twilio)
- 🌐 **Web Calls** (Zoom-like video calls)

The AI agent joins rooms regardless of the interface - all calls happen in LiveKit rooms where the agent can join, talk, and leave seamlessly.

## 🎯 What This Actually Does

### The Problem This Solves
You want ONE AI voice agent that can handle calls from:
1. Someone calling your business phone number
2. Someone messaging/calling via WhatsApp  
3. Someone joining a web-based video call (like Zoom)

### The Solution
**Unified Room Architecture**: Every call creates a LiveKit room. The AI agent joins that room, processes audio (STT → LLM → TTS), and responds - regardless of whether the call came from a phone, WhatsApp, or web browser.

```
Phone Call → Twilio → LiveKit Room → AI Agent
WhatsApp  → Twilio → LiveKit Room → AI Agent  
Web Call  → Direct → LiveKit Room → AI Agent
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CALLING INTERFACES                       │
├──────────────┬──────────────────┬──────────────────────────┤
│   Phone      │     WhatsApp     │      Web Browser         │
│   (Twilio)   │     (Twilio)     │      (Direct)            │
└──────┬───────┴────────┬─────────┴──────────┬───────────────┘
       │                │                     │
       └────────────────┴─────────────────────┘
                        │
                        ▼
       ┌────────────────────────────────────┐
       │   Unified Connector Manager        │
       │   - Routes all calls to rooms      │
       │   - Manages agent lifecycle        │
       └────────────────┬───────────────────┘
                        │
                        ▼
       ┌────────────────────────────────────┐
       │        LiveKit Rooms               │
       │   Each call = One room             │
       │   Agent joins/leaves as needed     │
       └────────────────┬───────────────────┘
                        │
                        ▼
       ┌────────────────────────────────────┐
       │     AI Voice Agent                 │
       │   STT → LLM → TTS Pipeline         │
       │   Multi-provider with fallback     │
       └────────────────────────────────────┘
```

## ✨ Key Features

### Multi-Interface Support
- ✅ **Phone Calls**: Inbound/outbound via Twilio
- ✅ **WhatsApp**: Voice calls AND text messages
- ✅ **Web Calls**: Browser-based video calls (Zoom-like)
- ✅ **Unified Management**: One API for all call types

### Room-Based Architecture  
- ✅ Each call creates a LiveKit room
- ✅ Agent joins room automatically
- ✅ Agent can be toggled on/off mid-call
- ✅ Multiple participants can join same room
- ✅ Clean room cleanup on call end

### Production Features
- ✅ Multi-provider AI (STT/LLM/TTS) with automatic fallback
- ✅ Audio format conversion (μ-law ↔ PCM)
- ✅ Session management and tracking
- ✅ Comprehensive logging and metrics
- ✅ Webhook handling for Twilio
- ✅ WebSocket streaming for real-time audio

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Required
- Docker & Docker Compose
- Node.js 20+
- Twilio Account (for phone/WhatsApp)
- AI Provider API Keys (OpenAI, Deepgram, etc.)

# Optional but recommended
- Public domain with HTTPS (for webhooks)
- ngrok (for local testing with Twilio)
```

### 2. Installation

```bash
# Install dependencies
npm install

# Generate LiveKit credentials
npm run generate-keys

# Configure environment
cp .env.example .env
# Edit .env with your credentials
```

### 3. Configuration

Edit `.env`:

```env
# LiveKit (from generate-keys)
LIVEKIT_API_KEY=your-generated-key
LIVEKIT_API_SECRET=your-generated-secret

# AI Providers (at least one per category)
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=...
ELEVENLABS_API_KEY=...

# Twilio (for phone/WhatsApp)
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Your public webhook URL
WEBHOOK_URL=https://yourdomain.com
```

### 4. Start Services

```bash
# Start all services
npm run docker:build
npm run docker:up

# Verify
curl http://localhost:8080/health
```

## 📞 Usage Examples

### Phone Calls

#### Receive Incoming Call

Twilio will POST to your webhook when someone calls:

```bash
# Configure in Twilio Console:
# Voice & Fax → Phone Numbers → Your Number
# Voice Configuration:
#   When a call comes in: POST to https://yourdomain.com/twilio/voice
```

The agent automatically:
1. Creates a LiveKit room (`twilio-{callSid}`)
2. Joins the room
3. Starts listening
4. Responds to speech

#### Make Outbound Call

```bash
curl -X POST http://localhost:8080/phone/call \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "from": "+0987654321"
  }'
```

### WhatsApp

#### Text Messages

```bash
# Configure Twilio WhatsApp Sandbox:
# Messaging → Settings → WhatsApp sandbox settings
# When a message comes in: POST to https://yourdomain.com/whatsapp/message
```

Send message to WhatsApp number, agent responds automatically.

#### Send Outbound WhatsApp Message

```bash
curl -X POST http://localhost:8080/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "whatsapp:+1234567890",
    "message": "Hello from AI assistant!"
  }'
```

#### WhatsApp Voice Calls

```bash
# Configure in Twilio:
# Voice Configuration for WhatsApp number
# POST to https://yourdomain.com/whatsapp/voice
```

### Web Calls (Zoom-like)

#### Create a Room

```bash
curl -X POST http://localhost:8080/room/create \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "my-meeting",
    "hostIdentity": "user123",
    "hostName": "John Doe"
  }'

# Returns:
{
  "success": true,
  "roomName": "my-meeting",
  "hostToken": "eyJhbG...",
  "roomUrl": "https://yourapp.com/room/my-meeting"
}
```

#### Join Room

```bash
curl -X POST http://localhost:8080/room/join \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "my-meeting",
    "participantIdentity": "user456",
    "participantName": "Jane Smith"
  }'

# Returns:
{
  "success": true,
  "token": "eyJhbG...",
  "roomUrl": "https://yourapp.com/room/my-meeting",
  "agentPresent": true
}
```

#### Toggle Agent in Room

```bash
# Enable agent
curl -X POST http://localhost:8080/room/my-meeting/agent \
  -H "Content-Type: application/json" \
  -d '{"enable": true}'

# Disable agent
curl -X POST http://localhost:8080/room/my-meeting/agent \
  -H "Content-Type: application/json" \
  -d '{"enable": false}'
```

## 🔌 API Endpoints

### Phone Calls
- `POST /twilio/voice` - Twilio webhook for incoming calls
- `POST /twilio/status` - Call status updates
- `POST /phone/call` - Make outbound call
- `POST /phone/end/:callSid` - End active call

### WhatsApp
- `POST /whatsapp/message` - Incoming message webhook
- `POST /whatsapp/voice` - Incoming call webhook
- `POST /whatsapp/send` - Send message
- `POST /whatsapp/call` - Make outbound call

### Web Rooms
- `POST /room/create` - Create new room
- `POST /room/join` - Join existing room
- `POST /room/:roomName/agent` - Toggle agent
- `POST /room/:roomName/leave` - Leave room
- `DELETE /room/:roomName` - Close room

### Unified Management
- `GET /sessions` - All active sessions
- `GET /sessions/:sessionId` - Specific session
- `GET /sessions/type/:type` - Filter by type (phone/whatsapp/web)
- `GET /health` - Service health
- `GET /metrics` - Performance metrics

## 🛠️ Development

### Local Testing with Twilio

Use ngrok to expose local server:

```bash
# Start ngrok
ngrok http 8080

# Copy ngrok URL (e.g., https://abc123.ngrok.io)
# Update .env:
WEBHOOK_URL=https://abc123.ngrok.io

# Configure in Twilio Console
```

### Testing Web Calls

Use the included test client:

```html
<!-- Open test-client.html in browser -->
```

Or integrate with your frontend:

```typescript
import { Room } from 'livekit-client';

// Get token from your backend
const { token } = await fetch('/room/join', {
  method: 'POST',
  body: JSON.stringify({
    roomName: 'my-meeting',
    participantIdentity: 'user123',
    participantName: 'John Doe'
  })
}).then(r => r.json());

// Connect to room
const room = new Room();
await room.connect('wss://yourdomain.com', token);

// Enable microphone
await room.localParticipant.setMicrophoneEnabled(true);

// AI agent will respond to your voice!
```

## 📊 Monitoring

### View Active Sessions

```bash
curl http://localhost:8080/sessions

# Response:
{
  "sessions": [
    {
      "sessionId": "phone-CAxxxx",
      "type": "phone",
      "status": "active",
      "roomName": "twilio-CAxxxx",
      "participants": ["+1234567890"],
      "startTime": "2024-12-03T10:00:00Z",
      "metadata": {...}
    },
    {
      "sessionId": "web-my-meeting",
      "type": "web",
      "status": "active",
      "roomName": "my-meeting",
      "participants": ["user123", "user456"],
      "startTime": "2024-12-03T10:05:00Z"
    }
  ],
  "count": 2,
  "byType": {
    "phone": 1,
    "whatsapp": 0,
    "web": 1
  }
}
```

### Monitor Logs

```bash
# All services
npm run docker:logs

# Specific service
docker-compose logs -f agent
```

## 🔧 Configuration

### Twilio Setup

1. **Buy a Phone Number**: Twilio Console → Phone Numbers
2. **Configure Voice Webhook**:
   - Voice & Fax → Configure
   - When a call comes in: `POST https://yourdomain.com/twilio/voice`
   - Status callback: `POST https://yourdomain.com/twilio/status`

3. **WhatsApp Setup**:
   - Messaging → Try it out → WhatsApp Sandbox
   - When a message comes in: `POST https://yourdomain.com/whatsapp/message`

### Agent Customization

Modify system prompts in `src/connectors/`:

```typescript
// For phone calls (src/connectors/twilio.ts)
systemPrompt: 'You are a helpful phone assistant...'

// For WhatsApp (src/connectors/whatsapp.ts)  
systemPrompt: 'You are a helpful WhatsApp assistant...'

// For web calls (src/connectors/web.ts)
systemPrompt: 'You are a helpful AI assistant in a video call...'
```

## 🎨 Integration Examples

### React Frontend

```typescript
import { useEffect, useState } from 'react';
import { Room } from 'livekit-client';

export function VideoCall({ roomName }) {
  const [room, setRoom] = useState<Room>();
  const [token, setToken] = useState<string>();

  useEffect(() => {
    async function join() {
      // Get token from backend
      const res = await fetch('/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          participantIdentity: 'user-' + Date.now(),
          participantName: 'Guest User'
        })
      });
      
      const { token } = await res.json();
      
      // Connect to room
      const newRoom = new Room();
      await newRoom.connect('wss://yourdomain.com', token);
      
      // Enable mic
      await newRoom.localParticipant.setMicrophoneEnabled(true);
      
      setRoom(newRoom);
    }
    
    join();
    
    return () => room?.disconnect();
  }, [roomName]);

  return <div>Connected to {roomName}</div>;
}
```

### Express Backend

```typescript
app.post('/api/call-customer', async (req, res) => {
  const { customerPhone } = req.body;
  
  // Make phone call
  const callSid = await connectorManager.makePhoneCall(
    customerPhone,
    process.env.TWILIO_PHONE_NUMBER
  );
  
  res.json({ callSid, status: 'calling' });
});
```

## 📚 Documentation

- **README.md** - This file (quick start + API reference)
- **ARCHITECTURE.md** - System architecture details
- **DEPLOYMENT.md** - Production deployment guide
- **INTEGRATION.md** - Integration examples (see below)

## 🐛 Troubleshooting

### Twilio Webhooks Not Working

1. Check webhook URL in Twilio Console
2. Verify server is publicly accessible
3. Check logs: `docker-compose logs -f agent`
4. Test with ngrok for local development

### Audio Quality Issues

1. Check sample rate configuration (8kHz for Twilio)
2. Verify μ-law conversion is working
3. Monitor network latency
4. Review provider logs

### Agent Not Joining Room

1. Verify LiveKit credentials
2. Check room exists: `GET /sessions`
3. Review agent logs for errors
4. Ensure proper audio track subscription

## 🚀 Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed production setup including:
- SSL/TLS configuration
- Twilio production setup
- Scaling strategies
- Monitoring and alerts
- Security best practices

## 📄 License

MIT License - See LICENSE file

## 🤝 Contributing

Contributions welcome! See CONTRIBUTING.md

---

**Ready to deploy?** See [DEPLOYMENT.md](./DEPLOYMENT.md)

**Need help?** Open an issue or check the docs

**Questions?** Review [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design
