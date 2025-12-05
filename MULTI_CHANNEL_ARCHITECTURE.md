# Multi-Channel Agent Architecture
## One Agent, All Channels: Phone, WhatsApp, Telegram, SMS, Web, etc.

---

## 🎯 The Problem

Right now:
- ✅ Phone calls work (Twilio SIP → LiveKit → Agent)
- ❌ WhatsApp doesn't work
- ❌ Telegram doesn't work
- ❌ SMS doesn't work
- ❌ Facebook Messenger doesn't work

**You need ONE agent that handles ALL channels!**

---

## 🏗️ The Solution: Channel Gateway Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                     Your AI Agent (Brain)                    │
│           (LiveKit Agent: Quinn_353 - ONE instance)          │
└─────────────────────────────────────────────────────────────┘
                              ↑
                              │ Normalized Messages
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Channel Gateway (NEW!)                    │
│         Converts all channels to LiveKit format              │
└─────────────────────────────────────────────────────────────┘
         ↑           ↑           ↑           ↑           ↑
         │           │           │           │           │
    ┌────┴────┐ ┌───┴────┐ ┌───┴────┐ ┌───┴────┐ ┌───┴────┐
    │ Phone   │ │WhatsApp│ │Telegram│ │  SMS   │ │  Web   │
    │ Adapter │ │Adapter │ │Adapter │ │Adapter │ │Adapter │
    └─────────┘ └────────┘ └────────┘ └────────┘ └────────┘
         ↑           ↑           ↑           ↑           ↑
         │           │           │           │           │
    ┌────┴────┐ ┌───┴────┐ ┌───┴────┐ ┌───┴────┐ ┌───┴────┐
    │ Twilio  │ │Twilio  │ │Telegram│ │ Twilio │ │LiveKit │
    │   SIP   │ │Business│ │   Bot  │ │   API  │ │  Room  │
    └─────────┘ └────────┘ └────────┘ └────────┘ └────────┘
```

---

## 📋 Channel Comparison

| Channel | Type | Provider | Voice | Text | Media | Complexity |
|---------|------|----------|-------|------|-------|------------|
| **Phone** | Voice | Twilio SIP | ✅ | ❌ | ❌ | Easy |
| **WhatsApp** | Hybrid | Twilio/Meta | ✅ | ✅ | ✅ | Medium |
| **Telegram** | Text | Telegram Bot | ❌ | ✅ | ✅ | Easy |
| **SMS** | Text | Twilio | ❌ | ✅ | ❌ | Easy |
| **Web** | Hybrid | LiveKit | ✅ | ✅ | ✅ | Easy |
| **Messenger** | Hybrid | Meta | ❌ | ✅ | ✅ | Hard |
| **Slack** | Text | Slack API | ❌ | ✅ | ✅ | Easy |
| **Discord** | Hybrid | Discord Bot | ✅ | ✅ | ✅ | Medium |

---

## 🎨 Architecture Design

### Core Concepts

1. **Channel Adapter**: Converts channel-specific messages to/from LiveKit format
2. **Unified Session**: Each conversation (regardless of channel) = one LiveKit room
3. **Agent**: Doesn't care about the channel, just processes messages
4. **Message Queue**: Handles async messages from text channels

### Message Flow

**Inbound (User → Agent):**
```
User sends WhatsApp message
  ↓
Twilio webhook receives it
  ↓
WhatsApp Adapter converts to LiveKit DataPacket
  ↓
LiveKit room receives data
  ↓
Agent processes (STT if voice, direct if text)
  ↓
Agent generates response
  ↓
Response sent back through same path
```

**Outbound (Agent → User):**
```
Agent wants to respond
  ↓
Sends via LiveKit DataPacket
  ↓
Channel Gateway detects channel type
  ↓
Routes to appropriate adapter
  ↓
Adapter converts to channel format
  ↓
Sends via channel API (Twilio, Telegram, etc.)
```

---

## 🏗️ Implementation Plan

### Phase 1: Channel Gateway Core (2 hours)

**Create:** `packages/backend/src/channels/gateway.ts`

```typescript
/**
 * Channel Gateway
 * Routes messages between channels and LiveKit agent
 */

