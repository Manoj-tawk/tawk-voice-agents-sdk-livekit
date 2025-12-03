'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AgentList } from '@/components/agents/agent-list';
import { CreateAgentForm } from '@/components/agents/create-agent-form';
import { Button } from '@/components/livekit/button';

const API_BASE_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:3001';

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const router = useRouter();

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents`);
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleAgentCreated = () => {
    setShowCreateForm(false);
    fetchAgents();
  };

  const handleStartCall = (agentName: string) => {
    // Navigate to main page with agent name
    router.push(`/?agent=${encodeURIComponent(agentName)}`);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Agent Management</h1>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              ← Back to Home
            </Link>
          </div>
          <p className="text-muted-foreground mt-1">
            Create and manage your voice agents
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant={showCreateForm ? 'outline' : 'default'}
        >
          {showCreateForm ? 'Cancel' : '+ Create Agent'}
        </Button>
      </div>

      {showCreateForm && (
        <div className="mb-6">
          <CreateAgentForm
            onSuccess={handleAgentCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      <AgentList
        agents={agents}
        loading={loading}
        onStartCall={handleStartCall}
        onRefresh={fetchAgents}
      />
    </div>
  );
}

