/**
 * Agent Factory - Creates agent sessions from database configurations
 */

import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as elevenlabs from '@livekit/agents-plugin-elevenlabs';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';
import { voice } from '@livekit/agents';
import { agentDB, type AgentConfig } from './db/schema.js';
import { log } from '@livekit/agents';

/**
 * Create an agent class from configuration
 */
function createAgentClass(config: AgentConfig) {
  class DynamicAgent extends voice.Agent {
    constructor() {
      super({
        instructions: config.instructions,
      });
    }
  }
  return DynamicAgent;
}

/**
 * Create an agent session from database configuration
 */
export async function createAgentSession(
  agentName: string,
  vad: silero.VAD,
): Promise<{ session: voice.AgentSession; agent: voice.Agent } | null> {
  const logger = log().child({ name: `agent-${agentName}` });
  
  // Load agent configuration from database
  const config = await agentDB.getByName(agentName);
  
  if (!config) {
    logger.error(`Agent configuration not found: ${agentName}`);
    return null;
  }
  
  if (!config.enabled) {
    logger.warn(`Agent is disabled: ${agentName}`);
    return null;
  }
  
  logger.info(`Loading agent configuration: ${agentName}`);
  
  // Create STT based on configuration
  let stt: deepgram.STT | openai.STT;
  if (config.stt.provider === 'deepgram') {
    const sttOptions: any = {
      model: (config.stt.model || 'nova-3') as any,
    };
    if (config.stt.apiKey) {
      sttOptions.apiKey = config.stt.apiKey;
    }
    stt = new deepgram.STT(sttOptions);
  } else {
    const sttOptions: any = {
      model: config.stt.model || 'whisper-1',
    };
    if (config.stt.apiKey) {
      sttOptions.apiKey = config.stt.apiKey;
    }
    stt = new openai.STT(sttOptions);
  }
  
  // Create LLM based on configuration
  let llm: openai.LLM;
  // Note: For now, we only support OpenAI. Add other providers as needed
  if (config.llm.provider === 'openai') {
    const llmOptions: any = {
      model: config.llm.model,
    };
    if (config.llm.apiKey) {
      llmOptions.apiKey = config.llm.apiKey;
    }
    if (config.llm.temperature !== undefined) {
      llmOptions.temperature = config.llm.temperature;
    }
    llm = new openai.LLM(llmOptions);
  } else {
    // Fallback to OpenAI if provider not yet implemented
    logger.warn(`LLM provider ${config.llm.provider} not yet implemented, using OpenAI`);
    llm = new openai.LLM({
      model: config.llm.model || 'gpt-4o-mini',
    });
  }
  
  // Create TTS based on configuration
  let tts: elevenlabs.TTS | openai.TTS;
  if (config.tts.provider === 'elevenlabs') {
    const ttsOptions: any = {
      voice: config.tts.voiceId
        ? {
            id: config.tts.voiceId,
            name: config.tts.voiceName || 'Custom',
            category: 'premade' as const,
          }
        : {
            id: 'Xb7hH8MSUJpSbSDYk0k2',
            name: 'Alice',
            category: 'premade' as const,
          },
      modelID: config.tts.modelId || 'eleven_turbo_v2_5',
    };
    if (config.tts.apiKey) {
      ttsOptions.apiKey = config.tts.apiKey;
    }
    tts = new elevenlabs.TTS(ttsOptions);
  } else {
    const ttsOptions: any = {
      voice: (config.tts.voiceName || 'alloy') as any,
      model: config.tts.modelId || 'tts-1',
    };
    if (config.tts.apiKey) {
      ttsOptions.apiKey = config.tts.apiKey;
    }
    tts = new openai.TTS(ttsOptions);
  }
  
  // Create agent session
  const session = new voice.AgentSession({
    stt,
    llm,
    tts,
    turnDetection: new livekit.turnDetector.MultilingualModel(),
    vad,
    voiceOptions: {
      preemptiveGeneration: config.voiceOptions?.preemptiveGeneration ?? true,
    },
  });
  
  // Create agent instance
  const AgentClass = createAgentClass(config);
  const agent = new AgentClass();
  
  return { session, agent };
}

