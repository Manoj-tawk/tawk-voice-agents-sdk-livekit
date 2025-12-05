# Twilio Phone Integration with Tawk.to Voice Agent

Complete guide to connect Twilio phone calls to your LiveKit voice agent.

## 🎯 What You'll Get

✅ **Inbound Calls**: Customers call your number → AI agent answers  
✅ **Outbound Calls**: AI agent calls customers  
✅ **Call Transfers**: Agent can transfer to human support  
✅ **DTMF Support**: Phone keypad input (press 1 for sales, etc.)  
✅ **Voicemail Detection**: Agent detects and leaves messages  
✅ **Call Hangup**: Agent can end calls programmatically  

## 📋 Prerequisites

### 1. Twilio Account Setup

1. **Sign up**: https://www.twilio.com/try-twilio
2. **Purchase a phone number**: 
   - Go to Phone Numbers → Buy a Number
   - Choose your country/region
   - Select Voice capability
   - Purchase ($1-2/month typically)

### 2. Install Twilio CLI

```bash
# macOS
brew tap twilio/brew && brew install twilio

# Verify installation
twilio --version
```

### 3. Configure Twilio CLI

```bash
# Login to Twilio
twilio login

# Create a profile
twilio profiles:list
```

### 4. Install LiveKit CLI

```bash
# macOS
brew install livekit

# Verify
lk --version
```

## 🚀 Step-by-Step Setup

### Step 1: Create Twilio SIP Trunk

**Option A: Using Twilio CLI (Recommended)**

```bash
# Create SIP trunk
twilio api:core:trunks:create \
  --friendly-name "Tawk.to Voice Agent Trunk" \
  --domain-name "tawk-voice-agent.pstn.twilio.com"

# Save the Trunk SID from output (e.g., TK...)
```

**Option B: Using Twilio Console**

1. Go to https://console.twilio.com
2. Navigate to **Elastic SIP Trunking** → **Manage** → **Trunks**
3. Click **Create new SIP Trunk**
4. Name: "Tawk.to Voice Agent Trunk"
5. Domain: `tawk-voice-agent.pstn.twilio.com`

### Step 2: Get Your LiveKit SIP URI

```bash
# If using LiveKit Cloud
# Your SIP URI is in: https://cloud.livekit.io/projects/p_/settings/project

# Example format:
# sip:YOUR_PROJECT_ID.sip.livekit.cloud

# If self-hosted (localhost)
# Your SIP URI format:
# sip:YOUR_IP:5060
```

For **localhost development**, you'll need to expose your LiveKit server to the internet (use ngrok):

```bash
# Expose LiveKit SIP port
ngrok tcp 5060
```

### Step 3: Configure Twilio for INBOUND Calls

**Set Origination URI (Twilio → LiveKit)**

```bash
# Replace <TRUNK_SID> with your Twilio trunk SID
# Replace <LIVEKIT_SIP_URI> with your LiveKit SIP URI

twilio api:core:trunks:origination-urls:create \
  --trunk-sid <TRUNK_SID> \
  --friendly-name "LiveKit SIP URI" \
  --sip-url "sip:<YOUR_PROJECT_ID>.sip.livekit.cloud" \
  --weight 1 \
  --priority 1 \
  --enabled
```

**Example:**
```bash
twilio api:core:trunks:origination-urls:create \
  --trunk-sid TKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  --friendly-name "LiveKit SIP URI" \
  --sip-url "sip:vjnxecm0tjk.sip.livekit.cloud" \
  --weight 1 \
  --priority 1 \
  --enabled
```

### Step 4: Configure Twilio for OUTBOUND Calls (Optional)

**1. Create Credential List (for authentication)**

Using Twilio Console:
1. Go to **Voice** → **Credential lists**
2. Click **Create new credential list**
3. Name: "LiveKit Credentials"
4. Add credential:
   - Username: `livekit_user`
   - Password: `your_secure_password` (save this!)

**2. Associate Credentials with Trunk**

1. Go to **Elastic SIP Trunking** → **Manage** → **Trunks**
2. Select your trunk
3. Go to **Termination** → **Authentication** → **Credential Lists**
4. Select "LiveKit Credentials"
5. Click **Save**

**3. Get Termination URI**

