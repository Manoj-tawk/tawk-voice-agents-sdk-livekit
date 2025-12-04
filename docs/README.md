# TAWK.To Marketplace - LiveKit Voice Agent Documentation

> **Complete end-to-end documentation for building, deploying, and managing AI Voice Agents with LiveKit.**

---

## 📚 Documentation Index

### Getting Started
- [**01. Overview & Architecture**](./01-overview-architecture.md) - System overview, tech stack, and architecture
- [**02. Quick Start Guide**](./02-quick-start.md) - Get up and running in 10 minutes
- [**03. Installation & Setup**](./03-installation-setup.md) - Detailed installation instructions

### Core Concepts
- [**04. LiveKit Fundamentals**](./04-livekit-fundamentals.md) - Rooms, participants, tracks, and data channels
- [**05. Voice Agent Lifecycle**](./05-voice-agent-lifecycle.md) - Understanding the Voice Agent lifecycle and hooks
- [**06. Voice Pipeline**](./06-voice-pipeline.md) - STT → LLM → TTS pipeline explained

### Development
- [**07. Building Voice Agents**](./07-building-voice-agents.md) - Create custom Voice Agents
- [**08. Tools & Functions**](./08-tools-functions.md) - Implementing tools for LLM function calling
- [**09. Pipeline Nodes**](./09-pipeline-nodes.md) - Customize STT, LLM, TTS behavior
- [**10. RAG & External Data**](./10-rag-external-data.md) - Connect to databases and APIs

### Frontend Integration
- [**11. Frontend Setup**](./11-frontend-setup.md) - Next.js + LiveKit Components
- [**12. Meet App Integration**](./12-meet-app-integration.md) - Google Meet-style video conferencing
- [**13. UI Components**](./13-ui-components.md) - Custom components and styling

### Configuration & Deployment
- [**14. Environment Configuration**](./14-environment-configuration.md) - Managing environment variables
- [**15. LiveKit Server Setup**](./15-livekit-server-setup.md) - Self-hosted vs Cloud
- [**16. Production Deployment**](./16-production-deployment.md) - Deploy to production
- [**17. Performance Optimization**](./17-performance-optimization.md) - Latency, caching, and tuning

### Advanced Features
- [**18. Voice Agent Workflows**](./18-voice-agent-workflows.md) - Multi-agent handoffs and workflows
- [**19. Real-time Transcription**](./19-realtime-transcription.md) - Captions and transcript history
- [**20. Audio Processing**](./20-audio-processing.md) - Noise cancellation, volume control
- [**21. Security & Authentication**](./21-security-authentication.md) - JWT tokens, CORS, E2EE

### Reference
- [**22. API Reference**](./22-api-reference.md) - Complete API documentation
- [**23. Configuration Reference**](./23-configuration-reference.md) - All config options
- [**24. Troubleshooting**](./24-troubleshooting.md) - Common issues and solutions
- [**25. FAQ**](./25-faq.md) - Frequently asked questions

---

## 🎯 Quick Navigation

### I want to...

**Get started quickly**
→ Read [Quick Start Guide](./02-quick-start.md)

**Understand the architecture**
→ Read [Overview & Architecture](./01-overview-architecture.md)

**Build a custom Voice Agent**
→ Read [Building Voice Agents](./07-building-voice-agents.md) and [Tools & Functions](./08-tools-functions.md)

**Add RAG/Database integration**
→ Read [RAG & External Data](./10-rag-external-data.md)

**Deploy to production**
→ Read [Production Deployment](./16-production-deployment.md)

**Fix an issue**
→ Check [Troubleshooting](./24-troubleshooting.md)

---

## 🏗️ Project Structure

```
tawk-voice-agents-sdk-livekit/
├── packages/
│   ├── backend/              # LiveKit Agent Server (Node.js)
│   │   ├── src/
│   │   │   ├── agent.ts      # Main agent implementation
│   │   │   └── ...
│   │   ├── .env.local        # Backend environment variables
│   │   └── package.json
│   │
│   └── frontend/             # Next.js Frontend (React)
│       ├── app/              # Next.js App Router
│       │   ├── page.tsx      # Landing page
│       │   ├── meet/         # Meet app routes
│       │   └── voice-assistant/ # Voice assistant page
│       ├── components/       # React components
│       ├── .env.local        # Frontend environment variables
│       └── package.json
│
├── docs/                     # This documentation
├── docker-compose.yml        # Redis for LiveKit (optional)
└── pnpm-workspace.yaml       # Monorepo config
```

---

## 🚀 Technology Stack

### Backend (Agent Server)
- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: LiveKit Agents SDK (`@livekit/agents`)
- **AI Models**:
  - STT: Deepgram Nova-3
  - LLM: OpenAI GPT-4o-mini
  - TTS: ElevenLabs Turbo v2.5
- **Voice Processing**: Silero VAD, Background Noise Cancellation

### Frontend (Web App)
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **LiveKit**: `@livekit/components-react`, `livekit-client`
- **Styling**: CSS Modules, Spotify Dark Theme

### Infrastructure
- **LiveKit Server**: WebRTC SFU (Self-hosted or Cloud)
- **Redis**: Optional, for LiveKit Cloud
- **Package Manager**: pnpm

---

## 📖 Documentation Conventions

### Code Examples

Throughout this documentation, you'll see code examples for:

**Backend (Node.js/TypeScript)**
```typescript
import { voice } from '@livekit/agents';

class MyAgent extends voice.Agent {
  // Agent code here
}
```

**Frontend (React/TypeScript)**
```typescript
import { useVoiceAssistant } from '@livekit/components-react';

export function MyComponent() {
  // React component code here
}
```

### Configuration Files

**Environment Variables** (`.env.local`)
```bash
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

**YAML Configuration** (`livekit.yaml`)
```yaml
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 60000
```

---

## 🆘 Getting Help

### Official Resources
- **LiveKit Docs**: https://docs.livekit.io
- **LiveKit GitHub**: https://github.com/livekit
- **LiveKit Discord**: https://livekit.io/discord

### This Project
- **Issues**: Report bugs or request features via GitHub Issues
- **Troubleshooting**: See [Troubleshooting Guide](./24-troubleshooting.md)
- **FAQ**: See [FAQ](./25-faq.md)

---

## 🤝 Contributing

When contributing documentation:
1. Follow the existing structure and format
2. Include code examples where applicable
3. Test all code snippets
4. Use clear, concise language
5. Add screenshots/diagrams where helpful

---

## 📝 License

This project and its documentation are licensed under MIT License.

---

## 🔄 Last Updated

**Version**: 1.0.0  
**Date**: December 4, 2024  
**LiveKit Agents SDK**: v0.11.x (Node.js)
