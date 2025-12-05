#!/bin/bash
set -e

echo "🚀 Setting up LiveKit SIP..."
echo ""

# Environment
export LIVEKIT_URL=http://localhost:7880
export LIVEKIT_API_KEY=devkey
export LIVEKIT_API_SECRET=secret

# Check if lk command exists
if ! command -v lk &> /dev/null; then
    echo "❌ LiveKit CLI (lk) not found in PATH"
    echo ""
    echo "Please run these commands manually:"
    echo ""
    echo "export LIVEKIT_URL=http://localhost:7880"
    echo "export LIVEKIT_API_KEY=devkey"
    echo "export LIVEKIT_API_SECRET=secret"
    echo "lk sip inbound create config/livekit-inbound-trunk.json"
    echo "lk sip dispatch create config/dispatch-rule-inbound.json"
    echo ""
    exit 1
fi

echo "✅ LiveKit CLI found"
echo ""

# Create inbound trunk
echo "Creating inbound SIP trunk..."
lk sip inbound create config/livekit-inbound-trunk.json 2>&1 || echo "  (May already exist)"
echo ""

# Create dispatch rule
echo "Creating dispatch rule..."
lk sip dispatch create config/dispatch-rule-inbound.json 2>&1 || echo "  (May already exist)"
echo ""

# Verify
echo "✅ Verification:"
echo "==============="
echo ""
echo "Inbound Trunks:"
lk sip inbound list
echo ""
echo "Dispatch Rules:"
lk sip dispatch list
echo ""

echo "🎉 LiveKit SIP configured!"
echo ""
echo "📞 READY TO TEST!"
echo "Call: +16043054382"
echo ""

