# Twilio Telephony Integration Plan (LOCAL SETUP)
## Incoming & Outgoing Calls for Tawk.to Voice Agent
## 🏠 100% LOCAL - No LiveKit Cloud Required!

---

## 🎯 Goals

1. **Inbound Calls**: Customers call Twilio number → AI agent answers (LOCALLY)
2. **Outbound Calls**: System triggers call → AI agent calls customer (LOCALLY)
3. **Unified Agent**: Same agent code handles both scenarios
4. **All Local**: Everything runs on localhost with ngrok for public access

---

## 🏠 Local Architecture

```
Phone Call → Twilio → ngrok tunnel → localhost:5060 (LiveKit SIP)
                                   → localhost:7880 (LiveKit WebRTC)
                                   → localhost:8081 (Agent API)
                                   → localhost:3000 (Frontend)
```

---

## 📋 Phase 1: Prerequisites & Setup (30 minutes)

### 1.1 Twilio Account Setup

**Tasks:**
- [ ] Create Twilio account (if not exists): https://www.twilio.com/try-twilio
- [ ] Purchase phone number with Voice capability (~$1-2/month)
- [ ] Note down:
  - Account SID
  - Auth Token
  - Phone number (e.g., +1234567890)

**Commands:**
```bash
# Install Twilio CLI
brew tap twilio/brew && brew install twilio

# Login
twilio login

# List purchased numbers
twilio phone-numbers:list
```

### 1.2 LiveKit CLI Setup (Local)

**Tasks:**
- [ ] Install LiveKit CLI
- [ ] Configure with LOCAL credentials

**Commands:**
```bash
# Install
brew install livekit

# Configure for LOCALHOST
export LIVEKIT_URL=http://localhost:7880
export LIVEKIT_API_KEY=devkey
export LIVEKIT_API_SECRET=secret

# Test
lk sip --help
```

**Add to `packages/backend/.env.local`:**
```bash
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
```

### 1.3 Install ngrok (REQUIRED for local Twilio integration)

**Why ngrok?**
Twilio needs a PUBLIC URL to send calls to your LOCAL LiveKit server. ngrok creates a secure tunnel.

**Tasks:**
- [ ] Install ngrok
- [ ] Get ngrok auth token (free account)

**Commands:**
```bash
# Install ngrok
brew install ngrok

# Sign up for free: https://dashboard.ngrok.com/signup
# Get your auth token: https://dashboard.ngrok.com/get-started/your-authtoken

# Configure auth token
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE

# Test
ngrok version
```

### 1.4 Install Additional Packages

**Tasks:**
- [ ] Install `livekit-server-sdk` for SIP operations
- [ ] Install `@livekit/rtc-node` for call transfers

**Commands:**
```bash
cd /Users/manoj/Documents/GitHub/tawk-voice-agents-sdk-livekit/packages/backend
pnpm add livekit-server-sdk @livekit/rtc-node
```

---

## 📋 Phase 2: Inbound Calls Configuration (20 minutes)

### 2.1 Create Twilio SIP Trunk

**Tasks:**
- [ ] Create SIP trunk with specific domain
- [ ] Save Trunk SID

**Commands:**
```bash
# Create trunk
twilio api:core:trunks:create \
  --friendly-name "Tawk.to Inbound Trunk" \
  --domain-name "tawk-inbound.pstn.twilio.com"

# Output: Save the Trunk SID (TK...)
```

### 2.2 Expose LiveKit with ngrok (CRITICAL for localhost)

**Tasks:**
- [ ] Start ngrok tunnel for LiveKit SIP port
- [ ] Save the ngrok URL

**Commands:**
```bash
# Start ngrok tunnel for LiveKit SIP (port 5060)
ngrok tcp 5060

# Output will show something like:
# Forwarding: tcp://0.tcp.ngrok.io:12345 -> localhost:5060
#
# COPY THIS URL! You'll need it for Twilio configuration.
# Example: 0.tcp.ngrok.io:12345
```

**⚠️ IMPORTANT:**
- Keep this terminal running! If ngrok stops, Twilio can't reach your local LiveKit.
- The ngrok URL changes every time you restart (free plan). Use a paid plan for a static URL.

### 2.3 Configure Twilio Origination (Twilio → ngrok → localhost)

**Tasks:**
- [ ] Point Twilio trunk to your ngrok URL

