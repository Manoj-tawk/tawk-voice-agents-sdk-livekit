'use client';

import { useState } from 'react';
import { Button } from '@/components/livekit/button';
import { Alert } from '@/components/livekit/alert';

const API_BASE_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:3001';

interface CreateAgentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateAgentForm({ onSuccess, onCancel }: CreateAgentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    instructions: 'You are a friendly and helpful voice assistant. Keep your responses brief and conversational.',
    enabled: true,
    stt: {
      provider: 'deepgram' as 'deepgram' | 'openai',
      model: 'nova-3',
    },
    llm: {
      provider: 'openai' as 'openai' | 'anthropic' | 'groq',
      model: 'gpt-4o-mini',
      temperature: 0.7,
    },
    tts: {
      provider: 'elevenlabs' as 'elevenlabs' | 'openai',
      voiceId: 'Xb7hH8MSUJpSbSDYk0k2',
      voiceName: 'Alice',
      modelId: 'eleven_turbo_v2_5',
    },
    voiceOptions: {
      preemptiveGeneration: true,
      noiseCancellation: true,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create agent');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-card">
      <h2 className="text-2xl font-semibold mb-4">Create New Agent</h2>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Agent Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g., customer-support"
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium">Enabled</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Instructions *
          </label>
          <textarea
            required
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            className="w-full px-3 py-2 border rounded-md min-h-[100px]"
            placeholder="Agent system instructions..."
          />
        </div>

        {/* STT Configuration */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Speech-to-Text (STT)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Provider</label>
              <select
                value={formData.stt.provider}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stt: { ...formData.stt, provider: e.target.value as 'deepgram' | 'openai' },
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="deepgram">Deepgram</option>
                <option value="openai">OpenAI Whisper</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Model</label>
              <input
                type="text"
                value={formData.stt.model}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stt: { ...formData.stt, model: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
                placeholder="nova-3"
              />
            </div>
          </div>
        </div>

        {/* LLM Configuration */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Language Model (LLM)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Provider</label>
              <select
                value={formData.llm.provider}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    llm: { ...formData.llm, provider: e.target.value as 'openai' | 'anthropic' | 'groq' },
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="groq">Groq</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Model *</label>
              <input
                type="text"
                required
                value={formData.llm.model}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    llm: { ...formData.llm, model: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
                placeholder="gpt-4o-mini"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Temperature</label>
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={formData.llm.temperature}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    llm: { ...formData.llm, temperature: parseFloat(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* TTS Configuration */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Text-to-Speech (TTS)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Provider</label>
              <select
                value={formData.tts.provider}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tts: { ...formData.tts, provider: e.target.value as 'elevenlabs' | 'openai' },
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="elevenlabs">ElevenLabs</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>
            {formData.tts.provider === 'elevenlabs' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Voice ID</label>
                  <input
                    type="text"
                    value={formData.tts.voiceId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tts: { ...formData.tts, voiceId: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Xb7hH8MSUJpSbSDYk0k2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Voice Name</label>
                  <input
                    type="text"
                    value={formData.tts.voiceName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tts: { ...formData.tts, voiceName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Alice"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Model ID</label>
                  <input
                    type="text"
                    value={formData.tts.modelId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tts: { ...formData.tts, modelId: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="eleven_turbo_v2_5"
                  />
                </div>
              </>
            )}
            {formData.tts.provider === 'openai' && (
              <div>
                <label className="block text-sm font-medium mb-1">Voice</label>
                <select
                  value={formData.tts.voiceName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tts: { ...formData.tts, voiceName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="alloy">Alloy</option>
                  <option value="echo">Echo</option>
                  <option value="fable">Fable</option>
                  <option value="onyx">Onyx</option>
                  <option value="nova">Nova</option>
                  <option value="shimmer">Shimmer</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Voice Options */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Voice Options</h3>
          <div className="flex space-x-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.voiceOptions.preemptiveGeneration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    voiceOptions: {
                      ...formData.voiceOptions,
                      preemptiveGeneration: e.target.checked,
                    },
                  })
                }
                className="rounded"
              />
              <span className="text-sm">Preemptive Generation</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.voiceOptions.noiseCancellation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    voiceOptions: {
                      ...formData.voiceOptions,
                      noiseCancellation: e.target.checked,
                    },
                  })
                }
                className="rounded"
              />
              <span className="text-sm">Noise Cancellation</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Agent'}
          </Button>
        </div>
      </form>
    </div>
  );
}

