/**
 * Main agent entry point
 * Uses a router agent that dynamically loads agents from database
 */

import { ServerOptions, cli, log } from '@livekit/agents';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';
import { startAPIServer } from './api/server.js';
import { agentDB } from './db/schema.js';

dotenv.config({ path: '.env.local' });

// Start API server first
const API_PORT = parseInt(process.env.AGENT_API_PORT || '3001', 10);
startAPIServer(API_PORT)
  .then(() => {
    console.log(`✅ Agent Management API running on port ${API_PORT}`);
    console.log(`   Health: http://localhost:${API_PORT}/health`);
    console.log(`   Agents: http://localhost:${API_PORT}/api/agents`);
  })
  .catch((err) => {
    console.error('❌ Failed to start API server:', err);
  });

// Verify we have at least one agent in database and start agent server
agentDB.getAll()
  .then((agents) => {
    // Use console.log for startup messages (logger not initialized yet)
    if (agents.length === 0) {
      console.warn('⚠️  No agents in database! Create agents via API first.');
      console.warn('   Example: POST http://localhost:3001/api/agents');
      console.warn('   The agent server will start but agents won\'t join until created.');
    } else {
      const enabledAgents = agents.filter(a => a.enabled);
      console.log(`📋 Found ${agents.length} agent(s) in database (${enabledAgents.length} enabled)`);
      enabledAgents.forEach(a => console.log(`   - ${a.name}`));
    }
    
    // Start agent server with router
    // The router will dynamically load agents from database based on dispatch request
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const routerPath = join(currentDir, 'agent-router.js');
    
    console.log('🚀 Starting agent server with dynamic routing...');
    
    cli.runApp(
      new ServerOptions({
        agent: routerPath,
        // No agentName - this allows the router to handle all dispatch requests
        // The router extracts agentName from metadata and loads from database
      }),
    );
  })
  .catch((err) => {
    console.error('Failed to start agent server:', err);
    process.exit(1);
  });