**Commands:**
```bash
# Replace <TRUNK_SID> with your Twilio trunk SID
# Replace 0.tcp.ngrok.io:12345 with YOUR ngrok URL from above

twilio api:core:trunks:origination-urls:create \
  --trunk-sid <TRUNK_SID> \
  --friendly-name "LiveKit Local (ngrok)" \
  --sip-url "sip:0.tcp.ngrok.io:12345" \
  --weight 1 --priority 1 --enabled

# Example:
# twilio api:core:trunks:origination-urls:create \
#   --trunk-sid TKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
#   --friendly-name "LiveKit Local (ngrok)" \
#   --sip-url "sip:0.tcp.ngrok.io:12345" \
#   --weight 1 --priority 1 --enabled
```

### 2.4 Associate Phone Number with Trunk

**Tasks:**
- [ ] Link your Twilio phone number to the trunk

**Commands:**
```bash
# List phone numbers to get SID
twilio phone-numbers:list

# Associate with trunk
twilio api:core:trunks:phone-numbers:create \
  --trunk-sid <TRUNK_SID> \
  --phone-number-sid <PHONE_NUMBER_SID>
```

### 2.5 Create LiveKit Inbound Trunk (Local)

**Tasks:**
- [ ] Create inbound trunk in LiveKit
- [ ] Allow calls from Twilio

**Create `config/livekit-inbound-trunk.json`:**
```json
{
  "trunk": {
    "name": "Twilio Inbound",
    "numbers": ["+1234567890"],
    "allowed_addresses": [],
    "allowed_numbers": [],
    "metadata": "{\"provider\": \"twilio\", \"type\": \"inbound\"}"
  }
}
```

**Commands:**
```bash
cd /Users/manoj/Documents/GitHub/tawk-voice-agents-sdk-livekit

# Create inbound trunk
lk sip inbound create config/livekit-inbound-trunk.json

# Verify
lk sip inbound list
```

### 2.6 Create Dispatch Rule (Route to Agent)

**Tasks:**
- [ ] Create dispatch rule to route calls to Quinn_353

**Create `config/dispatch-rule-inbound.json`:**
```json
{
  "dispatch_rule": {
    "rule": {
      "dispatchRuleIndividual": {
        "roomPrefix": "phone-in-"
      }
    },
    "roomConfig": {
      "agents": [{
        "agentName": "Quinn_353"
      }]
    }
  }
}
```

**Commands:**
```bash
# Create dispatch rule
lk sip dispatch create config/dispatch-rule-inbound.json

# Verify
lk sip dispatch list
```

---

## 📋 Phase 3: Outbound Calls Configuration (25 minutes)

### 3.1 Create Twilio Credentials

**Tasks:**
- [ ] Create credential list for authentication
- [ ] Save username and password

**Using Twilio Console:**
1. Go to https://console.twilio.com
2. Navigate to **Voice** → **Credential lists**
3. Click **Create new credential list**
4. Name: "LiveKit Outbound Credentials"
5. Add credential:
   - Username: `livekit_outbound`
   - Password: `<generate-secure-password>` (save this!)
6. Copy the Credential List SID

### 3.2 Get Twilio Termination URI

**Tasks:**
- [ ] Get termination URI from your trunk

**Using Twilio Console:**
1. Go to **Elastic SIP Trunking** → **Manage** → **Trunks**
2. Select your trunk
3. Go to **Termination** section
4. Copy the **Termination SIP URI**
   - Format: `your-trunk.pstn.twilio.com`

**OR using CLI:**
```bash
twilio api:core:trunks:fetch --sid <TRUNK_SID>
# Look for "termination_uri" in output
```

### 3.3 Associate Credentials with Trunk

**Using Twilio Console:**
1. Select your trunk
2. Go to **Termination** → **Authentication** → **Credential Lists**
3. Select "LiveKit Outbound Credentials"
4. Click **Save**

### 3.4 Create LiveKit Outbound Trunk

**Tasks:**
- [ ] Create outbound trunk in LiveKit
- [ ] Configure authentication

**Create `config/livekit-outbound-trunk.json`:**
```json
{
  "trunk": {
    "name": "Twilio Outbound",
    "address": "your-trunk.pstn.twilio.com:5060",
    "transport": "udp",
    "numbers": ["+1234567890"],
    "auth_username": "livekit_outbound",
    "auth_password": "your_secure_password",
    "metadata": "{\"provider\": \"twilio\", \"type\": \"outbound\"}"
  }
}
```

