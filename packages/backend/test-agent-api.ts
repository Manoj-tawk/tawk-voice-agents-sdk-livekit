/**
 * Standalone test script to create an agent and verify the API works
 */

import { startAPIServer } from './src/api/server.js';
import { agentDB } from './src/db/schema.js';

async function test() {
  console.log('Starting API server...');
  await startAPIServer(3001);
  
  console.log('\n✅ API server started');
  console.log('Creating test agent...\n');
  
  // Create a test agent
  const agent = await agentDB.create({
    name: 'test-agent',
    instructions: 'You are a friendly and helpful voice assistant. Keep your responses brief and conversational.',
    enabled: true,
    stt: {
      provider: 'deepgram',
      model: 'nova-3',
    },
    llm: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.7,
    },
    tts: {
      provider: 'elevenlabs',
      voiceId: 'Xb7hH8MSUJpSbSDYk0k2',
      voiceName: 'Alice',
      modelId: 'eleven_turbo_v2_5',
    },
    voiceOptions: {
      preemptiveGeneration: true,
      noiseCancellation: true,
    },
  });
  
  console.log('✅ Agent created:', agent.name);
  console.log('\nAgent details:');
  console.log(JSON.stringify(agent, null, 2));
  
  // List all agents
  const allAgents = await agentDB.getAll();
  console.log(`\n✅ Total agents in database: ${allAgents.length}`);
  
  console.log('\n🎉 Test complete!');
  console.log('\nYou can now:');
  console.log('1. Test API: curl http://localhost:3001/api/agents');
  console.log('2. Use agent in frontend with agentName: "test-agent"');
  console.log('\nPress Ctrl+C to stop the server');
}

test().catch(console.error);