In your trunk settings, copy the **Termination SIP URI**:
```
Example: my-trunk.pstn.twilio.com
```

### Step 5: Associate Phone Number with Trunk

```bash
# List your phone numbers to get the SID
twilio phone-numbers:list

# Associate phone number with trunk
twilio api:core:trunks:phone-numbers:create \
  --trunk-sid <TRUNK_SID> \
  --phone-number-sid <PHONE_NUMBER_SID>
```

### Step 6: Create LiveKit SIP Trunk (Inbound)

**Using LiveKit CLI:**

```bash
# Set your LiveKit credentials
export LIVEKIT_URL=ws://localhost:7880
export LIVEKIT_API_KEY=devkey
export LIVEKIT_API_SECRET=secret

# Create inbound trunk
lk sip inbound create \
  --name "Twilio Inbound" \
  --numbers "+1234567890"  # Your Twilio phone number
```

**Or create a JSON file:**

**`twilio-inbound-trunk.json`**:
```json
{
  "trunk": {
    "name": "Twilio Inbound Trunk",
    "numbers": ["+1234567890"],
    "allowed_addresses": [],
    "allowed_numbers": [],
    "metadata": "{\"provider\": \"twilio\"}"
  }
}
```

```bash
lk sip inbound create twilio-inbound-trunk.json
```

### Step 7: Create LiveKit SIP Trunk (Outbound) - Optional

**`twilio-outbound-trunk.json`**:
```json
{
  "trunk": {
    "name": "Twilio Outbound Trunk",
    "address": "my-trunk.pstn.twilio.com:5060",
    "transport": "udp",
    "numbers": ["+1234567890"],
    "auth_username": "livekit_user",
    "auth_password": "your_secure_password",
    "metadata": "{\"provider\": \"twilio\"}"
  }
}
```

```bash
lk sip outbound create twilio-outbound-trunk.json
```

### Step 8: Create Dispatch Rule (Route Calls to Agent)

**`dispatch-rule.json`**:
```json
{
  "dispatch_rule": {
    "rule": {
      "dispatchRuleIndividual": {
        "roomPrefix": "phone-call-"
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

```bash
lk sip dispatch create dispatch-rule.json
```

This routes ALL inbound calls to rooms named `phone-call-XXXX` and dispatches the `Quinn_353` agent.

## 🔧 Update Your Agent Code

### 1. Enable Explicit Dispatch

**Update `packages/backend/src/agent.ts`:**

```typescript
// At the bottom of the file, update ServerOptions
cli.runApp(
  new ServerOptions({
    agentName: "Quinn_353", // REQUIRED for telephony
  }),
  exportedAgent,
);
```

### 2. Add Phone Greeting (Inbound)

Update the `onEnter()` method to greet phone callers:

```typescript
override async onEnter(): Promise<void> {
  // Check if this is a phone call (SIP participant)
  const isPhoneCall = Array.from(this.room.remoteParticipants.values()).some(
    (p) => p.kind === "sip"
  );

  if (isPhoneCall) {
    // Phone greeting
    this.session.generateReply({
      instructions:
        'Say "Thank you for calling tawk.to marketplace. How can I help you today?"',
    });
  } else {
    // Web/app greeting
    this.session.generateReply({
      instructions:
        'Say "Welcome to TAWK.To Marketplace!" and briefly introduce yourself.',
    });
  }
}
```

### 3. Add Hangup Tool

Add a tool to let the agent end calls:

```typescript
import { RoomServiceClient } from 'livekit-server-sdk';
import { getJobContext } from '@livekit/agents';

// Add this function before your agent class
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

// In your MarketplaceAgent tools, add:
endCall: llm.tool({
  description: 'Call this tool when the conversation is complete and the user wants to hang up. Always confirm with the user before ending the call.',
  parameters: z.object({}),
  execute: async (_, { ctx }: llm.ToolOptions) => {
    await hangUpCall();
    return "Call ended successfully. Goodbye!";
  },
}),
```

### 4. Add Call Transfer Tool (Optional)

```typescript
import { SipClient } from 'livekit-server-sdk';

