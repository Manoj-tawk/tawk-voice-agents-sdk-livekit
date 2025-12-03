'use client';

import { useState } from 'react';
import { Button } from '@/components/livekit/button';
import { Alert } from '@/components/livekit/alert';

const API_BASE_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:3001';

interface Agent {
  id: string;
  name: string;
  instructions: string;
  enabled: boolean;
  stt: {
    provider: string;
    model?: string;
  };
  llm: {
    provider: string;
    model: string;
  };
  tts: {
    provider: string;
    voiceName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface AgentListProps {
  agents: Agent[];
  loading: boolean;
  onStartCall: (agentName: string) => void;
  onRefresh: () => void;
}

export function AgentList({ agents, loading, onStartCall, onRefresh }: AgentListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (agentName: string) => {
    if (!confirm(`Are you sure you want to delete agent "${agentName}"?`)) {
      return;
    }

    setDeleting(agentName);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/${agentName}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete agent');
      }

      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading agents...</p>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground mb-4">No agents created yet</p>
        <p className="text-sm text-muted-foreground">
          Create your first agent to get started
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">STT</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">LLM</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">TTS</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Created</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr
                key={agent.id}
                className="border-t hover:bg-muted/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-sm text-muted-foreground truncate max-w-xs">
                      {agent.instructions.substring(0, 60)}...
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      agent.enabled
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {agent.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="capitalize">{agent.stt.provider}</div>
                  {agent.stt.model && (
                    <div className="text-xs text-muted-foreground">{agent.stt.model}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="capitalize">{agent.llm.provider}</div>
                  <div className="text-xs text-muted-foreground">{agent.llm.model}</div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="capitalize">{agent.tts.provider}</div>
                  {agent.tts.voiceName && (
                    <div className="text-xs text-muted-foreground">{agent.tts.voiceName}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(agent.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end space-x-2">
                    <Button
                      size="sm"
                      onClick={() => onStartCall(agent.name)}
                      disabled={!agent.enabled}
                      variant="default"
                    >
                      Start Call
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(agent.name)}
                      disabled={deleting === agent.name}
                    >
                      {deleting === agent.name ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

