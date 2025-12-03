# Integration Guide - Multi-Interface Voice Agent

This guide explains how to integrate the voice agent with different calling interfaces in production.

## Table of Contents
1. [Phone Calls (Twilio)](#phone-calls-twilio)
2. [WhatsApp](#whatsapp)
3. [Web Calls](#web-calls)
4. [Custom Integrations](#custom-integrations)

---

## Phone Calls (Twilio)

### Setup

#### 1. Twilio Account Setup

```bash
# Sign up at twilio.com
# Get your credentials from Console Dashboard
Account SID: ACxxxxxxxxxxxxxxxxx
Auth Token: your_auth_token
```

#### 2. Buy a Phone Number

```bash
# Twilio Console → Phone Numbers → Buy a Number
# Select a number with Voice capabilities
# Note your number: +1234567890
```

#### 3. Configure Webhooks

In Twilio Console → Phone Numbers → Manage Numbers → Active Numbers → (Your Number):

**Voice & Fax Configuration:**
- When a call comes in: `Webhook`
  - URL: `https://yourdomain.com/twilio/voice`
  - HTTP: `POST`
- Status callback URL: `https://yourdomain.com/twilio/status`
  - HTTP: `POST`
  - Events: Select all (initiated, ringing, answered, completed)

#### 4. Update Environment Variables

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
WEBHOOK_URL=https://yourdomain.com
```

### Usage

#### Receive Incoming Calls

When someone calls your Twilio number, the system automatically:

1. Twilio sends webhook to `/twilio/voice`
2. System creates LiveKit room: `twilio-{CallSid}`
3. AI agent joins room
4. Caller's audio → Agent (STT → LLM → TTS)
5. Agent responds in real-time

No code needed - it's automatic!

#### Make Outbound Calls

```typescript
// From your application
const response = await fetch('https://yourdomain.com/phone/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '+1234567890',
    from: '+0987654321' // Your Twilio number
  })
});

const { callSid } = await response.json();
console.log('Call initiated:', callSid);
```

#### Programmatic Call Control

```typescript
// End a call
await fetch(`https://yourdomain.com/phone/end/${callSid}`, {
  method: 'POST'
});

// Check call status
const response = await fetch(`https://yourdomain.com/sessions/phone-${callSid}`);
const session = await response.json();
console.log('Call status:', session.status);
```

### Advanced: Custom Call Flow

Modify `src/connectors/twilio.ts` for custom behavior:

```typescript
private generateTwiML(callSid: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <!-- Play a greeting before connecting -->
  <Say voice="Polly.Joanna">
    Please wait while we connect you to our AI assistant.
  </Say>
  
  <!-- Gather input before connecting -->
  <Gather input="dtmf" numDigits="1" action="/twilio/routing">
    <Say>Press 1 for sales, 2 for support, or stay on the line for our AI assistant.</Say>
  </Gather>
  
  <!-- Default: Connect to AI -->
  <Connect>
    <Stream url="wss://${this.config.webhookUrl.replace('https://', '')}/twilio/stream/${callSid}"/>
  </Connect>
</Response>`;
}
```

---

## WhatsApp

### Setup

#### 1. WhatsApp Business API

Twilio provides two options:

**Option A: WhatsApp Sandbox (Testing)**
```bash
# Twilio Console → Messaging → Try it out → Send a WhatsApp message
# Send "join <sandbox-code>" to the provided number
# Your WhatsApp Sandbox Number: whatsapp:+14155238886
```

**Option B: WhatsApp Business Account (Production)**
```bash
# Twilio Console → Messaging → WhatsApp → Get started
# Request production access (requires business verification)
# Get your approved WhatsApp number
```

#### 2. Configure Webhooks

In Twilio Console → Messaging → Settings → WhatsApp sandbox settings (or your approved number):

**Incoming Messages:**
- When a message comes in: `https://yourdomain.com/whatsapp/message`
- HTTP: `POST`

**Voice Calls (if enabled):**
- When a call comes in: `https://yourdomain.com/whatsapp/voice`
- HTTP: `POST`

#### 3. Update Environment Variables

```env
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # or your approved number
```

### Usage

#### Text Messages

**Receive Messages:**

User sends WhatsApp message → Agent responds automatically

```
User: "Hello, what are your business hours?"
Agent: "We're open Monday-Friday, 9 AM to 6 PM EST. How can I help you today?"
```

**Send Messages:**

```typescript
// Send outbound message
const response = await fetch('https://yourdomain.com/whatsapp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'whatsapp:+1234567890',
    message: 'Hello! Your appointment is confirmed for tomorrow at 2 PM.'
  })
});

const { messageSid } = await response.json();
```

#### Voice Calls

**Receive WhatsApp Calls:**

When someone calls your WhatsApp Business number:
1. Twilio sends webhook to `/whatsapp/voice`
2. System creates room: `whatsapp-{CallSid}`
3. AI agent joins and handles call

**Make Outbound WhatsApp Calls:**

```typescript
const response = await fetch('https://yourdomain.com/whatsapp/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'whatsapp:+1234567890'
  })
});
```

### Advanced: Template Messages

For marketing/notifications:

```typescript
// First, create template in Twilio Console
// Then send:
await whatsappConnector.sendTemplateMessage(
  'whatsapp:+1234567890',
  'HXxxxxxxxxxxxx', // Template SID
  {
    '1': 'John',      // Customer name
    '2': 'Tomorrow',  // Appointment date
    '3': '2 PM'       // Appointment time
  }
);
```

---

## Web Calls

### Setup

No external service needed - works out of the box!

#### 1. Frontend Integration

Install LiveKit client:

```bash
npm install livekit-client
```

#### 2. Create React Component

```typescript
// VideoCall.tsx
import { useEffect, useState, useRef } from 'react';
import { Room, RoomEvent, RemoteParticipant } from 'livekit-client';

interface Props {
  roomName: string;
  userName: string;
}

export function VideoCall({ roomName, userName }: Props) {
  const [room, setRoom] = useState<Room>();
  const [isConnected, setIsConnected] = useState(false);
  const [agentActive, setAgentActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    async function connect() {
      try {
        // Get token from your backend
        const response = await fetch('/room/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName,
            participantIdentity: `user-${Date.now()}`,
            participantName: userName
          })
        });

        const { token, agentPresent } = await response.json();
        setAgentActive(agentPresent);

        // Create room
        const newRoom = new Room();

        // Setup event listeners
        newRoom.on(RoomEvent.Connected, () => {
          console.log('Connected to room');
          setIsConnected(true);
        });

        newRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
          console.log('Participant connected:', participant.identity);
          
          // Check if it's the agent
          if (participant.identity.includes('agent')) {
            setAgentActive(true);
          }
        });

        newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track.kind === 'audio' && participant.identity.includes('agent')) {
            // Attach agent's audio
            const audioElement = track.attach();
            audioRef.current?.appendChild(audioElement);
          }
        });

        // Connect
        await newRoom.connect('wss://yourdomain.com', token);

        // Enable microphone
        await newRoom.localParticipant.setMicrophoneEnabled(true);

        setRoom(newRoom);
      } catch (error) {
        console.error('Failed to connect:', error);
      }
    }

    connect();

    return () => {
      room?.disconnect();
    };
  }, [roomName, userName]);

  const toggleAgent = async () => {
    try {
      await fetch(`/room/${roomName}/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: !agentActive })
      });
      setAgentActive(!agentActive);
    } catch (error) {
      console.error('Failed to toggle agent:', error);
    }
  };

  return (
    <div className="video-call">
      <h2>Room: {roomName}</h2>
      <p>Status: {isConnected ? 'Connected' : 'Connecting...'}</p>
      <p>Agent: {agentActive ? 'Active' : 'Inactive'}</p>
      
      <button onClick={toggleAgent}>
        {agentActive ? 'Disable Agent' : 'Enable Agent'}
      </button>

      <div ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
}
```

#### 3. Create Backend Route

```typescript
// server.ts
app.post('/api/create-meeting', async (req, res) => {
  const { meetingName, hostName } = req.body;

  const response = await fetch('http://localhost:8080/room/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomName: meetingName,
      hostIdentity: `host-${Date.now()}`,
      hostName: hostName
    })
  });

  const result = await response.json();
  res.json(result);
});
```

### Usage

#### Simple Web Call

```typescript
// App.tsx
import { VideoCall } from './VideoCall';