// Add to your tools:
transferToHuman: llm.tool({
  description: 'Transfer the call to a human agent when the customer requests to speak with a person',
  parameters: z.object({
    reason: z.string().describe('Reason for transfer'),
  }),
  execute: async ({ reason }, { ctx }: llm.ToolOptions) => {
    // Find the SIP participant
    const sipParticipant = Array.from(ctx.room.remoteParticipants.values()).find(
      (p) => p.kind === "sip"
    );

    if (!sipParticipant) {
      return "No phone participant found";
    }

    // Inform user
    ctx.session.generateReply({
      instructions: `Tell the user: "I'll transfer you to our support team now. Please hold."`,
    });

    // Wait for speech to complete
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Transfer the call
    const sipClient = new SipClient(
      process.env.LIVEKIT_URL!,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!
    );

    const transferTo = "tel:+15105551234"; // Your human support number
    const jobContext = getJobContext();

    await sipClient.transferSipParticipant(
      jobContext!.room.name!,
      sipParticipant.identity,
      transferTo,
      { playDialtone: false }
    );

    return `Call transferred to support: ${reason}`;
  },
}),
```

## 📞 Testing

### Test Inbound Calls

1. **Start your agent**:
   ```bash
   cd packages/backend
   pnpm start
   ```

2. **Call your Twilio number**:
   - Dial the phone number you purchased
   - The agent should answer: "Thank you for calling tawk.to marketplace..."
   - Start speaking to test!

### Test Outbound Calls (Python SDK only for now)

**Note:** Outbound calling is currently only available in the Python SDK. Node.js support coming soon.

For now, you can create a simple Python script:

```python
from livekit import api
import asyncio

async def place_call():
    lkapi = api.LiveKitAPI()
    
    # Dispatch agent
    await lkapi.agent_dispatch.create_dispatch(
        api.CreateAgentDispatchRequest(
            agent_name="Quinn_353",
            room=f"outbound-{random.randint(1000, 9999)}",
            metadata='{"phone_number": "+15105550123"}'
        )
    )
    
    # Create SIP participant
    await lkapi.sip.create_sip_participant(
        api.CreateSIPParticipantRequest(
            room_name="outbound-1234",
            sip_trunk_id='ST_xxxx',  # Your outbound trunk ID
            sip_call_to="+15105550123",
            participant_identity="+15105550123",
            wait_until_answered=True,
        )
    )

asyncio.run(place_call())
```

## 🔍 Debugging

### Check SIP Trunks

```bash
# List inbound trunks
lk sip inbound list

# List outbound trunks  
lk sip outbound list

# List dispatch rules
lk sip dispatch list
```

### Check Twilio Status

```bash
# List your phone numbers
twilio phone-numbers:list

# List your trunks
twilio api:core:trunks:list

# View trunk details
twilio api:core:trunks:fetch --sid <TRUNK_SID>
```

### Common Issues

**Agent doesn't answer:**
- ✅ Check agent is running (`pnpm start`)
- ✅ Check dispatch rule is created (`lk sip dispatch list`)
- ✅ Check agent name matches dispatch rule ("Quinn_353")
- ✅ Check LiveKit server is running

**Call connects but no audio:**
- ✅ Verify Twilio origination URI is correct
- ✅ Check LiveKit logs for connection errors
- ✅ Ensure ports 5060 (SIP) and UDP 10000-20000 (RTP) are open

**Twilio errors:**
- ✅ Check Twilio debugger: https://console.twilio.com/monitor/debugger
- ✅ Verify trunk is enabled
- ✅ Verify phone number is associated with trunk

## 📊 Monitor Calls

### LiveKit Dashboard

If using LiveKit Cloud:
1. Go to https://cloud.livekit.io
2. Navigate to **Sessions**
3. Filter by room prefix: "phone-call-"
4. View call metrics, recordings, transcripts

### Twilio Logs

1. Go to https://console.twilio.com/monitor/logs/calls
2. View call details, duration, errors
3. Check debugger for SIP errors

## 💰 Cost Estimate

**Twilio:**
- Phone number: ~$1-2/month
- Inbound calls: ~$0.0085/min
- Outbound calls: ~$0.013/min

**LiveKit Agents (AI costs):**
- Deepgram STT: $0.0043/min
- OpenAI GPT-4o-mini: ~$0.001/call
- ElevenLabs TTS: $0.30/1000 chars (~$0.02/min)

**Total per minute**: ~$0.03/min (~$1.80/hour)

## 🔐 Production Checklist

- [ ] Use production Twilio account (not trial)
- [ ] Configure webhook authentication
- [ ] Enable call recording (compliance)
- [ ] Set up call queuing for high volume
- [ ] Configure failover numbers
- [ ] Enable fraud detection
- [ ] Set up monitoring alerts
- [ ] Test emergency services (E911) if required
- [ ] Implement call analytics
- [ ] Configure business hours routing

## 🌍 Regional Setup

For better latency, use region-specific endpoints:

**North America:**
```
sip:YOUR_PROJECT_ID.us-west-2.sip.livekit.cloud
```

**Europe:**
```
sip:YOUR_PROJECT_ID.eu-west-1.sip.livekit.cloud
```

**Asia Pacific:**
```
sip:YOUR_PROJECT_ID.ap-southeast-1.sip.livekit.cloud
```

## 📚 Advanced Features

### DTMF (Keypad Input)

```typescript
// Listen for DTMF tones
import { SipDTMF } from '@livekit/rtc-node';

