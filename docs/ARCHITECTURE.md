# Architecture Documentation

## Overview

This POC implements a production-ready, self-hosted voice agent system using LiveKit with multi-provider AI pipelines. The architecture is designed for high availability, low latency, and automatic fallback capabilities.

## System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                          Client Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Browser   │  │   Mobile    │  │   Desktop   │              │
│  │    WebRTC   │  │    WebRTC   │  │    WebRTC   │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼─────────────────┼─────────────────┼────────────────────┘
          │                 │                 │
          └─────────────────┴─────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                     LiveKit Server Layer                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  LiveKit Server (Self-Hosted)                              │  │
│  │  - WebRTC SFU (Selective Forwarding Unit)                 │  │
│  │  - Room Management                                         │  │
│  │  - Participant Management                                  │  │
│  │  - Track Publishing/Subscribing                           │  │
│  │  - TURN/STUN Server                                       │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Agent Service Layer                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Voice Agent Service (Node.js/TypeScript)                 │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │        Multi-Provider Pipeline Orchestrator          │ │  │
│  │  │                                                        │ │  │
│  │  │  ┌─────────────────────────────────────────────────┐ │ │  │
│  │  │  │  STT Pipeline (Automatic Fallback)              │ │ │  │
│  │  │  │  1. Deepgram (Primary)                          │ │ │  │
│  │  │  │  2. OpenAI Whisper (Fallback)                   │ │ │  │
│  │  │  └─────────────────────────────────────────────────┘ │ │  │
│  │  │                       ▼                                │ │  │
│  │  │  ┌─────────────────────────────────────────────────┐ │ │  │
│  │  │  │  LLM Pipeline (Automatic Fallback)              │ │ │  │
│  │  │  │  1. OpenAI GPT-4 (Primary)                      │ │ │  │
│  │  │  │  2. Anthropic Claude (Fallback 1)               │ │ │  │
│  │  │  │  3. Groq Llama (Fallback 2)                     │ │ │  │
│  │  │  └─────────────────────────────────────────────────┘ │ │  │
│  │  │                       ▼                                │ │  │
│  │  │  ┌─────────────────────────────────────────────────┐ │ │  │
│  │  │  │  TTS Pipeline (Automatic Fallback)              │ │ │  │
│  │  │  │  1. ElevenLabs (Primary)                        │ │ │  │
│  │  │  │  2. OpenAI TTS (Fallback)                       │ │ │  │
│  │  │  └─────────────────────────────────────────────────┘ │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Storage Layer                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Redis                                                     │  │
│  │  - Session state                                           │  │
│  │  - Conversation history cache                              │  │
│  │  - Provider metrics                                        │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. LiveKit Server

**Role**: WebRTC infrastructure and room management

**Responsibilities**:
- WebRTC media routing (SFU mode)
- Room lifecycle management
- Participant authentication and authorization
- Track publishing and subscription
- TURN/STUN for NAT traversal

**Configuration**:
- Self-hosted in Docker
- No cloud dependencies
- Configurable via `livekit.yaml`

**Ports**:
- 7880: HTTP/WebSocket
- 7881: TURN/TCP
- 7882: API
- 50000-50200: RTC/UDP

### 2. Agent Service

**Role**: Voice processing and AI orchestration

**Components**:

#### a. LiveKit Agent (`src/agent/livekit-agent.ts`)
- Connects to LiveKit rooms
- Handles audio track subscriptions
- Manages conversation state
- Publishes synthesized audio back to room

**Key Features**:
- Event-driven architecture
- State machine (IDLE → LISTENING → THINKING → SPEAKING)
- Session management
- Metrics collection

#### b. Multi-Provider Pipeline (`src/pipeline/multi-provider.ts`)
- Orchestrates STT, LLM, and TTS providers
- Implements fallback logic
- Tracks provider performance
- Automatic provider switching on failure

**Fallback Strategy**:
1. Try primary provider
2. On failure, try next provider in priority list
3. Track failures and metrics
4. Emit errors when all providers fail

