# Quick Twilio Setup - Get Agent Answering Calls in 10 Minutes! 📞

## ✅ What's Already Done

Your agent is **READY FOR PHONE CALLS!** I've added:
- ✅ Phone detection (different greeting for phone vs web)
- ✅ Hangup tool (agent can end calls gracefully)
- ✅ Config files for LiveKit SIP
- ✅ All necessary packages

## 🚀 Setup Steps (10 minutes)

### Step 1: Add Your Twilio Keys (2 min)

**Edit:** `packages/backend/.env.local`

Add these lines:
```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### Step 2: Start ngrok (1 min)

Open a **NEW terminal** and run:
```bash
ngrok tcp 5060
```

**Copy the URL** shown (e.g., `0.tcp.ngrok.io:12345`)
**Keep this terminal open!**

### Step 3: Create Twilio SIP Trunk (2 min)

```bash
# Login to Twilio
twilio login

# Create trunk
twilio api:core:trunks:create \
  --friendly-name "Local LiveKit" \
  --domain-name "local-livekit.pstn.twilio.com"

# SAVE the Trunk SID from output (looks like: TKxxxxx...)
export TWILIO_TRUNK_SID=TKxxxxx...
```

### Step 4: Point Twilio to ngrok (1 min)

```bash
# Replace with YOUR ngrok URL from Step 2
export NGROK_URL="0.tcp.ngrok.io:12345"

# Connect Twilio to your local LiveKit
twilio api:core:trunks:origination-urls:create \
  --trunk-sid $TWILIO_TRUNK_SID \
  --friendly-name "Local ngrok" \
  --sip-url "sip:$NGROK_URL" \
  --weight 1 --priority 1 --enabled
```

### Step 5: Link Phone Number (1 min)

```bash
# List your phone numbers
twilio phone-numbers:list

# SAVE the Phone Number SID
export PHONE_NUMBER_SID=PNxxxxx...

# Link phone to trunk
twilio api:core:trunks:phone-numbers:create \
  --trunk-sid $TWILIO_TRUNK_SID \
  --phone-number-sid $PHONE_NUMBER_SID
```

### Step 6: Configure LiveKit (2 min)

```bash
cd /Users/manoj/Documents/GitHub/tawk-voice-agents-sdk-livekit

# Set up environment
export LIVEKIT_URL=http://localhost:7880
export LIVEKIT_API_KEY=devkey
export LIVEKIT_API_SECRET=secret

# UPDATE config file with YOUR phone number
# Edit config/livekit-inbound-trunk.json
# Change "+1234567890" to YOUR Twilio number

# Create inbound trunk
lk sip inbound create config/livekit-inbound-trunk.json

# Create dispatch rule
lk sip dispatch create config/dispatch-rule-inbound.json

# Verify
lk sip inbound list
lk sip dispatch list
```

### Step 7: Start Everything (1 min)

Open **3 terminals**:

**Terminal 1: LiveKit**
```bash
cd /Users/manoj/Documents/GitHub/tawk-voice-agents-sdk-livekit
docker-compose up
```

**Terminal 2: Agent**
```bash
cd /Users/manoj/Documents/GitHub/tawk-voice-agents-sdk-livekit/packages/backend
pnpm start
```

**Terminal 3: ngrok (if not already running)**
```bash
ngrok tcp 5060
```

### Step 8: TEST! 🎉

**Call your Twilio number!**

You should hear:
> "Thank you for calling tawk.to marketplace. I'm your AI shopping assistant. How may I help you today?"

Try saying:
- "I want to buy an iPhone"
- "Show me the iPhone 15"
- "Add it to my cart"
- "I'm done, goodbye" (agent will hang up!)

---

## 🔧 Troubleshooting

### Agent doesn't answer

**Check agent is running:**
```bash
# Should see: "Agent server started"
# Terminal 2 should show logs
```

**Check LiveKit is running:**
```bash
docker ps | grep livekit
```

**Check ngrok is running:**
```bash
curl http://localhost:4040/api/tunnels
# Should show "online"
```

**Check dispatch rule:**
```bash
lk sip dispatch list
# Should show agentName: "Quinn_353"
```

### Call connects but no audio

**Check SIP trunk:**
```bash
lk sip inbound list
# Should show your Twilio number
```

**Check Twilio debugger:**
https://console.twilio.com/monitor/debugger

### ngrok URL changed

If you restart ngrok, the URL changes. Update Twilio:
```bash
# Get new URL
curl http://localhost:4040/api/tunnels | jq

# Update Twilio (get origination URL SID first)
twilio api:core:trunks:origination-urls:list --trunk-sid $TWILIO_TRUNK_SID

twilio api:core:trunks:origination-urls:update \
  --trunk-sid $TWILIO_TRUNK_SID \
  --origination-url-sid OU_xxxxx \
  --sip-url "sip:NEW_NGROK_URL"
```

---

## 📝 What Changed in Your Code

### 1. `packages/backend/src/agent.ts`

**Added imports:**
```typescript
import { RoomServiceClient } from 'livekit-server-sdk';
import { getJobContext } from '@livekit/agents';
```

**Added hangup function:**
```typescript
const hangUpCall = async () => {
  const jobContext = getJobContext();
  if (!jobContext) return;
  
  const roomServiceClient = new RoomServiceClient(
    process.env.LIVEKIT_URL!,
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
  );
  
  await roomServiceClient.deleteRoom(jobContext.room.name);
};
```

**Updated `onEnter()` for phone detection:**
```typescript
override async onEnter(): Promise<void> {
  const sipParticipants = Array.from(this.room.remoteParticipants.values())
    .filter((p: any) => p.kind === 'sip');
  
  const isPhoneCall = sipParticipants.length > 0;

  if (isPhoneCall) {
    // Phone greeting
    this.session.generateReply({
      instructions: 'Say "Thank you for calling tawk.to marketplace..."',
    });
  } else {
    // Web greeting
    this.session.generateReply({
      instructions: 'Say "Welcome to TAWK.To Marketplace!"',
    });
  }
}
```

**Added `endCall` tool:**
```typescript
endCall: llm.tool({
  description: 'Call this when the customer says goodbye...',
  execute: async ({ reason }, { ctx }) => {
    await ctx.session.generateReply({
      instructions: 'Say "Thank you for calling... Goodbye!"',
    });
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await hangUpCall();
    return `Call ended: ${reason}`;
  },
}),
```

### 2. New Files Created

- `config/livekit-inbound-trunk.json` - LiveKit SIP trunk config
- `config/dispatch-rule-inbound.json` - Routes calls to Quinn_353

### 3. Packages Installed

- `livekit-server-sdk` - For SIP operations
- `@livekit/rtc-node` - For call management

---

## 🎯 Next Steps After Testing

Once it's working:
1. **Test thoroughly** - Make 10+ calls
2. **Test tools** - Try search, cart, checkout
3. **Test hangup** - Say "goodbye" and verify it hangs up
4. **Monitor costs** - Check Twilio usage

Ready for production:
- Use paid ngrok for static URL ($8/month)
- Enable call recording
- Add call analytics
- Set up monitoring

---

**Your agent is ready to answer phone calls!** 📞🤖

Need help? Check:
- `TWILIO_LOCAL_SETUP.md` - Full detailed guide
- `TWILIO_IMPLEMENTATION_PLAN.md` - Complete implementation plan
- LiveKit docs: https://docs.livekit.io/agents/start/telephony

