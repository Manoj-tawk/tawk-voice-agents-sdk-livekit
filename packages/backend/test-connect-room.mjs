// Test: Connect to room first, then read metadata
import { AgentDispatchClient, RoomServiceClient } from 'livekit-server-sdk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) env[key.trim()] = values.join('=').trim();
});

const LIVEKIT_URL = env.LIVEKIT_URL || 'ws://localhost:7880';
const LIVEKIT_API_KEY = env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = env.LIVEKIT_API_SECRET || 'secret';

async function test() {
  const dispatchClient = new AgentDispatchClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
  const roomClient = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
  
  const roomName = `test-${Date.now()}`;
  const agentName = 'Mojo';
  
  console.log(`\n🔍 Testing dispatch with agentName: ${agentName}`);
  
  // Create explicit dispatch
  const dispatch = await dispatchClient.createDispatch(roomName, agentName, {
    metadata: JSON.stringify({ agentName, agent_name: agentName }),
  });
  
  console.log(`✅ Dispatch created:`);
  console.log(`   Dispatch ID: ${dispatch.dispatchId}`);
  console.log(`   Agent Name: ${dispatch.agentName}`);
  console.log(`   Metadata: ${dispatch.metadata}`);
  
  // List dispatches to see what's available
  const dispatches = await dispatchClient.listDispatch(roomName);
  console.log(`\n📋 All dispatches in room:`);
  dispatches.forEach((d, i) => {
    console.log(`   ${i+1}. ID: ${d.dispatchId}, Agent: ${d.agentName}, Metadata: ${d.metadata || 'none'}`);
  });
  
  console.log(`\n⏳ Waiting 3 seconds...`);
  await new Promise(r => setTimeout(r, 3000));
  
  // Try to get room info
  try {
    const rooms = await roomClient.listRooms([roomName]);
    if (rooms.length > 0) {
      console.log(`\n🏠 Room info:`);
      console.log(`   Name: ${rooms[0].name}`);
      console.log(`   Metadata: ${rooms[0].metadata || 'none'}`);
      console.log(`   Participants: ${rooms[0].numParticipants}`);
    }
  } catch (e) {
    console.log(`\n⚠️  Could not get room info: ${e.message}`);
  }
}

test();