function App() {
  return (
    <VideoCall 
      roomName="my-meeting"
      userName="John Doe"
    />
  );
}
```

#### With Room Creation

```typescript
// MeetingPage.tsx
import { useState } from 'react';
import { VideoCall } from './VideoCall';

export function MeetingPage() {
  const [roomName, setRoomName] = useState('');
  const [joined, setJoined] = useState(false);

  const createMeeting = async () => {
    const response = await fetch('/api/create-meeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meetingName: `meeting-${Date.now()}`,
        hostName: 'John Doe'
      })
    });

    const { roomName, roomUrl } = await response.json();
    setRoomName(roomName);
    setJoined(true);
  };

  if (!joined) {
    return (
      <button onClick={createMeeting}>
        Create Meeting
      </button>
    );
  }

  return <VideoCall roomName={roomName} userName="John Doe" />;
}
```

### Advanced: Recording & Screen Share

```typescript
// Enable recording
await fetch(`/room/${roomName}/recording`, {
  method: 'POST',
  body: JSON.stringify({ enable: true })
});

// Enable screen share (frontend)
await room.localParticipant.setScreenShareEnabled(true);
```

---

## Custom Integrations

### Slack Integration

```typescript
// slack-connector.ts
import { WebClient } from '@slack/web-api';

export class SlackVoiceConnector {
  private slack: WebClient;

