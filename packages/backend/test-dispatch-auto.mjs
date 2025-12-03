// Test automatic dispatch with room metadata
import { RoomServiceClient, AccessToken } from 'livekit-server-sdk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env
const envPath = join(__dirname, '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    env[key.trim()] = values.join('=').trim();
  }
});

const LIVEKIT_URL = env.LIVEKIT_URL || 'ws://localhost:7880';
const LIVEKIT_API_KEY = env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = env.LIVEKIT_API_SECRET || 'secret';

async function testAutomaticDispatch() {
  const roomClient = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
  
  const roomName = `test-auto-${Date.now()}`;
  const agentName = 'Mojo';
  
  console.log(`\n🧪 Testing automatic dispatch with room metadata:`);
  console.log(`   Room: ${roomName}`);
  console.log(`   Agent: ${agentName}\n`);
  
  try {
    // Create room with metadata containing agent name
    const room = await roomClient.createRoom({
      name: roomName,
      metadata: JSON.stringify({ agentName, agent_name: agentName }),
    });
    
    console.log('✅ Room created with metadata:', room.metadata);
    
    // Create a participant token to trigger automatic dispatch
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: 'test-user',
      name: 'Test User',
    });
    
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });
    
    const token = await at.toJwt();
    console.log('✅ Participant token created');
    console.log(`\n⏳ Waiting 5 seconds for agent to join...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check room participants
    const roomInfo = await roomClient.getRoom(roomName);
    console.log(`\n📋 Room participants: ${roomInfo.numParticipants}`);
    console.log(`✅ Test complete! Check backend logs.`);
    
    // Cleanup
    await roomClient.deleteRoom(roomName);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAutomaticDispatch();
