# Twilio + LiveKit LOCAL Setup (No Cloud!)
## Get Phone Calls Working on Localhost in 30 Minutes

---

## 🏠 100% Local Setup

Everything runs on YOUR machine:
- ✅ LiveKit server: `localhost:7880`
- ✅ Agent server: `localhost:8081`
- ✅ Frontend: `localhost:3000`
- ✅ ngrok tunnel: Exposes localhost to Twilio

**NO LiveKit Cloud. NO external services (except Twilio for phone numbers and ngrok for tunneling).**

---

## ⚡ Quick Start (30 minutes)

### Step 1: Install Tools (5 min)

```bash
# Install Twilio CLI
brew install twilio

# Install LiveKit CLI  
brew install livekit

# Install ngrok
brew install ngrok

# Login to Twilio (creates profile)
twilio login

# Configure ngrok (get free token from https://dashboard.ngrok.com/signup)
ngrok config add-authtoken YOUR_NGROK_TOKEN
```

### Step 2: Get Twilio Phone Number (2 min)

**Option A: Buy via CLI**
```bash
# Search for available numbers
twilio phone-numbers:available:local:list --country-code US

# Buy a number (note the SID)
twilio phone-numbers:buy +1234567890
```

**Option B: Buy via Console**
1. Go to: https://console.twilio.com/phone-numbers
2. Click "Buy a number"
3. Select Voice capability
4. Purchase (~$1/month)

### Step 3: Create Twilio SIP Trunk (3 min)

```bash
# Create trunk
twilio api:core:trunks:create \
  --friendly-name "Local LiveKit" \
  --domain-name "local-livekit.pstn.twilio.com"

# Save the Trunk SID from output (looks like: TKxxxxx...)
export TWILIO_TRUNK_SID=TKxxxxx...
```

### Step 4: Start ngrok Tunnel (2 min)

**CRITICAL:** This exposes your localhost LiveKit to Twilio.

```bash
# Open a NEW terminal and run:
ngrok tcp 5060

# You'll see output like:
# Forwarding: tcp://0.tcp.ngrok.io:12345 -> localhost:5060
#
# COPY THIS: 0.tcp.ngrok.io:12345
```

**⚠️ Keep this terminal open!** If you close it, calls won't work.

### Step 5: Point Twilio to ngrok (2 min)

```bash
# Replace with YOUR ngrok URL from Step 4
export NGROK_URL="0.tcp.ngrok.io:12345"

# Point Twilio to ngrok
twilio api:core:trunks:origination-urls:create \
  --trunk-sid $TWILIO_TRUNK_SID \
  --friendly-name "Local ngrok" \
  --sip-url "sip:$NGROK_URL" \
  --weight 1 --priority 1 --enabled
```

### Step 6: Link Phone Number to Trunk (1 min)

```bash
# List your phone numbers to get the SID
twilio phone-numbers:list

# Save the Phone Number SID
export PHONE_NUMBER_SID=PNxxxxx...

# Link phone to trunk
twilio api:core:trunks:phone-numbers:create \
  --trunk-sid $TWILIO_TRUNK_SID \
  --phone-number-sid $PHONE_NUMBER_SID
```

### Step 7: Configure LOCAL LiveKit (3 min)

```bash
cd /Users/manoj/Documents/GitHub/tawk-voice-agents-sdk-livekit

# Set up environment for LiveKit CLI
export LIVEKIT_URL=http://localhost:7880
export LIVEKIT_API_KEY=devkey
export LIVEKIT_API_SECRET=secret

# Create inbound trunk config
mkdir -p config
cat > config/livekit-inbound-trunk.json << 'EOF'
{
  "trunk": {
    "name": "Twilio Local Inbound",
    "numbers": ["+1234567890"],
    "allowed_addresses": [],
    "allowed_numbers": [],
    "metadata": "{\"provider\": \"twilio\", \"type\": \"local\"}"
  }
}
EOF

# Replace +1234567890 with YOUR Twilio number!
```

### Step 8: Create LiveKit Inbound Trunk (2 min)

```bash
# Create the trunk
lk sip inbound create config/livekit-inbound-trunk.json

# Verify it was created
lk sip inbound list
```

### Step 9: Create Dispatch Rule (2 min)

This tells LiveKit to route incoming calls to your agent.

```bash
# Create dispatch rule
cat > config/dispatch-rule-inbound.json << 'EOF'
{
  "dispatch_rule": {
    "rule": {
      "dispatchRuleIndividual": {
        "roomPrefix": "phone-"
      }
    },
    "roomConfig": {
      "agents": [{
        "agentName": "Quinn_353"
      }]
    }
  }
}
EOF

# Apply the rule
lk sip dispatch create config/dispatch-rule-inbound.json

# Verify
lk sip dispatch list
```

### Step 10: Update Agent Code (5 min)

Add phone detection to your agent:

**File:** `packages/backend/src/agent.ts`

```typescript
// Add at the top after imports
import { RoomServiceClient } from 'livekit-server-sdk';
import { getJobContext } from '@livekit/agents';

// Update the onEnter() method in MarketplaceAgent class
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
    // Web/app greeting - keep existing
    this.session.generateReply({
      instructions:
        'Say "Welcome to TAWK.To Marketplace!" and briefly introduce yourself as their shopping assistant.',
    });
  }
}
```

### Step 11: Start Everything (3 min)

Open 3 terminals:

**Terminal 1: LiveKit Server**
```bash
cd /Users/manoj/Documents/GitHub/tawk-voice-agents-sdk-livekit
docker-compose up
```

