/**
 * Database schema for agent configurations
 * This allows creating and managing agents dynamically via API
 */

export interface AgentConfig {
  id: string;
  name: string; // Unique agent name (used for dispatch)
  instructions: string; // System instructions for the agent
  enabled: boolean;
  
  // STT Configuration
  stt: {
    provider: 'deepgram' | 'openai';
    model?: string;
    apiKey?: string; // Optional override
  };
  
  // LLM Configuration
  llm: {
    provider: 'openai' | 'anthropic' | 'groq';
    model: string;
    apiKey?: string; // Optional override
    temperature?: number;
    maxTokens?: number;
  };
  
  // TTS Configuration
  tts: {
    provider: 'elevenlabs' | 'openai';
    voiceId?: string;
    voiceName?: string;
    modelId?: string;
    apiKey?: string; // Optional override
  };
  
  // Voice Options
  voiceOptions?: {
    preemptiveGeneration?: boolean;
    noiseCancellation?: boolean;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * File-based database for agent configurations
 * Uses JSON file storage so both API server and job processes can access the same data
 * ROOT CAUSE FIX: Process isolation - each job process gets a new in-memory instance,
 * so we use file-based storage that's shared across all processes
 */
class AgentDatabase {
  private dbPath: string;
  private cache: Map<string, AgentConfig> | null = null;
  private cacheTime: number = 0;
  private readonly CACHE_TTL = 1000; // Cache for 1 second to reduce file I/O

  constructor() {
    // Get the directory where this file is located
    const currentDir = dirname(fileURLToPath(import.meta.url));
    // Store database file in backend directory
    const dbDir = join(currentDir, '..', '..');
    this.dbPath = join(dbDir, '.agents-db.json');
    
    // Ensure directory exists
    const dbDirPath = dirname(this.dbPath);
    if (!existsSync(dbDirPath)) {
      mkdirSync(dbDirPath, { recursive: true });
    }
  }

  private loadFromFile(): Map<string, AgentConfig> {
    const now = Date.now();
    // Use cache if still valid - INCREASED TTL for better performance
    if (this.cache && (now - this.cacheTime) < (this.CACHE_TTL * 10)) { // 10 seconds cache
      return this.cache;
    }

    const agents = new Map<string, AgentConfig>();
    
    if (existsSync(this.dbPath)) {
      try {
        const data = readFileSync(this.dbPath, 'utf-8');
        const agentsArray: AgentConfig[] = JSON.parse(data);
        
        // Convert date strings back to Date objects
        agentsArray.forEach(agent => {
          agent.createdAt = new Date(agent.createdAt);
          agent.updatedAt = new Date(agent.updatedAt);
          agents.set(agent.name, agent);
        });
      } catch (error) {
        console.error(`Failed to load agents database: ${error}`);
        // If file is corrupted, start with empty database
      }
    }
    
    this.cache = agents;
    this.cacheTime = now;
    return agents;
  }

  private saveToFile(agents: Map<string, AgentConfig>): void {
    try {
      const agentsArray = Array.from(agents.values());
      // Convert to JSON (dates will be serialized as strings)
      const data = JSON.stringify(agentsArray, null, 2);
      writeFileSync(this.dbPath, data, 'utf-8');
      
      // Update cache
      this.cache = agents;
      this.cacheTime = Date.now();
    } catch (error) {
      console.error(`Failed to save agents database: ${error}`);
      throw error;
    }
  }

  async create(config: Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentConfig> {
    const agents = this.loadFromFile();
    
    if (agents.has(config.name)) {
      throw new Error('Agent with this name already exists');
    }
    
    const id = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const agent: AgentConfig = {
      ...config,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    agents.set(config.name, agent);
    this.saveToFile(agents);
    return agent;
  }
  
  async getByName(name: string): Promise<AgentConfig | null> {
    const agents = this.loadFromFile();
    return agents.get(name) || null;
  }
  
  async getAll(): Promise<AgentConfig[]> {
    const agents = this.loadFromFile();
    return Array.from(agents.values());
  }
  
  async update(name: string, updates: Partial<AgentConfig>): Promise<AgentConfig | null> {
    const agents = this.loadFromFile();
    const agent = agents.get(name);
    if (!agent) return null;
    
    const updated = {
      ...agent,
      ...updates,
      updatedAt: new Date(),
    };
    
    agents.set(name, updated);
    this.saveToFile(agents);
    return updated;
  }
  
  async delete(name: string): Promise<boolean> {
    const agents = this.loadFromFile();
    const deleted = agents.delete(name);
    if (deleted) {
      this.saveToFile(agents);
    }
    return deleted;
  }
  
  async exists(name: string): Promise<boolean> {
    const agents = this.loadFromFile();
    return agents.has(name);
  }
}

export const agentDB = new AgentDatabase();