// In your agent
ctx.room.on('dataReceived', (data, participant) => {
  if (data.topic === 'sip_dtmf') {
    const dtmf = JSON.parse(new TextDecoder().decode(data.payload));
    console.log('DTMF received:', dtmf.digit);
    
    // Handle DTMF (1 = sales, 2 = support, etc.)
    if (dtmf.digit === '1') {
      // Route to sales agent
    }
  }
});
```

### Voicemail Detection

Add to your agent's tools:

```typescript
detectedVoicemail: llm.tool({
  description: 'Call this if you detect an answering machine or voicemail system, AFTER hearing the greeting',
  parameters: z.object({}),
  execute: async (_, { ctx }: llm.ToolOptions) => {
    await ctx.session.generateReply({
      instructions:
        'Leave a brief voicemail: "Hello, this is the tawk.to marketplace assistant. I\'ll call back later. Thank you!"',
    });
    
    // Wait for message to complete
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    // Hang up
    await hangUpCall();
    
    return "Voicemail left successfully";
  },
}),
```

### Call Recording

```typescript
import { EgressClient, EncodedFileOutput, EncodedFileType } from 'livekit-server-sdk';

// In your entry function
const egressClient = new EgressClient(
  process.env.LIVEKIT_URL!.replace('ws:', 'http:'),
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

// Start recording
await egressClient.startRoomCompositeEgress(
  ctx.room.name,
  new EncodedFileOutput({
    fileType: EncodedFileType.MP4,
    filepath: `recordings/${ctx.room.name}.mp4`,
    output: {
      case: 's3',
      value: {
        accessKey: process.env.AWS_ACCESS_KEY_ID!,
        secret: process.env.AWS_SECRET_ACCESS_KEY!,
        bucket: process.env.AWS_BUCKET_NAME!,
        region: process.env.AWS_REGION!,
      },
    },
  }),
  { audioOnly: true }
);
```

## 🎯 Quick Start Commands

```bash
# 1. Start LiveKit server
docker-compose up -d

# 2. Start agent
cd packages/backend && pnpm start

# 3. Test inbound
# Call your Twilio number from any phone

# 4. Check logs
# Watch backend terminal for agent joining

# 5. View in LiveKit Cloud
# https://cloud.livekit.io/projects/p_/sessions
```

## 🆘 Need Help?

- **LiveKit Docs**: https://docs.livekit.io/sip
- **Twilio Docs**: https://www.twilio.com/docs/sip-trunking
- **LiveKit Slack**: https://livekit.io/join-slack
- **Twilio Support**: https://support.twilio.com

## 📝 Next Steps

1. **Test thoroughly**: Make 10+ test calls to ensure reliability
2. **Monitor costs**: Track Twilio and AI API usage
3. **Add analytics**: Log call duration, success rate, user satisfaction
4. **Scale**: Consider Twilio's programmable voice API for advanced routing
5. **Compliance**: Ensure TCPA, GDPR compliance if applicable

---

**Your voice agent is now ready to handle phone calls!** 📞🤖

For questions or issues, check the LiveKit and Twilio documentation linked above.