**Commands:**
```bash
# Create outbound trunk
lk sip outbound create config/livekit-outbound-trunk.json

# Verify and save the trunk ID (ST_...)
lk sip outbound list
```

### 3.5 Create Outbound Calling API

**Tasks:**
- [ ] Create REST API endpoint to trigger outbound calls
- [ ] Accept phone number and metadata

**Create `packages/backend/src/api/outbound-call.ts`:**
```typescript
import express from 'express';
import { SipClient } from 'livekit-server-sdk';
import type { Request, Response } from 'express';

const router = express.Router();

// Configuration
const OUTBOUND_TRUNK_ID = process.env.TWILIO_OUTBOUND_TRUNK_ID || 'ST_xxxxx';
const sipClient = new SipClient(
  process.env.LIVEKIT_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

interface OutboundCallRequest {
  phoneNumber: string;
  customerName?: string;
  metadata?: Record<string, any>;
}

/**
 * POST /api/outbound-call
 * Trigger an outbound call to a customer
 */
router.post('/outbound-call', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, customerName, metadata }: OutboundCallRequest = req.body;

    // Validate phone number
    if (!phoneNumber || !phoneNumber.match(/^\+\d{10,15}$/)) {
      return res.status(400).json({ 
        error: 'Invalid phone number. Must be in E.164 format (e.g., +1234567890)' 
      });
    }

    // Generate unique room name
    const roomName = `outbound-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Create SIP participant (places the call)
    const participant = await sipClient.createSipParticipant(
      OUTBOUND_TRUNK_ID,
      phoneNumber,
      roomName,
      {
        participantIdentity: phoneNumber,
        participantName: customerName || phoneNumber,
        participantMetadata: JSON.stringify({
          type: 'outbound',
          phoneNumber,
          ...metadata,
        }),
        waitUntilAnswered: true, // Wait for customer to pick up
      }
    );

    console.log(`[Outbound Call] Placed call to ${phoneNumber}, room: ${roomName}`);

    res.json({
      success: true,
      callId: participant.participantInfo?.sid,
      roomName,
      phoneNumber,
      status: 'ringing',
    });
  } catch (error: any) {
    console.error('[Outbound Call] Error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      sipStatus: error.metadata?.sip_status_code,
    });
  }
});

/**
 * GET /api/outbound-call/status/:roomName
 * Check status of an outbound call
 */
