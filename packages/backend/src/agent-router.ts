/**
 * Agent Router
 * Routes to the correct agent instance based on agentName from dispatch
 */

import {
  type JobContext,
  type JobProcess,
  defineAgent,
  log,
  metrics,
  voice,
} from '@livekit/agents';
import * as silero from '@livekit/agents-plugin-silero';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';
import { AgentDispatchClient } from 'livekit-server-sdk';
import { createAgentSession } from './agent-factory.js';
import { agentDB } from './db/schema.js';

// Shared VAD instance (loaded once in prewarm)
let sharedVAD: silero.VAD | null = null;

/**
 * Main agent router - handles all agent dispatch requests
 * Routes to the correct agent based on agentName from dispatch
 */
export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    // Load VAD once and share across all agent instances
    if (!sharedVAD) {
      sharedVAD = await silero.VAD.load();
    }
    proc.userData.vad = sharedVAD;
  },
  entry: async (ctx: JobContext) => {
    const logger = log().child({ name: 'agent-router' });
    
    // Log all available context for debugging
    logger.info('=== Agent Router Entry Called ===');
    logger.info(`Room: ${ctx.room?.name || 'unknown'}`);
    logger.info(`Job ID: ${ctx.job?.id || 'unknown'}`);
    logger.info(`Job metadata: ${JSON.stringify(ctx.job?.metadata || {})}`);
    
    // Debug: Log the entire job object structure
    if (ctx.job) {
      logger.info(`Job object keys: ${Object.keys(ctx.job).join(', ')}`);
      // @ts-ignore - Check for agentName property
      if (ctx.job.agentName !== undefined) {
        logger.info(`Job.agentName: "${ctx.job.agentName}"`);
      }
    }
    
    // Get agent name from dispatch request
    // Try multiple sources
    let agentName: string | undefined;
    
    // Method 1: Check if agentName is directly on job object (for explicit dispatch)
    // Note: This only works if ServerOptions has matching agentName
    // @ts-ignore - agentName might be available on job
    if (ctx.job?.agentName && ctx.job.agentName !== '') {
      agentName = ctx.job.agentName;
      logger.info(`✅ Found agent name on job.agentName: ${agentName}`);
    } else if (ctx.job?.agentName === '') {
      logger.warn(`⚠️  Job.agentName is empty string - explicit dispatch may not be working`);
      logger.warn(`   This happens when ServerOptions doesn't have matching agentName`);
    }
    
    // Method 2: From job metadata (recommended for explicit dispatch)
    if (!agentName && ctx.job?.metadata) {
      try {
        const metadata = typeof ctx.job.metadata === 'string' 
          ? JSON.parse(ctx.job.metadata) 
          : ctx.job.metadata;
        agentName = metadata.agentName || metadata.agent_name;
        if (agentName) {
          logger.info(`✅ Found agent name in job metadata: ${agentName}`);
        }
      } catch (e) {
        logger.warn(`Failed to parse job metadata: ${e}`);
      }
    }
    
    // Method 3: Try to get from room metadata (for automatic dispatch)
    // @ts-ignore - room might have metadata
    if (!agentName && ctx.room?.metadata) {
      try {
        const roomMetadata = typeof ctx.room.metadata === 'string'
          ? JSON.parse(ctx.room.metadata)
          : ctx.room.metadata;
        agentName = roomMetadata.agentName || roomMetadata.agent_name;
        if (agentName) {
          logger.info(`✅ Found agent name in room metadata: ${agentName}`);
        }
      } catch (e) {
        // Ignore
      }
    }
    
    // Method 4: Query dispatch by dispatchId to get agentName (SKIP for automatic dispatch - too slow)
    // Only use this if we're using explicit dispatch, which we're not anymore
    // SKIPPED for performance - room metadata is faster
    /*
    if (!agentName && ctx.job?.dispatchId) {
      try {
        const dispatchId = ctx.job.dispatchId;
        logger.info(`🔍 Querying dispatch by ID: ${dispatchId}`);
        
        // Get LiveKit credentials from environment
        let livekitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';
        // Convert ws:// or wss:// to http:// or https:// for API calls
        const apiUrl = livekitUrl.replace(/^ws/, 'http');
        const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
        const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
        
        logger.info(`   API URL: ${apiUrl}`);
        const dispatchClient = new AgentDispatchClient(apiUrl, apiKey, apiSecret);
        
        // Get room name from job.room (it's available even before connecting)
        const roomName = ctx.job.room?.name;
        logger.info(`   Room name from job: ${roomName || 'not available'}`);
        
        if (roomName) {
          const dispatches = await dispatchClient.listDispatch(roomName);
          logger.info(`   Found ${dispatches.length} dispatch(es) in room`);
          
          // Log all dispatches for debugging
          dispatches.forEach((d, i) => {
            logger.info(`   Dispatch ${i+1}: ID=${d.dispatchId}, agentName="${d.agentName || ''}", metadata="${d.metadata || 'none'}"`);
          });
          
          // Try to find by dispatchId first
          let matchingDispatch = dispatches.find(d => d.dispatchId === dispatchId);
          
          // If not found by ID, use the first dispatch with an agentName (for explicit dispatch)
          if (!matchingDispatch) {
            matchingDispatch = dispatches.find(d => d.agentName && d.agentName !== '');
            if (matchingDispatch) {
              logger.info(`   Using dispatch with agentName (ID: ${matchingDispatch.dispatchId})`);
            }
          }
          
          if (matchingDispatch) {
            logger.info(`   Selected dispatch: agentName="${matchingDispatch.agentName || ''}", metadata="${matchingDispatch.metadata || 'none'}"`);
            
            if (matchingDispatch.agentName) {
              agentName = matchingDispatch.agentName;
              logger.info(`✅ Found agent name from dispatch: ${agentName}`);
            }
            
            // Also try to parse metadata if available
            if (!agentName && matchingDispatch.metadata) {
              try {
                const dispatchMetadata = JSON.parse(matchingDispatch.metadata);
                agentName = dispatchMetadata.agentName || dispatchMetadata.agent_name;
                if (agentName) {
                  logger.info(`✅ Found agent name in dispatch metadata: ${agentName}`);
                }
              } catch (e) {
                logger.warn(`Failed to parse dispatch metadata: ${e}`);
              }
            }
          } else {
            logger.warn(`   No dispatch with agentName found`);
          }
        } else {
          logger.warn(`   Cannot query dispatch: room name not available`);
        }
      } catch (e) {
        logger.warn(`Failed to query dispatch: ${e}`);
      }
    }
    */
    
    // Method 5: Get from room metadata (for automatic dispatch) - PRIMARY METHOD
    // This is the PRIMARY method when using automatic dispatch with room metadata
    // OPTIMIZATION: Try to get room name from job first, then query room API for metadata
    // This avoids connecting to the room just to read metadata
    if (!agentName && ctx.job?.room?.name) {
      try {
        const roomName = ctx.job.room.name;
        logger.info(`Querying room metadata for: ${roomName}`);
        
        // Query room metadata via API instead of connecting
        const livekitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';
        const apiUrl = livekitUrl.replace(/^ws/, 'http');
        const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
        const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
        
        const { RoomServiceClient } = await import('livekit-server-sdk');
        const roomClient = new RoomServiceClient(apiUrl, apiKey, apiSecret);
        
        const rooms = await roomClient.listRooms([roomName]);
        if (rooms.length > 0 && rooms[0]?.metadata) {
          const roomMetadata = JSON.parse(rooms[0].metadata);
          agentName = roomMetadata.agentName || roomMetadata.agent_name;
          if (agentName) {
            logger.info(`✅ Found agent name in room metadata (via API): ${agentName}`);
          }
        }
      } catch (e) {
        logger.warn(`Failed to query room metadata via API: ${e}`);
      }
    }
    
    // Fallback: Connect to room if API query failed
    if (!agentName && ctx.room) {
      try {
        logger.info('Connecting to room to read metadata (fallback)...');
        await ctx.connect();
        
        // @ts-ignore - room might have metadata
        if (ctx.room?.metadata) {
          const roomMetadata = typeof ctx.room.metadata === 'string'
            ? JSON.parse(ctx.room.metadata)
            : ctx.room.metadata;
          agentName = roomMetadata.agentName || roomMetadata.agent_name;
          if (agentName) {
            logger.info(`✅ Found agent name in room metadata (via connection): ${agentName}`);
          }
        }
      } catch (e) {
        logger.warn(`Failed to connect to room for metadata: ${e}`);
      }
    }
    
    // Fallback - try to get from all agents in DB (if only one enabled)
    if (!agentName) {
      const allAgents = await agentDB.getAll();
      const enabledAgents = allAgents.filter(a => a.enabled);
      if (enabledAgents.length === 1 && enabledAgents[0]) {
        agentName = enabledAgents[0].name;
        logger.info(`✅ Using single enabled agent: ${agentName}`);
      }
    }
    
    // Final fallback
    if (!agentName) {
      agentName = 'test-agent';
      logger.warn(`⚠️  No agent name found, using default: ${agentName}`);
      logger.warn(`   This might mean explicit dispatch is not working correctly`);
    }
    
    logger.info(`🎯 Routing to agent: ${agentName}`);
    
    // Load agent configuration from database
    const vad = ctx.proc.userData.vad! as silero.VAD;
    const agentConfig = await createAgentSession(agentName, vad);
    
    if (!agentConfig) {
      logger.error(`Failed to load agent configuration: ${agentName}`);
      return;
    }
    
    const { session, agent } = agentConfig;
    
    // Metrics collection
    const usageCollector = new metrics.UsageCollector();
    session.on(voice.AgentSessionEventTypes.MetricsCollected, (ev) => {
      metrics.logMetrics(ev.metrics);
      usageCollector.collect(ev.metrics);
    });
    
    const logUsage = async () => {
      const summary = usageCollector.getSummary();
      logger.info(`Usage for ${agentName}: ${JSON.stringify(summary)}`);
    };
    
    ctx.addShutdownCallback(logUsage);
    
    // Start the session FIRST (like the original agent)
    // The session will handle the conversation loop automatically
    logger.info('Starting agent session...');
    
    // Note: We need ctx.room to exist, but we don't need to connect yet
    // The session.start() will handle the room connection internally
    if (!ctx.room) {
      logger.error('Room is not available in context');
      return;
    }
    
    // Start the session (like the original agent)
    await session.start({
      agent,
      room: ctx.room,
      inputOptions: {
        noiseCancellation: BackgroundVoiceCancellation(),
      },
    });
    
    logger.info('Agent session started successfully!');
    
    // Connect to room AFTER starting session (like the original agent)
    await ctx.connect();
    logger.info(`Connected to room: ${ctx.room?.name || 'unknown'}`);
    
    // Generate initial greeting to start the conversation
    // This ensures the agent speaks first and the user knows it's ready
    logger.info('Generating initial greeting...');
    await session.generateReply({
      instructions: 'Greet the user warmly and offer your assistance. Keep it brief and friendly.',
      allowInterruptions: true,
    });
    
    logger.info('Agent is ready and waiting for user input');
  },
});

