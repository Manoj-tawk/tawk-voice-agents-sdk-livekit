# LiveKit Voice Agent

A production-ready voice AI application built with LiveKit Agents, featuring a multi-provider AI pipeline (Deepgram STT, OpenAI LLM, ElevenLabs TTS) and a modern Next.js frontend.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 22.0.0
- pnpm >= 9.0.0
- LiveKit Server (local or cloud)

### Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Setup environment variables
cp .env.example .env
cp packages/backend/.env.example packages/backend/.env.local
cp packages/frontend/.env.example packages/frontend/.env.local

# Edit the .env files with your API keys

# 3. Download ML models
pnpm setup
```

### Development

```bash
# Start LiveKit server (if running locally)
pnpm start:livekit

# In another terminal, start development servers
pnpm dev
```

Open **http://localhost:3000** in your browser.

### Production

```bash
# Build for production
pnpm build

# Start production servers
pnpm start
```

## 📁 Project Structure

```
livekit-voice-agent-monorepo/
├── packages/
│   ├── backend/          # LiveKit Agent (Node.js/TypeScript)
│   │   ├── src/
│   │   │   └── agent.ts  # Main agent implementation
│   │   ├── Dockerfile    # Production Docker image
│   │   └── package.json
│   └── frontend/         # Next.js Frontend (React/TypeScript)
│       ├── app/           # Next.js app directory
│       ├── components/    # React components
│       └── package.json
├── docs/                  # Documentation
├── docker-compose.yml     # Local LiveKit server (optional)
├── livekit.yaml          # LiveKit server configuration
└── package.json          # Monorepo root
```

## ⚙️ Configuration

### Environment Variables

#### Backend (`packages/backend/.env.local`)

```env
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
OPENAI_API_KEY=your_openai_key
DEEPGRAM_API_KEY=your_deepgram_key
ELEVEN_API_KEY=your_elevenlabs_key
```

#### Frontend (`packages/frontend/.env.local`)

```env
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

## 🎯 Features

- **Multi-Provider AI Pipeline**
  - Speech-to-Text: Deepgram Nova-3
  - Language Model: OpenAI GPT-4o-mini
  - Text-to-Speech: ElevenLabs Turbo v2.5

- **Production-Ready**
  - TypeScript with strict type checking
  - Docker containerization
  - Error handling and logging
  - Metrics collection

- **Real-Time Voice AI**
  - Low-latency voice conversations
  - Turn detection and interruption handling
  - Noise cancellation
  - Voice activity detection

## 📦 Deployment

### Deploy to LiveKit Cloud

```bash
# Install LiveKit CLI
brew install livekit-cli  # macOS
# or
curl -sSL https://get.livekit.io/cli | bash  # Linux

# Authenticate
lk cloud auth

# Deploy agent
cd packages/backend
lk agent create
```

### Self-Hosted Deployment

```bash
# Build Docker image
cd packages/backend
docker build -t livekit-voice-agent .

# Run container
docker run -d \
  -e LIVEKIT_URL=wss://your-server.com \
  -e LIVEKIT_API_KEY=your_key \
  -e LIVEKIT_API_SECRET=your_secret \
  -e OPENAI_API_KEY=your_key \
  -e DEEPGRAM_API_KEY=your_key \
  -e ELEVEN_API_KEY=your_key \
  livekit-voice-agent
```

## 📚 Documentation

See the [`docs/`](./docs/) folder for detailed documentation:

- [Quick Start Guide](./docs/QUICK_START.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Agent Deployment Explained](./docs/AGENT_DEPLOYMENT_EXPLAINED.md)

## 🛠️ Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start both frontend and backend in development |
| `pnpm build` | Build both packages for production |
| `pnpm start` | Start both packages in production mode |
| `pnpm lint` | Run linters on all packages |
| `pnpm format` | Format code with Prettier |
| `pnpm typecheck` | Type check all packages |
| `pnpm clean` | Remove build artifacts and node_modules |
| `pnpm setup` | Install dependencies and download ML models |

### Code Quality

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Type check
pnpm typecheck
```

## 🔒 Security

- Never commit `.env` or `.env.local` files
- Use environment variables for all secrets
- Rotate API keys regularly
- Use HTTPS/WSS in production
- Follow principle of least privilege

## 📄 License

MIT

## 🤝 Support

For issues and questions:
- [LiveKit Documentation](https://docs.livekit.io)
- [LiveKit Discord](https://discord.gg/livekit)
- [GitHub Issues](https://github.com/livekit/agents-js/issues)