export enum ChannelType {
  PHONE = 'phone',
  WHATSAPP = 'whatsapp',
  TELEGRAM = 'telegram',
  SMS = 'sms',
  WEB = 'web',
  MESSENGER = 'messenger',
  SLACK = 'slack',
}

export interface ChannelMessage {
  channelType: ChannelType;
  channelUserId: string; // User ID in that channel (phone number, telegram ID, etc.)
  messageId: string;
  content: {
    text?: string;
    audio?: Buffer;
    image?: string;
    video?: string;
    document?: string;
  };
  metadata: {
    timestamp: Date;
    userName?: string;
    location?: { lat: number; lng: number };
    [key: string]: any;
  };
}

export interface ChannelResponse {
  channelType: ChannelType;
  channelUserId: string;
  content: {
    text?: string;
    audio?: Buffer;
    image?: string;
    quickReplies?: string[];
  };
}

export abstract class ChannelAdapter {
  abstract channelType: ChannelType;
  
  // Convert incoming channel message to LiveKit format
  abstract toUnified(rawMessage: any): Promise<ChannelMessage>;
  
  // Convert agent response to channel format
  abstract fromUnified(response: ChannelResponse): Promise<void>;
  
  // Get or create LiveKit room for this channel session
  async getRoomName(channelUserId: string): Promise<string> {
    return `${this.channelType}-${channelUserId}`;
  }
}

export class ChannelGateway {
  private adapters: Map<ChannelType, ChannelAdapter> = new Map();
  
  registerAdapter(adapter: ChannelAdapter) {
    this.adapters.set(adapter.channelType, adapter);
    console.log(`[Gateway] Registered adapter: ${adapter.channelType}`);
  }
  
  async handleInbound(channelType: ChannelType, rawMessage: any): Promise<void> {
    const adapter = this.adapters.get(channelType);
    if (!adapter) {
      throw new Error(`No adapter for channel: ${channelType}`);
    }
    
    // Convert to unified format
    const message = await adapter.toUnified(rawMessage);
    
    // Get/create LiveKit room
    const roomName = await adapter.getRoomName(message.channelUserId);
    
    // Send to agent via LiveKit
    await this.sendToAgent(roomName, message);
  }
  
  async handleOutbound(response: ChannelResponse): Promise<void> {
    const adapter = this.adapters.get(response.channelType);
    if (!adapter) {
      throw new Error(`No adapter for channel: ${response.channelType}`);
    }
    
    // Send via channel
    await adapter.fromUnified(response);
  }
  
  private async sendToAgent(roomName: string, message: ChannelMessage): Promise<void> {
    // Implementation: Send to LiveKit room as data packet
    // Agent will receive and process
  }
}

// Global gateway instance
export const channelGateway = new ChannelGateway();
```

---

### Phase 2: Phone Adapter (Already Done!) ✅

**File:** `packages/backend/src/channels/phone.adapter.ts`

```typescript
import { ChannelAdapter, ChannelType, ChannelMessage, ChannelResponse } from './gateway';

export class PhoneAdapter extends ChannelAdapter {
  channelType = ChannelType.PHONE;
  
  async toUnified(rawMessage: any): Promise<ChannelMessage> {
    // Phone calls come via Twilio SIP → LiveKit
    // Already handled natively!
    return {
      channelType: ChannelType.PHONE,
      channelUserId: rawMessage.from, // Phone number
      messageId: rawMessage.callSid,
      content: {
        audio: rawMessage.audioStream, // Voice data
      },
      metadata: {
        timestamp: new Date(),
        callerId: rawMessage.caller,
      },
    };
  }
  
  async fromUnified(response: ChannelResponse): Promise<void> {
    // Phone responses go via LiveKit → Twilio SIP
    // Already handled natively!
  }
}

// Register
channelGateway.registerAdapter(new PhoneAdapter());
```

✅ **Already working with Twilio SIP!**

---

### Phase 3: WhatsApp Adapter (NEW!) 📱

**File:** `packages/backend/src/channels/whatsapp.adapter.ts`

```typescript
import { ChannelAdapter, ChannelType, ChannelMessage, ChannelResponse } from './gateway';
import twilio from 'twilio';

export class WhatsAppAdapter extends ChannelAdapter {
  channelType = ChannelType.WHATSAPP;
  private twilioClient: twilio.Twilio;
  
