/**
 * API Server for managing agents
 * Provides CRUD operations for agent configurations
 */

import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { agentDB, type AgentConfig } from '../db/schema.js';
import { z } from 'zod';

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Validation schemas
const CreateAgentSchema = z.object({
  name: z.string().min(1).max(100),
  instructions: z.string().min(1),
  enabled: z.boolean().default(true),
  stt: z.object({
    provider: z.enum(['deepgram', 'openai']),
    model: z.string().optional(),
    apiKey: z.string().optional(),
  }),
  llm: z.object({
    provider: z.enum(['openai', 'anthropic', 'groq']),
    model: z.string(),
    apiKey: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().positive().optional(),
  }),
  tts: z.object({
    provider: z.enum(['elevenlabs', 'openai']),
    voiceId: z.string().optional(),
    voiceName: z.string().optional(),
    modelId: z.string().optional(),
    apiKey: z.string().optional(),
  }),
  voiceOptions: z.object({
    preemptiveGeneration: z.boolean().optional(),
    noiseCancellation: z.boolean().optional(),
  }).optional(),
  createdBy: z.string().optional(),
});

const UpdateAgentSchema = CreateAgentSchema.partial().extend({
  name: z.string().min(1).max(100).optional(),
});

// GET /api/agents - List all agents
app.get('/api/agents', async (req: Request, res: Response) => {
  try {
    const agents = await agentDB.getAll();
    res.json({ agents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list agents', message: String(error) });
  }
});

// GET /api/agents/:name - Get agent by name
app.get('/api/agents/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    if (!name) {
      return res.status(400).json({ error: 'Agent name is required' });
    }
    const agent = await agentDB.getByName(name);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    return res.json({ agent });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get agent', message: String(error) });
  }
});

// POST /api/agents - Create new agent
app.post('/api/agents', async (req: Request, res: Response) => {
  try {
    const data = CreateAgentSchema.parse(req.body);
    
    // Check if agent already exists
    if (await agentDB.exists(data.name)) {
      return res.status(409).json({ error: 'Agent with this name already exists' });
    }
    
    const agent = await agentDB.create(data as Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt'>);
    return res.status(201).json({ agent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    return res.status(500).json({ error: 'Failed to create agent', message: String(error) });
  }
});

// PUT /api/agents/:name - Update agent
app.put('/api/agents/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    if (!name) {
      return res.status(400).json({ error: 'Agent name is required' });
    }
    const data = UpdateAgentSchema.parse(req.body);
    
    // Check if agent exists
    if (!(await agentDB.exists(name))) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    // If name is being changed, check new name doesn't exist
    if (data.name && data.name !== name) {
      if (await agentDB.exists(data.name)) {
        return res.status(409).json({ error: 'Agent with new name already exists' });
      }
    }
    
    const agent = await agentDB.update(name, data as Partial<AgentConfig>);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    return res.json({ agent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    return res.status(500).json({ error: 'Failed to update agent', message: String(error) });
  }
});

// DELETE /api/agents/:name - Delete agent
app.delete('/api/agents/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    if (!name) {
      return res.status(400).json({ error: 'Agent name is required' });
    }
    const deleted = await agentDB.delete(name);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    return res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete agent', message: String(error) });
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'agent-api' });
});

export function startAPIServer(port: number = 3001) {
  return new Promise<void>((resolve) => {
    app.listen(port, () => {
      console.log(`Agent API server running on port ${port}`);
      resolve();
    });
  });
}

export { app };