#### c. Provider Implementations

**STT Providers**:
- `DeepgramSTTProvider`: Real-time streaming transcription
- `OpenAISTTProvider`: Batch transcription (buffered)

**LLM Providers**:
- `OpenAILLMProvider`: GPT-4 Turbo
- `AnthropicLLMProvider`: Claude 3.5 Sonnet
- `GroqLLMProvider`: Llama 3.1 70B

**TTS Providers**:
- `ElevenLabsTTSProvider`: High-quality voice synthesis
- `OpenAITTSProvider`: Fast voice synthesis

### 3. Redis

**Role**: Session state and caching

**Usage**:
- Session state persistence
- Conversation history caching (last N messages)
- Provider metrics aggregation
- Health check coordination

## Data Flow

### Voice Input → Response Flow

```
1. User speaks into microphone
   ↓
2. Browser captures audio → WebRTC stream
   ↓
3. LiveKit routes audio to Agent service
   ↓
4. Agent receives audio frames
   ↓
5. STT Pipeline processes audio
   ├─→ Try Deepgram
   └─→ Fallback to OpenAI if needed
   ↓
6. Transcription result emitted
   ↓
7. Agent adds to conversation history
   ↓
8. LLM Pipeline generates response
   ├─→ Try OpenAI GPT-4
   ├─→ Fallback to Claude if needed
   └─→ Fallback to Groq if needed
   ↓
9. LLM response received
   ↓
10. TTS Pipeline synthesizes speech
    ├─→ Try ElevenLabs
    └─→ Fallback to OpenAI if needed
    ↓
11. Audio chunks streamed back
    ↓
12. Agent publishes audio to LiveKit
    ↓
13. LiveKit routes to participants
    ↓
14. User hears response
```

## Latency Optimization

### Target Latencies

| Component | Target | Typical |
|-----------|--------|---------|
| STT (Deepgram) | <300ms | 200-400ms |
| STT (OpenAI) | <1000ms | 800-1200ms |
| LLM (OpenAI) | <1000ms | 500-1500ms |
| LLM (Anthropic) | <2000ms | 1000-2500ms |
| LLM (Groq) | <500ms | 200-800ms |
| TTS (ElevenLabs) | <1000ms | 500-1000ms |
| TTS (OpenAI) | <500ms | 300-700ms |
| **Total (optimal)** | **<2500ms** | **1500-3000ms** |

### Optimization Strategies

1. **Streaming**:
   - STT streams partial results
   - LLM streams tokens
   - TTS streams audio chunks

2. **Buffering**:
   - Smart audio buffering for OpenAI STT
   - Sentence-based TTS chunking

3. **Parallel Processing**:
   - Audio processing in separate thread
   - Non-blocking I/O throughout

4. **Provider Selection**:
   - Fast providers (Groq, OpenAI TTS) for low latency
   - High-quality providers (Claude, ElevenLabs) for quality

## Scalability

### Horizontal Scaling

```
                    ┌──────────────┐
                    │ Load Balancer│
                    └──────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ Agent Service 1│ │ Agent Service 2│ │ Agent Service N│
└────────┬───────┘ └────────┬───────┘ └────────┬───────┘
         │                  │                  │
         └──────────────────┴──────────────────┘
                           │
                    ┌──────▼───────┐
                    │ Redis Cluster│
                    └──────────────┘
```

**Scaling Strategy**:
- Stateless agent service design
- Session affinity via Redis
- Load balance by room
- Auto-scaling based on metrics

### Vertical Scaling

**Resource Requirements per Agent**:
- CPU: 1-2 cores
- Memory: 512MB - 1GB
- Network: 1-5 Mbps per conversation

**Limits**:
- ~50 concurrent conversations per instance (depends on providers)
- Limited by API rate limits
- Limited by network bandwidth

## High Availability

### Failure Scenarios and Mitigations

