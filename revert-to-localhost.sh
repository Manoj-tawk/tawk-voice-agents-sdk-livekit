#!/bin/bash

echo "🔧 Reverting to localhost configuration..."
echo ""

# Update Frontend .env.local
echo "📝 Updating packages/frontend/.env.local..."
cat << 'EOF' > packages/frontend/.env.local
# LiveKit Server (localhost)
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret

# Public URL for frontend
NEXT_PUBLIC_LIVEKIT_URL=ws://localhost:7880
EOF

echo "✅ Frontend .env.local updated to localhost"

# Read existing API keys from backend
echo ""
echo "📝 Reading existing API keys from backend..."
OPENAI_KEY=$(grep "OPENAI_API_KEY=" packages/backend/.env.local 2>/dev/null | cut -d'=' -f2)
DEEPGRAM_KEY=$(grep "DEEPGRAM_API_KEY=" packages/backend/.env.local 2>/dev/null | cut -d'=' -f2)
ELEVENLABS_KEY=$(grep "ELEVENLABS_API_KEY=" packages/backend/.env.local 2>/dev/null | cut -d'=' -f2)

# Update Backend .env.local
echo "📝 Updating packages/backend/.env.local..."
cat > packages/backend/.env.local << EOF
# LiveKit Server (localhost)
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret

# AI Service API Keys
OPENAI_API_KEY=$OPENAI_KEY
DEEPGRAM_API_KEY=$DEEPGRAM_KEY
ELEVENLABS_API_KEY=$ELEVENLABS_KEY
EOF

echo "✅ Backend .env.local updated to localhost"

echo ""
echo "🎉 Done! Reverted to localhost configuration"
echo ""
echo "📱 Access at: http://localhost:3000"
echo ""
echo "⚠️  Remember to restart backend and frontend services!"

