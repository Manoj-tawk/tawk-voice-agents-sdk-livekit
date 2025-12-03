// Test agent dispatch
import { AgentDispatchClient } from 'livekit-server-sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

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

async function testDispatch() {
  const client = new AgentDispatchClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
  
  const roomName = `test-room-${Date.now()}`;
  const agentName = 'Mojo';
  
  console.log(`\n🧪 Testing agent dispatch:`);
  console.log(`   Room: ${roomName}`);
  console.log(`   Agent: ${agentName}`);
  console.log(`   Server: ${LIVEKIT_URL}\n`);
  
  try {
    const dispatch = await client.createDispatch(roomName, agentName, {
      metadata: JSON.stringify({ agentName, agent_name: agentName }),
    });
    
    console.log('✅ Dispatch created:', dispatch.agentName);
    console.log(`\n⏳ Waiting 5 seconds for agent to join...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log(`\n✅ Test complete! Check backend logs.`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDispatch();