router.get('/outbound-call/status/:roomName', async (req: Request, res: Response) => {
  try {
    const { roomName } = req.params;
    
    // You can implement room status check here
    // For now, just return a placeholder
    
    res.json({
      roomName,
      status: 'active',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

**Update `packages/backend/src/agent.ts` to include API server:**
```typescript
import express from 'express';
import cors from 'cors';
import outboundCallRouter from './api/outbound-call.js';

// Add this after imports, before defineAgent
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', outboundCallRouter);

const API_PORT = process.env.API_PORT || 8081;
app.listen(API_PORT, () => {
  console.log(`[API] Server listening on port ${API_PORT}`);
});
```

---

## 📋 Phase 4: Agent Code Updates (30 minutes)

### 4.1 Update Agent for Phone Detection

**File:** `packages/backend/src/agent.ts`

**Changes needed:**

#### 1. Import SIP utilities
```typescript
import { RoomServiceClient, SipClient } from 'livekit-server-sdk';
import { getJobContext } from '@livekit/agents';
import type { RemoteParticipant } from 'livekit-client';
```

#### 2. Update `onEnter()` for phone greeting
```typescript
override async onEnter(): Promise<void> {
  // Check if this is a phone call
  const sipParticipants = Array.from(this.room.remoteParticipants.values())
    .filter((p: any) => p.kind === 'sip');
  
  const isPhoneCall = sipParticipants.length > 0;

  if (isPhoneCall) {
    // Phone greeting - more formal
    this.session.generateReply({
      instructions:
        'Say "Thank you for calling tawk.to marketplace. I\'m your AI shopping assistant. How may I help you today?"',
    });
  } else {
    // Web/app greeting - existing
    this.session.generateReply({
      instructions:
        'Say "Welcome to TAWK.To Marketplace!" and briefly introduce yourself as their shopping assistant.',
    });
  }
}
```

#### 3. Add hangup tool
```typescript
// Add this function before the MarketplaceAgent class
const hangUpCall = async () => {
  const jobContext = getJobContext();
  if (!jobContext) {
    return;
  }

  const roomServiceClient = new RoomServiceClient(
    process.env.LIVEKIT_URL!,
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
  );

  if (jobContext.room.name) {
    await roomServiceClient.deleteRoom(jobContext.room.name);
  }
};

// In MarketplaceAgent constructor, add to tools:
endCall: llm.tool({
  description: 'Call this when the customer says goodbye or wants to end the call. Always confirm before ending.',
  parameters: z.object({
    reason: z.string().describe('Brief reason for ending call (e.g., "completed purchase", "no assistance needed")'),
  }),
  execute: async ({ reason }, { ctx }: llm.ToolOptions) => {
    // Inform customer
    await ctx.session.generateReply({
      instructions: `Say "Thank you for calling tawk.to marketplace. Have a great day! Goodbye!"`,
    });
    
    // Wait for speech to complete
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    // Hang up
    await hangUpCall();
    
    return `Call ended: ${reason}`;
  },
}),
```

#### 4. Add call transfer tool
```typescript
transferToHuman: llm.tool({
  description: 'Transfer the call to a human agent when customer explicitly requests to speak with a person or needs specialized help',
  parameters: z.object({
    reason: z.string().describe('Reason for transfer'),
    department: z.enum(['sales', 'support', 'billing']).describe('Which department to transfer to'),
  }),
  execute: async ({ reason, department }, { ctx }: llm.ToolOptions) => {
    const jobContext = getJobContext();
    if (!jobContext) {
      return "Cannot transfer - not in a call";
    }

    // Find SIP participant
    const sipParticipant = Array.from(ctx.room.remoteParticipants.values())
      .find((p: any) => p.kind === 'sip');

    if (!sipParticipant) {
      return "Cannot transfer - no phone participant found";
    }

    // Inform customer
    await ctx.session.generateReply({
      instructions: `Say "I'll transfer you to our ${department} team now. Please hold for just a moment."`,
    });

    // Wait for speech
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Transfer numbers by department
    const transferNumbers: Record<string, string> = {
      sales: process.env.TRANSFER_NUMBER_SALES || '+15105551111',
      support: process.env.TRANSFER_NUMBER_SUPPORT || '+15105552222',
      billing: process.env.TRANSFER_NUMBER_BILLING || '+15105553333',
    };

    const sipClient = new SipClient(
      process.env.LIVEKIT_URL!,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!
    );

    try {
      await sipClient.transferSipParticipant(
        jobContext.room.name!,
        sipParticipant.identity,
        `tel:${transferNumbers[department]}`,
        { playDialtone: false }
      );

      return `Transferred to ${department}: ${reason}`;
    } catch (error: any) {
      console.error('[Transfer] Error:', error);
      return `Transfer failed: ${error.message}`;
    }
  },
}),
```

#### 5. Add voicemail detection tool
```typescript
detectedVoicemail: llm.tool({
  description: 'Call this ONLY if you clearly detect an answering machine or voicemail system, AFTER hearing the full greeting beep',
  parameters: z.object({}),
  execute: async (_, { ctx }: llm.ToolOptions) => {
    await ctx.session.generateReply({
      instructions:
        'Leave a professional voicemail: "Hello, this is the tawk.to marketplace assistant calling. I\'ll try again later. Thank you!"',
    });
    
    // Wait for message to complete
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    // Hang up
    await hangUpCall();
    
    return "Voicemail message left";
  },
}),
```

### 4.2 Update Agent Instructions

Add phone-specific guidance to instructions:

```typescript
instructions: `You are a friendly tawk.to marketplace assistant who helps customers shop for products.

# Your Role
Guide customers through the complete shopping journey:
1. **Product Discovery** - Help find products
2. **Product Details** - Share specs, reviews, prices
3. **Recommendations** - Suggest similar or better options
4. **Add to Cart** - Add items they want
5. **Checkout** - Complete the purchase with shipping

# Phone Call Etiquette (when on phone)
- Speak clearly and at a moderate pace
- Use "yes sir/ma'am" for politeness
- Spell out complex product names or IDs
- Confirm important details (price, quantity, address)
- Offer to repeat information if needed
- Ask "Is there anything else I can help you with?" before ending

# When to Transfer
- Customer explicitly asks for a human
- Complex refund/return issues
- Billing disputes
- Technical problems you cannot resolve

# When to End Call
- Customer says goodbye or indicates they're done
- Purchase is complete and customer is satisfied
- No response after asking "anything else?"

... rest of existing instructions ...
`,
```

---

## 📋 Phase 5: Frontend UI for Outbound Calls (30 minutes)

### 5.1 Create Outbound Call Interface

**Create `packages/frontend/app/admin/outbound-calls/page.tsx`:**
```typescript
"use client";

import React, { useState } from "react";
import { Button } from "@/components/modern";
import styles from "./page.module.css";

export default function OutboundCallsPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [calling, setCalling] = useState(false);
  const [result, setResult] = useState<any>(null);

  const placeCall = async () => {
    setCalling(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:8081/api/outbound-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          customerName,
          metadata: {
            source: 'admin-panel',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setCalling(false);
    }
  };

  return (
    <main className={styles.container}>
      <h1>Outbound Calls</h1>
      <p>Place calls to customers using the AI voice agent</p>

      <div className={styles.form}>
        <div className={styles.field}>
          <label>Phone Number (E.164 format)</label>
          <input
            type="tel"
            placeholder="+1234567890"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={calling}
          />
        </div>

        <div className={styles.field}>
          <label>Customer Name (Optional)</label>
          <input
            type="text"
            placeholder="John Doe"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            disabled={calling}
          />
        </div>

        <Button
          variant="primary"
          onClick={placeCall}
          disabled={!phoneNumber || calling}
        >
          {calling ? "Calling..." : "Place Call"}
        </Button>
      </div>

      {result && (
        <div className={result.success ? styles.success : styles.error}>
          <h3>{result.success ? "✅ Call Placed!" : "❌ Error"}</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </main>
  );
}
```

### 5.2 Add Link to Navigation

**Update `packages/frontend/app/page.tsx`:**

Add a button/link to access outbound calls:

```typescript
<Button
  variant="secondary"
  onClick={() => router.push('/admin/outbound-calls')}
>
  📞 Outbound Calls (Admin)
</Button>
```

---

## 📋 Phase 6: Testing & Verification (20 minutes)

### 6.1 Test Inbound Calls

**Test Plan:**

1. **Start services**:
   ```bash
   # Terminal 1: LiveKit
   docker-compose up
   
   # Terminal 2: Agent
   cd packages/backend && pnpm start
   ```

2. **Make test call**:
   - Call your Twilio number from your mobile phone
   - Agent should answer within 2-3 seconds
   - Say: "I'm looking for an iPhone"
   - Verify agent responds correctly

3. **Test tools**:
   - "Search for iPhone" → Should call `searchProducts`
   - "I'm done, goodbye" → Should call `endCall` and hang up
   - "Transfer me to a human" → Should call `transferToHuman`

4. **Check logs**:
   ```bash
   # Backend logs should show:
   [backend] received job request
   [backend] agentName: "Quinn_353"
   [backend] Creating speech handle
   [backend] Marketplace agent started
   ```

### 6.2 Test Outbound Calls

**Test Plan:**

1. **Open admin panel**: http://localhost:3000/admin/outbound-calls

2. **Place test call**:
   - Enter your mobile number: `+1234567890`
   - Customer name: "Test Customer"
   - Click "Place Call"

3. **Answer your phone**:
   - Should ring within 2-3 seconds
   - Agent should wait for you to speak first (outbound etiquette)
   - Say: "Hello?"
   - Agent responds: "Hello! This is tawk.to marketplace..."

4. **Verify API response**:
   ```json
   {
     "success": true,
     "callId": "PA_xxxx",
     "roomName": "outbound-1234567890-abc",
     "phoneNumber": "+1234567890",
     "status": "ringing"
   }
   ```

### 6.3 Test Edge Cases

- [ ] **No answer**: Call doesn't get picked up (should timeout)
- [ ] **Busy signal**: Number is busy (should detect and log)
- [ ] **Voicemail**: Goes to voicemail (should detect and leave message)
- [ ] **Invalid number**: Call with wrong number (should return error)
- [ ] **Network issues**: Disconnect during call (should cleanup gracefully)

---

## 📋 Phase 7: Production Deployment (Configuration)

### 7.1 Environment Variables

**Add to `packages/backend/.env.local`:**
```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_OUTBOUND_TRUNK_ID=ST_xxxxxxxxxxxx

# Transfer Numbers
TRANSFER_NUMBER_SALES=+15105551111
TRANSFER_NUMBER_SUPPORT=+15105552222
TRANSFER_NUMBER_BILLING=+15105553333

# API Configuration
API_PORT=8081
```

### 7.2 Enable Call Features on Twilio

**Enable SIP REFER (for call transfers):**

Using Twilio Console:
1. Go to your trunk
2. Navigate to **Features** → **Call Transfer (SIP REFER)**
3. Select **Enabled**
4. Enable **PSTN Transfer**
5. Caller ID: **From Transferee** (shows original caller ID)
6. **Save**

**Enable Call Recording (optional):**
```bash
# Add to your outbound call API
const participant = await sipClient.createSipParticipant(
  OUTBOUND_TRUNK_ID,
  phoneNumber,
  roomName,
  {
    // ... existing options ...
    dtmfCapture: true, // Capture keypad input
  }
);
```

---

## 📋 Phase 8: Monitoring & Analytics (15 minutes)

### 8.1 Call Logging

**Create `packages/backend/src/utils/call-logger.ts`:**
```typescript
interface CallLog {
  callId: string;
  roomName: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'ringing' | 'answered' | 'completed' | 'failed' | 'no-answer';
  transcript?: string;
  metadata?: Record<string, any>;
}

export class CallLogger {
  private logs: CallLog[] = [];

  logCall(log: CallLog) {
    this.logs.push(log);
    console.log('[Call Log]', JSON.stringify(log));
    
    // TODO: Save to database
    // await db.calls.insert(log);
  }

  getCallStats() {
    return {
      totalCalls: this.logs.length,
      inbound: this.logs.filter(l => l.direction === 'inbound').length,
      outbound: this.logs.filter(l => l.direction === 'outbound').length,
      averageDuration: this.logs.reduce((sum, l) => sum + (l.duration || 0), 0) / this.logs.length,
    };
  }
}

export const callLogger = new CallLogger();
```

### 8.2 Add to Agent

```typescript
import { callLogger } from './utils/call-logger.js';

// In entry function, on session start
const callLog = {
  callId: ctx.job.id,
  roomName: ctx.room.name || 'unknown',
  phoneNumber: 'unknown',
  direction: 'inbound' as const,
  startTime: new Date(),
  status: 'answered' as const,
};

callLogger.logCall(callLog);

// On session end
ctx.addShutdownCallback(async () => {
  callLog.endTime = new Date();
  callLog.duration = (callLog.endTime.getTime() - callLog.startTime.getTime()) / 1000;
  callLog.status = 'completed';
  callLogger.logCall(callLog);
});
```

---

## 📊 Implementation Summary

### Files to Create/Update

**Backend:**
- ✅ `packages/backend/src/agent.ts` - Update agent for phone calls
- ✅ `packages/backend/src/api/outbound-call.ts` - NEW: Outbound call API
- ✅ `packages/backend/src/utils/call-logger.ts` - NEW: Call logging
- ✅ `packages/backend/.env.local` - Add Twilio credentials

**Frontend:**
- ✅ `packages/frontend/app/admin/outbound-calls/page.tsx` - NEW: UI for outbound calls
- ✅ `packages/frontend/app/page.tsx` - Add link to admin panel

**Configuration:**
- ✅ `config/livekit-inbound-trunk.json` - NEW: Inbound trunk config
- ✅ `config/livekit-outbound-trunk.json` - NEW: Outbound trunk config
- ✅ `config/dispatch-rule-inbound.json` - NEW: Dispatch rule

**Documentation:**
- ✅ `docs/TWILIO_INTEGRATION.md` - Already created
- ✅ `TWILIO_IMPLEMENTATION_PLAN.md` - This file

### Twilio Configuration Checklist

**Twilio Console:**
- [ ] Purchase phone number
- [ ] Create SIP trunk
- [ ] Configure origination URI (Twilio → LiveKit)
- [ ] Create credential list (for outbound)
- [ ] Associate credentials with trunk
- [ ] Associate phone number with trunk
- [ ] Enable SIP REFER (for transfers)
- [ ] Enable PSTN Transfer

**LiveKit CLI:**
- [ ] Create inbound trunk (`lk sip inbound create`)
- [ ] Create outbound trunk (`lk sip outbound create`)
- [ ] Create dispatch rule (`lk sip dispatch create`)
- [ ] Verify all (`lk sip inbound/outbound/dispatch list`)

### Testing Checklist

**Inbound:**
- [ ] Call connects
- [ ] Agent answers with correct greeting
- [ ] Agent understands and responds
- [ ] Tools work (search, cart, checkout)
- [ ] Hangup works
- [ ] Transfer works

**Outbound:**
- [ ] API call triggers call
- [ ] Call connects to customer
- [ ] Customer speaks first
- [ ] Agent responds appropriately
- [ ] Call ends gracefully

---

## 🚀 Implementation Steps (In Order)

### Day 1: Setup & Inbound (2-3 hours)

1. ✅ Complete Phase 1: Prerequisites (30 min)
2. ✅ Complete Phase 2: Inbound Configuration (20 min)
3. ✅ Complete Phase 4.1-4.3: Update agent code (30 min)
4. ✅ Complete Phase 6.1: Test inbound calls (20 min)
5. ✅ Debug and fix issues (30 min)

**Deliverable:** Working inbound calls

### Day 2: Outbound & Advanced (2-3 hours)

1. ✅ Complete Phase 3: Outbound Configuration (25 min)
2. ✅ Complete Phase 4.4: Add transfer tool (15 min)
3. ✅ Complete Phase 5: Outbound UI (30 min)
4. ✅ Complete Phase 6.2: Test outbound calls (20 min)
5. ✅ Complete Phase 8: Monitoring (15 min)
6. ✅ Test all edge cases (30 min)

**Deliverable:** Full telephony integration

### Day 3: Production Ready (1-2 hours)

1. ✅ Configure production Twilio account
2. ✅ Set up monitoring alerts
3. ✅ Load testing (100+ calls)
4. ✅ Cost optimization
5. ✅ Documentation for team

**Deliverable:** Production-ready telephony

---

## 💰 Cost Breakdown

### Development (One-time)
- Twilio setup: Free (trial credit)
- Testing: ~$5 (50 test calls)

### Monthly (Production)
- Twilio phone number: $1/month
- Twilio calls: $0.85/100 minutes (~$25/month for 3000 min)
- AI costs (STT+LLM+TTS): ~$1.50/hour (~$45/month for 30 hours)

**Total: ~$70-100/month** for 3000 minutes (~50 hours) of calls

### Scaling Costs
- 100 hours/month: ~$200/month
- 500 hours/month: ~$900/month
- 1000 hours/month: ~$1,800/month

---

## 🎯 Success Criteria

### Inbound Calls
- ✅ Calls connect within 3 seconds
- ✅ Agent answers 99%+ of calls
- ✅ Average call duration: 2-5 minutes
- ✅ Call completion rate: >90%
- ✅ Audio quality: Clear, no delays
- ✅ Transfer success rate: >95%

### Outbound Calls
- ✅ API response time: < 1 second
- ✅ Call connection rate: >80% (depends on answer rate)
- ✅ Voicemail detection: >85% accuracy
- ✅ No dropped calls

### Performance
- ✅ Agent response latency: < 1 second
- ✅ LLM TTFT: < 500ms
- ✅ TTS TTFB: < 300ms
- ✅ No audio glitches or echo

---

## 🆘 Support & Resources

**Documentation:**
- LiveKit SIP: https://docs.livekit.io/sip
- LiveKit Agents Telephony: https://docs.livekit.io/agents/start/telephony
- Twilio SIP Trunking: https://www.twilio.com/docs/sip-trunking

**CLI Help:**
```bash
lk sip --help
lk sip inbound --help
lk sip outbound --help
lk sip dispatch --help
```

**Community:**
- LiveKit Slack: https://livekit.io/join-slack
- Twilio Support: https://support.twilio.com

---

## ✅ Ready to Implement?

Say **"start twilio setup"** and I'll guide you through each step! 🚀

Or if you want to do it yourself, follow the phases above in order.

**Estimated Total Time: 4-6 hours for complete implementation**