**Terminal 2: Agent Server**
```bash
cd /Users/manoj/Documents/GitHub/tawk-voice-agents-sdk-livekit/packages/backend
pnpm start
```

**Terminal 3: ngrok (if not already running)**
```bash
ngrok tcp 5060
```

### Step 12: TEST! 🎉

**Call your Twilio number from your phone!**

You should hear:
> "Thank you for calling tawk.to marketplace. I'm your AI shopping assistant. How may I help you today?"

Try saying:
- "I'm looking for an iPhone"
- "Show me the cart"
- "I'm done, goodbye"

---

## 🎯 What Just Happened?

```
Your Phone
   ↓
Twilio (receives call)
   ↓
ngrok tunnel (0.tcp.ngrok.io:12345)
   ↓
localhost:5060 (LiveKit SIP)
   ↓
localhost:7880 (LiveKit WebRTC)
   ↓
localhost:8081 (Your Agent)
   ↓
AI responds via same path
   ↓
Your Phone hears the AI!
```

---

## 🔧 Troubleshooting

### ❌ Call doesn't connect

**Check ngrok is running:**
```bash
# Should show "Session Status: online"
curl http://localhost:4040/api/tunnels
```

**Check LiveKit is running:**
```bash
docker ps | grep livekit
# Should show a running container
```

**Check agent is running:**
```bash
# In the agent terminal, you should see:
# [backend] Agent server started
# [backend] Listening for agent dispatch
```

### ❌ "No agent available" error

**Check dispatch rule:**
```bash
lk sip dispatch list
# Should show your rule with agentName: "Quinn_353"
```

**Check agent name matches:**
```typescript
// In packages/backend/src/agent.ts, at the bottom:
cli.runApp(
  new ServerOptions({
    agentName: "Quinn_353", // Must match dispatch rule!
  }),
  exportedAgent,
);
```

### ❌ Agent joins but no audio

**Check SIP trunk:**
```bash
lk sip inbound list
# Should show your Twilio number
```

**Check LiveKit logs:**
```bash
docker logs livekit-1 --tail 100
# Look for SIP-related errors
```

### ❌ ngrok URL keeps changing

Free ngrok URLs change every restart. Solutions:
1. **Paid ngrok** ($8/month): Get a static URL
2. **Update Twilio** each time:
   ```bash
   # Get current ngrok URL
   curl http://localhost:4040/api/tunnels | jq
   
   # Update Twilio
   twilio api:core:trunks:origination-urls:update \
     --trunk-sid $TWILIO_TRUNK_SID \
     --origination-url-sid OU_xxxxx \
     --sip-url "sip:NEW_NGROK_URL"
   ```

---

## 📞 Add Hangup Tool (Optional)

Let the agent end calls gracefully:

**File:** `packages/backend/src/agent.ts`

```typescript
// Add this function BEFORE the MarketplaceAgent class
const hangUpCall = async () => {
  const jobContext = getJobContext();
  if (!jobContext) return;

  const roomServiceClient = new RoomServiceClient(
    process.env.LIVEKIT_URL!,
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
  );

  if (jobContext.room.name) {
    await roomServiceClient.deleteRoom(jobContext.room.name);
  }
};

// In your MarketplaceAgent constructor, add to tools:
endCall: llm.tool({
  description: 'Call this when the customer says goodbye or wants to end the call',
  parameters: z.object({
    reason: z.string().describe('Brief reason for ending call'),
  }),
  execute: async ({ reason }, { ctx }: llm.ToolOptions) => {
    // Say goodbye
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

Now when the customer says "goodbye", the agent will hang up properly!

---

## 🚀 Outbound Calls (Bonus)

Want the agent to CALL customers? See the full guide: `TWILIO_IMPLEMENTATION_PLAN.md` Phase 3.

Quick setup:
1. Create outbound trunk in Twilio
2. Add credentials for authentication
3. Create REST API to trigger calls
4. Use `SipClient.createSipParticipant()`

---

## 💰 Cost (Local Setup)

**One-time:**
- Twilio phone: $1/month
- ngrok (optional paid): $8/month

**Per-minute:**
- Twilio inbound: ~$0.0085/min
- AI costs: ~$0.03/min (STT + LLM + TTS)

**Total: ~$0.04/minute** (~$2.40/hour)

---

## ✅ Success Checklist

After setup, you should have:
- [x] Twilio phone number purchased
- [x] Twilio SIP trunk created
- [x] ngrok tunnel running (5060 → localhost)
- [x] LiveKit inbound trunk configured
- [x] Dispatch rule created
- [x] Agent code updated for phone detection
- [x] All services running (LiveKit, Agent, ngrok)
- [x] **TEST: Call your number, agent answers!** 🎉

---

## 📚 Next Steps

1. **Add call transfer** - Route to human agents
2. **Add voicemail detection** - Leave messages
3. **Add outbound calling** - Agent calls customers
4. **Add call recording** - Save conversations
5. **Add call analytics** - Track metrics

See full implementation plan: `TWILIO_IMPLEMENTATION_PLAN.md`

---

## 🆘 Need Help?

**Quick debug:**
```bash
# Check everything is running
docker ps                    # LiveKit should be running
curl localhost:7880          # Should connect
curl localhost:4040/status   # ngrok status
lk sip inbound list          # Should show your trunk
lk sip dispatch list         # Should show dispatch rule
```

**Still stuck?**
- Check Twilio debugger: https://console.twilio.com/monitor/debugger
- Check LiveKit logs: `docker logs livekit-1 --tail 100 --follow`
- Check agent logs: Terminal 2 (where agent is running)

---

**Your AI agent is now answering phone calls locally!** 📞🤖🏠