  constructor() {
    super();
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }
  
  async toUnified(rawMessage: any): Promise<ChannelMessage> {
    // Twilio WhatsApp webhook format:
    // From: whatsapp:+1234567890
    // Body: "Hello, I need help"
    // MediaUrl0: (optional) image/video URL
    
    return {
      channelType: ChannelType.WHATSAPP,
      channelUserId: rawMessage.From.replace('whatsapp:', ''),
      messageId: rawMessage.MessageSid,
      content: {
        text: rawMessage.Body,
        image: rawMessage.MediaUrl0,
        video: rawMessage.MediaUrl0?.includes('video') ? rawMessage.MediaUrl0 : undefined,
      },
      metadata: {
        timestamp: new Date(),
        userName: rawMessage.ProfileName,
        location: rawMessage.Latitude ? {
          lat: parseFloat(rawMessage.Latitude),
          lng: parseFloat(rawMessage.Longitude),
        } : undefined,
      },
    };
  }
  
  async fromUnified(response: ChannelResponse): Promise<void> {
    // Send WhatsApp message via Twilio
    await this.twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${response.channelUserId}`,
      body: response.content.text,
      mediaUrl: response.content.image ? [response.content.image] : undefined,
    });
  }
}

// Register
channelGateway.registerAdapter(new WhatsAppAdapter());
```

**Webhook Setup:**
```typescript
// packages/backend/src/api/webhooks.ts
import express from 'express';
import { channelGateway } from '../channels/gateway';

const router = express.Router();

// WhatsApp webhook
router.post('/webhooks/whatsapp', async (req, res) => {
  try {
    await channelGateway.handleInbound('whatsapp', req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error);
    res.sendStatus(500);
  }
});

export default router;
```

---

### Phase 4: Telegram Adapter (NEW!) 💬

**File:** `packages/backend/src/channels/telegram.adapter.ts`

```typescript
import { ChannelAdapter, ChannelType, ChannelMessage, ChannelResponse } from './gateway';
import TelegramBot from 'node-telegram-bot-api';

export class TelegramAdapter extends ChannelAdapter {
  channelType = ChannelType.TELEGRAM;
  private bot: TelegramBot;
  
  constructor() {
    super();
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true });
    
    // Listen for messages
    this.bot.on('message', async (msg) => {
      await channelGateway.handleInbound(ChannelType.TELEGRAM, msg);
    });
  }
  
  async toUnified(rawMessage: any): Promise<ChannelMessage> {
    return {
      channelType: ChannelType.TELEGRAM,
      channelUserId: rawMessage.from.id.toString(),
      messageId: rawMessage.message_id.toString(),
      content: {
        text: rawMessage.text,
        image: rawMessage.photo ? rawMessage.photo[0].file_id : undefined,
        document: rawMessage.document?.file_id,
      },
      metadata: {
        timestamp: new Date(rawMessage.date * 1000),
        userName: rawMessage.from.username || rawMessage.from.first_name,
      },
    };
  }
  
  async fromUnified(response: ChannelResponse): Promise<void> {
    // Send Telegram message
    await this.bot.sendMessage(
      response.channelUserId,
      response.content.text || 'Processing...',
      {
        reply_markup: response.content.quickReplies ? {
          keyboard: response.content.quickReplies.map(r => [{ text: r }]),
          one_time_keyboard: true,
        } : undefined,
      }
    );
    
    // Send image if present
    if (response.content.image) {
      await this.bot.sendPhoto(response.channelUserId, response.content.image);
    }
  }
}

// Register
channelGateway.registerAdapter(new TelegramAdapter());
```

---

### Phase 5: SMS Adapter (NEW!) 📱

**File:** `packages/backend/src/channels/sms.adapter.ts`

```typescript
import { ChannelAdapter, ChannelType, ChannelMessage, ChannelResponse } from './gateway';
import twilio from 'twilio';

export class SMSAdapter extends ChannelAdapter {
  channelType = ChannelType.SMS;
  private twilioClient: twilio.Twilio;
  
  constructor() {
    super();
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }
  
  async toUnified(rawMessage: any): Promise<ChannelMessage> {
    return {
      channelType: ChannelType.SMS,
      channelUserId: rawMessage.From,
      messageId: rawMessage.MessageSid,
      content: {
        text: rawMessage.Body,
        image: rawMessage.MediaUrl0,
      },
      metadata: {
        timestamp: new Date(),
      },
    };
  }
  
  async fromUnified(response: ChannelResponse): Promise<void> {
    // Split long messages (SMS limit: 160 chars)
    const messages = this.splitSMS(response.content.text || '');
    
    for (const msg of messages) {
      await this.twilioClient.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: response.channelUserId,
        body: msg,
      });
    }
  }
  
  private splitSMS(text: string, maxLength = 160): string[] {
    const messages: string[] = [];
    let current = '';
    
    for (const word of text.split(' ')) {
      if ((current + word).length > maxLength) {
        messages.push(current.trim());
        current = word + ' ';
      } else {
        current += word + ' ';
      }
    }
    
    if (current.trim()) {
      messages.push(current.trim());
    }
    
    return messages;
  }
}

// Register
channelGateway.registerAdapter(new SMSAdapter());
```

**Webhook:**
```typescript
// In packages/backend/src/api/webhooks.ts
router.post('/webhooks/sms', async (req, res) => {
  try {
    await channelGateway.handleInbound('sms', req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('[SMS Webhook] Error:', error);
    res.sendStatus(500);
  }
});
```

---

### Phase 6: Update Agent for Text Channels (CRITICAL!)

**Problem:** LiveKit agent expects VOICE, but text channels send TEXT.

**Solution:** Hybrid agent that handles both!

**File:** `packages/backend/src/agent.ts`

```typescript
import { channelGateway, ChannelType, ChannelResponse } from './channels/gateway';

export default defineAgent({
  entry: async (ctx: JobContext) => {
    // Detect channel type from room name
    const roomName = ctx.room.name || '';
    const channelType = this.detectChannelType(roomName);
    
    if (channelType === ChannelType.PHONE) {
      // Voice channel - use existing voice agent
      await this.handleVoiceChannel(ctx);
    } else {
      // Text channel - use text-based agent
      await this.handleTextChannel(ctx, channelType);
    }
  },
  
  detectChannelType(roomName: string): ChannelType {
    if (roomName.startsWith('phone-')) return ChannelType.PHONE;
    if (roomName.startsWith('whatsapp-')) return ChannelType.WHATSAPP;
    if (roomName.startsWith('telegram-')) return ChannelType.TELEGRAM;
    if (roomName.startsWith('sms-')) return ChannelType.SMS;
    return ChannelType.WEB;
  },
  
  async handleVoiceChannel(ctx: JobContext) {
    // Existing voice agent logic
    const agent = new MarketplaceAgent();
    const session = new voice.VoiceSession(ctx.room);
    // ... existing voice setup ...
  },
  
  async handleTextChannel(ctx: JobContext, channelType: ChannelType) {
    // Text-based agent
    const logger = log.getLogger(ctx.job.id);
    logger.info(`[${channelType}] Text channel session started`);
    
    // Listen for data packets (text messages)
    ctx.room.on('dataReceived', async (data) => {
      const message = JSON.parse(new TextDecoder().decode(data.payload));
      
      // Process with LLM (no STT/TTS needed!)
      const llmClient = new openai.LLM({
        apiKey: process.env.OPENAI_API_KEY!,
        model: 'gpt-4o-mini',
      });
      
      const response = await llmClient.chat({
        messages: [
          { role: 'system', content: 'You are a helpful tawk.to marketplace assistant.' },
          { role: 'user', content: message.text },
        ],
      });
      
      // Send response back via channel gateway
      await channelGateway.handleOutbound({
        channelType,
        channelUserId: message.channelUserId,
        content: {
          text: response.choices[0].message.content,
        },
      });
    });
  },
});
```

---

## 📊 Folder Structure

```
packages/backend/src/
├── agent.ts                      # Main agent (UPDATED)
├── channels/                     # NEW: Channel Gateway
│   ├── gateway.ts               # Core gateway + interfaces
│   ├── phone.adapter.ts         # Phone (Twilio SIP)
│   ├── whatsapp.adapter.ts      # WhatsApp
│   ├── telegram.adapter.ts      # Telegram
│   ├── sms.adapter.ts           # SMS
│   ├── messenger.adapter.ts     # Facebook Messenger (future)
│   └── slack.adapter.ts         # Slack (future)
├── api/
│   ├── webhooks.ts              # NEW: Channel webhooks
│   └── outbound-call.ts         # Existing
└── utils/
    ├── call-logger.ts           # Existing
    └── session-manager.ts       # NEW: Manage multi-channel sessions
```

---

## 🎯 Implementation Steps

### Day 1: Core Gateway (2-3 hours)
1. Create `channels/gateway.ts`
2. Create base `ChannelAdapter` class
3. Implement `ChannelGateway` with routing
4. Add `webhooks.ts` API routes

### Day 2: WhatsApp + SMS (2-3 hours)
1. Implement `WhatsAppAdapter`
2. Implement `SMSAdapter`
3. Set up Twilio webhooks
4. Test with real messages

### Day 3: Telegram (1-2 hours)
1. Create Telegram bot
2. Implement `TelegramAdapter`
3. Test with Telegram app

### Day 4: Agent Updates (2-3 hours)
1. Update agent to detect channel type
2. Add text message handling
3. Integrate channel gateway responses
4. Test all channels end-to-end

### Day 5: Testing & Production (2-3 hours)
1. Load testing
2. Error handling
3. Monitoring
4. Documentation

**Total: 9-14 hours** (~2 weeks part-time)

---

## 💰 Cost Comparison

| Channel | Setup Cost | Per-Message Cost | Monthly Base |
|---------|-----------|------------------|--------------|
| Phone | $1 (number) | $0.01/min | $1 |
| WhatsApp | Free | $0.005-0.04/msg | $0 |
| Telegram | Free | $0 | $0 |
| SMS | $1 (number) | $0.0075/msg | $1 |
| Web | Free | $0 | $0 |

**AI Costs (same for all):**
- GPT-4o-mini: ~$0.001/message
- Total: ~$0.005-0.04/message depending on channel

---

## 🔧 Configuration

**Update `.env.local`:**
```bash
# Existing
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret

# Twilio (for Phone, WhatsApp, SMS)
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+14155238886

# Telegram
TELEGRAM_BOT_TOKEN=xxxx

# Facebook Messenger (future)
FB_PAGE_ACCESS_TOKEN=xxxx
FB_VERIFY_TOKEN=xxxx

# Slack (future)
SLACK_BOT_TOKEN=xxxx
```

---

## 🚀 Quick Setup Commands

### WhatsApp (via Twilio)
```bash
# 1. Enable WhatsApp in Twilio
# Go to: https://console.twilio.com/messaging/whatsapp/learn

# 2. Get WhatsApp sandbox number
# Test number: +1 415 523 8886

# 3. Configure webhook
twilio phone-numbers:update +14155238886 \
  --sms-url http://your-ngrok-url/api/webhooks/whatsapp
```

### Telegram
```bash
# 1. Create bot with @BotFather
# Send: /newbot
# Get: Bot token

# 2. Set webhook (optional, we use polling)
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=http://your-ngrok-url/api/webhooks/telegram"

# 3. Add token to .env.local
echo "TELEGRAM_BOT_TOKEN=your_token" >> .env.local
```

### SMS (via Twilio)
```bash
# Use existing phone number or buy new one
twilio phone-numbers:update +1234567890 \
  --sms-url http://your-ngrok-url/api/webhooks/sms
```

---

## ✅ Benefits of This Architecture

1. **Single Agent**: One AI brain handles all channels
2. **Easy to Add Channels**: Just create a new adapter
3. **Consistent Experience**: Same responses across all platforms
4. **Channel-Specific Features**: Adapters handle quirks (SMS length, WhatsApp media, etc.)
5. **Unified Analytics**: Track all conversations in one place
6. **Cost Efficient**: Share resources across channels

---

## 📚 Next Steps

1. **Start with WhatsApp** (most popular for business)
2. **Add Telegram** (easy, no costs)
3. **Add SMS** (fallback for everyone)
4. **Add Web chat** (already working!)
5. **Add Messenger, Slack, Discord** (as needed)

Want me to implement this? Say **"start multi-channel"** and I'll begin! 🚀