| Scenario | Impact | Mitigation |
|----------|--------|------------|
| Primary STT fails | Transcription delay | Auto-fallback to secondary |
| Primary LLM fails | Response delay | Auto-fallback to secondary |
| Primary TTS fails | Speech delay | Auto-fallback to secondary |
| All STT providers fail | No transcription | Error to user, retry |
| All LLM providers fail | No responses | Error to user, retry |
| All TTS providers fail | Silent responses | Error to user, retry |
| LiveKit server down | No connections | Health check fails, restart |
| Redis down | No state persistence | Graceful degradation |
| Agent service crash | Session lost | New agent spawns |

### Health Checks

**Endpoints**:
- `GET /health`: Overall service health
- `GET /metrics`: Detailed metrics

**Checks**:
- LiveKit connectivity
- Redis connectivity
- Provider API reachability
- Resource utilization

## Security Considerations

### Current Implementation
- API key-based authentication for LiveKit
- Environment-based secrets
- No TLS (local development)

### Production Requirements
1. **Transport Security**:
   - TLS for all HTTP/WebSocket
   - DTLS for WebRTC

2. **Authentication**:
   - JWT tokens for LiveKit
   - API authentication for agent service
   - Provider API key rotation

3. **Network Security**:
   - Firewall rules
   - VPC/network isolation
   - Rate limiting

4. **Data Security**:
   - Encrypted Redis
   - No PII logging
   - Secure key management (Vault, etc.)

## Monitoring

### Metrics Collected

**Provider Metrics**:
- Success/failure counts
- Average latency
- Provider-specific errors

**Agent Metrics**:
- Active sessions
- Total requests
- Success rate
- Conversation length

**System Metrics**:
- CPU usage
- Memory usage
- Network throughput
- Error rates

### Observability Stack (Recommended)

```
┌─────────────┐
│  Prometheus │ ← Metrics scraping
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Grafana   │ ← Visualization
└─────────────┘

┌─────────────┐
│  Loki       │ ← Log aggregation
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Grafana   │
└─────────────┘

┌─────────────┐
│   Jaeger    │ ← Distributed tracing
└─────────────┘
```

## Future Enhancements

### Planned Features
1. **WebSocket API**: For better real-time communication
2. **Session Recording**: Save conversations
3. **Advanced Metrics**: Token usage, cost tracking
4. **Custom Prompts**: Per-session system prompts
5. **Multi-language**: Support more languages
6. **Voice Cloning**: Custom voice profiles
7. **RAG Integration**: Knowledge base integration
8. **Function Calling**: Tool use capabilities

### Scalability Improvements
1. **Message Queue**: Use RabbitMQ/Kafka for async processing
2. **CDN**: Distribute static assets
3. **Edge Deployment**: Deploy closer to users
4. **Provider Pool**: Dynamic provider selection based on load

## Development Guidelines

### Adding New Providers

1. Create provider class extending `BaseProvider`
2. Implement required methods (initialize, healthCheck, cleanup)
3. Add to pipeline configuration
4. Update configuration loader
5. Add tests

### Testing Strategy

1. **Unit Tests**: Individual provider logic
2. **Integration Tests**: Pipeline with mocked providers
3. **E2E Tests**: Full flow with real providers
4. **Load Tests**: Performance under load
5. **Chaos Tests**: Failure scenarios

## Troubleshooting Guide

### Common Issues

**Audio not streaming**:
- Check WebRTC ports (50000-50200)
- Verify TURN/STUN configuration
- Check browser permissions

**High latency**:
- Check provider selection (use fast providers)
- Monitor network latency
- Review buffering settings

**Provider failures**:
- Verify API keys
- Check rate limits
- Review provider status pages

**Memory leaks**:
- Check event listener cleanup
- Verify stream disposal
- Monitor session lifecycle

## References

- [LiveKit Documentation](https://docs.livekit.io/)
- [WebRTC Documentation](https://webrtc.org/)
- [Provider API Docs](./docs/providers.md)