  constructor(token: string) {
    this.slack = new WebClient(token);
  }

  async handleSlashCommand(command: string, userId: string) {
    // User types /call in Slack
    if (command === '/call') {
      // Create web room
      const { roomUrl, token } = await fetch('/room/create', {
        method: 'POST',
        body: JSON.stringify({
          roomName: `slack-${userId}`,
          hostIdentity: userId,
          hostName: 'Slack User'
        })
      }).then(r => r.json());

      // Send room link to user
      await this.slack.chat.postMessage({
        channel: userId,
        text: `Join your AI call: ${roomUrl}`
      });
    }
  }
}
```

### Discord Integration

```typescript
// discord-connector.ts
import { Client, VoiceChannel } from 'discord.js';

export class DiscordVoiceConnector {
  private client: Client;

  async joinVoiceChannel(channel: VoiceChannel) {
    // Create room for Discord channel
    const roomName = `discord-${channel.id}`;
    
    await fetch('/room/create', {
      method: 'POST',
      body: JSON.stringify({
        roomName,
        hostIdentity: 'discord-bot',
        hostName: 'AI Assistant'
      })
    });

    // Bridge Discord voice ↔ LiveKit
    // (Implementation depends on discord.js voice handling)
  }
}
```

### Microsoft Teams Integration

```typescript
// teams-connector.ts
export class TeamsVoiceConnector {
  async handleCallWebhook(event: any) {
    if (event.type === 'call.incoming') {
      // Create room for Teams call
      const roomName = `teams-${event.callId}`;
      
      await fetch('/room/create', {
        method: 'POST',
        body: JSON.stringify({
          roomName,
          hostIdentity: 'teams-bot',
          hostName: 'AI Assistant'
        })
      });

      // Answer call and bridge to LiveKit
    }
  }
}
```

---

## Testing

### Local Development with ngrok

```bash
# Start ngrok
ngrok http 8080

# Update webhooks to ngrok URL
# e.g., https://abc123.ngrok.io/twilio/voice
```

### Unit Tests

```typescript
// twilio.test.ts
import { TwilioVoiceConnector } from './connectors/twilio';

describe('TwilioVoiceConnector', () => {
  test('handles incoming call', async () => {
    const connector = new TwilioVoiceConnector(config);
    const twiml = await connector.handleIncomingCall(
      'CAxxxxx',
      '+1234567890',
      '+0987654321'
    );
    expect(twiml).toContain('<Connect>');
  });
});
```

### Integration Tests

```typescript
// integration.test.ts
test('end-to-end phone call', async () => {
  // 1. Simulate Twilio webhook
  const response = await fetch('/twilio/voice', {
    method: 'POST',
    body: new URLSearchParams({
      CallSid: 'CAtest123',
      From: '+1234567890',
      To: '+0987654321'
    })
  });

  // 2. Verify room created
  const session = await fetch('/sessions/phone-CAtest123');
  expect(session.status).toBe('active');

  // 3. End call
  await fetch('/phone/end/CAtest123', { method: 'POST' });

  // 4. Verify cleanup
  const ended = await fetch('/sessions/phone-CAtest123');
  expect(ended.status).toBe(404);
});
```

---

## Monitoring

### Webhooks

Monitor webhook delivery in Twilio Console:
- Monitor → Logs → Errors
- Check for failed webhook attempts
- Review response times

### Application Logs

```bash
# View all logs
docker-compose logs -f agent

# Filter by call type
docker-compose logs -f agent | grep "Twilio"
docker-compose logs -f agent | grep "WhatsApp"
docker-compose logs -f agent | grep "Web"
```

### Metrics

```bash
# Active sessions by type
curl http://localhost:8080/sessions | jq '.byType'

# Specific session details
curl http://localhost:8080/sessions/phone-CAxxxxx
```

---

## Troubleshooting

### Common Issues

**Twilio webhooks not receiving:**
- Verify URL is publicly accessible
- Check webhook configuration in Twilio Console
- Review ngrok connection if testing locally

**Audio quality problems:**
- Check sample rate (8kHz for Twilio, 16kHz+ for web)
- Verify codec conversion (μ-law for Twilio)
- Monitor network latency

**Agent not responding:**
- Check AI provider API keys
- Verify room was created
- Review agent logs for errors

---

## Best Practices

1. **Error Handling**: Always handle provider failures gracefully
2. **Logging**: Log all webhook requests for debugging
3. **Monitoring**: Track call durations and success rates
4. **Security**: Validate webhook signatures (Twilio provides this)
5. **Scalability**: Use queue system for high call volumes
6. **Testing**: Test with real calls before production
7. **Fallback**: Have backup numbers and providers

---

**Next Steps:**
- [Production Deployment](./DEPLOYMENT.md)
- [Architecture Details](./ARCHITECTURE.md)
- [API Reference](./README_UPDATED.md)
