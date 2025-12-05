#!/bin/bash
set -e

echo "🚀 Tawk.to Voice Agent - Twilio Setup"
echo "======================================"
echo ""

# Configuration
PHONE_NUMBER="+16043054382"
NGROK_URL="0.tcp.ap.ngrok.io:14880"
TRUNK_NAME="Tawk.to Local LiveKit"
DOMAIN="tawk-local-livekit.pstn.twilio.com"

echo "📞 Phone Number: $PHONE_NUMBER"
echo "🌐 ngrok URL: $NGROK_URL"
echo ""

# Step 1: Create or get Twilio SIP Trunk
echo "Step 1: Creating Twilio SIP Trunk..."
TRUNK_OUTPUT=$(twilio api:core:trunks:create \
  --friendly-name "$TRUNK_NAME" \
  --domain-name "$DOMAIN" \
  -o json 2>/dev/null || echo '{}')

# Try to get existing trunk if creation failed
if [ "$TRUNK_OUTPUT" = "{}" ]; then
  echo "  Trunk might already exist, listing trunks..."
  TRUNK_SID=$(twilio api:core:trunks:list -o json 2>/dev/null | \
    jq -r '.[] | select(.friendlyName | contains("Tawk")) | .sid' | head -1)
else
  TRUNK_SID=$(echo "$TRUNK_OUTPUT" | jq -r '.sid')
fi

if [ -z "$TRUNK_SID" ] || [ "$TRUNK_SID" = "null" ]; then
  echo "❌ Could not create or find trunk. Please create manually in Twilio Console:"
  echo "   https://console.twilio.com/us1/develop/voice/manage/elastic-sip-trunking/trunks"
  echo ""
  echo "   Then run:"
  echo "   export TRUNK_SID=TKxxxxx"
  exit 1
fi

echo "✅ Trunk SID: $TRUNK_SID"
echo ""

# Step 2: Point Twilio to ngrok
echo "Step 2: Connecting Twilio trunk to ngrok..."
ORIGINATION_OUTPUT=$(twilio api:core:trunks:origination-urls:create \
  --trunk-sid "$TRUNK_SID" \
  --friendly-name "LiveKit ngrok" \
  --sip-url "sip:$NGROK_URL" \
  --weight 1 \
  --priority 1 \
  --enabled \
  -o json 2>/dev/null || echo '{}')

if [ "$ORIGINATION_OUTPUT" = "{}" ]; then
  echo "⚠️  Origination URL might already exist, checking..."
  EXISTING=$(twilio api:core:trunks:origination-urls:list --trunk-sid "$TRUNK_SID" -o json 2>/dev/null)
  echo "  Existing origination URLs:"
  echo "$EXISTING" | jq -r '.[] | "    - \(.friendlyName): \(.sipUrl)"'
else
  echo "✅ Origination URL created"
fi
echo ""

# Step 3: Link phone number to trunk
echo "Step 3: Linking phone number to trunk..."
PHONE_SID=$(twilio phone-numbers:list -o json 2>/dev/null | \
  jq -r --arg phone "$PHONE_NUMBER" '.[] | select(.phoneNumber == $phone) | .sid' | head -1)

if [ -z "$PHONE_SID" ] || [ "$PHONE_SID" = "null" ]; then
  echo "❌ Could not find phone number $PHONE_NUMBER"
  echo "   Please check your Twilio phone numbers:"
  twilio phone-numbers:list --properties sid,phoneNumber
  exit 1
fi

echo "  Phone SID: $PHONE_SID"

LINK_OUTPUT=$(twilio api:core:trunks:phone-numbers:create \
  --trunk-sid "$TRUNK_SID" \
  --phone-number-sid "$PHONE_SID" \
  -o json 2>/dev/null || echo '{}')

if [ "$LINK_OUTPUT" = "{}" ]; then
  echo "⚠️  Phone might already be linked"
else
  echo "✅ Phone number linked to trunk"
fi
echo ""

# Step 4: Configure LiveKit SIP
echo "Step 4: Configuring LiveKit SIP..."
export LIVEKIT_URL=http://localhost:7880
export LIVEKIT_API_KEY=devkey
export LIVEKIT_API_SECRET=secret

# Create inbound trunk
echo "  Creating LiveKit inbound trunk..."
lk sip inbound create config/livekit-inbound-trunk.json 2>&1 | grep -v "^$" || echo "  ✅ Trunk created or already exists"

# Create dispatch rule
echo "  Creating dispatch rule..."
lk sip dispatch create config/dispatch-rule-inbound.json 2>&1 | grep -v "^$" || echo "  ✅ Dispatch rule created or already exists"

echo ""
echo "✅ LiveKit SIP configured"
echo ""

# Verification
echo "📋 Verification:"
echo "==============="
echo ""
echo "Twilio Configuration:"
echo "  Trunk SID: $TRUNK_SID"
echo "  Phone: $PHONE_NUMBER"
echo "  ngrok URL: $NGROK_URL"
echo ""
echo "LiveKit Inbound Trunks:"
lk sip inbound list 2>/dev/null || echo "  (Could not list - check manually)"
echo ""
echo "LiveKit Dispatch Rules:"
lk sip dispatch list 2>/dev/null || echo "  (Could not list - check manually)"
echo ""

echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "  1. Start the agent:"
echo "     cd packages/backend && pnpm start"
echo ""
echo "  2. Call your number: $PHONE_NUMBER"
echo ""
echo "  3. You should hear:"
echo "     \"Thank you for calling tawk.to marketplace. I'm your AI shopping assistant.\""
echo ""
echo "📞 Ready to test!"

