# Production Deployment Guide

This guide covers deploying the LiveKit Voice Agent to production environments.

## Prerequisites

- LiveKit Server (self-hosted or LiveKit Cloud)
- Node.js >= 22.0.0
- pnpm >= 9.0.0
- Docker (for containerized deployment)

## Environment Configuration

### Backend Environment Variables

Create `packages/backend/.env.local` (or use environment variables in production):

```env
# LiveKit Server Configuration
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your_production_api_key
LIVEKIT_API_SECRET=your_production_api_secret

# AI Provider API Keys
OPENAI_API_KEY=your_openai_key
DEEPGRAM_API_KEY=your_deepgram_key
ELEVEN_API_KEY=your_elevenlabs_key
```

### Frontend Environment Variables

Create `packages/frontend/.env.local`:

```env
# Public URL (used by browser)
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.com

# Server-side API keys (for token generation)
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_API_KEY=your_production_api_key
LIVEKIT_API_SECRET=your_production_api_secret
```

## Deployment Options

### Option 1: LiveKit Cloud (Recommended)

LiveKit Cloud provides managed infrastructure, automatic scaling, and global distribution.

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

The CLI will:
1. Create a Dockerfile if needed
2. Build and push your agent image
3. Deploy to LiveKit Cloud
4. Configure auto-scaling

### Option 2: Self-Hosted with Docker

#### Build Docker Image

```bash
cd packages/backend
docker build -t livekit-voice-agent:latest .
```

#### Run Container

```bash
docker run -d \
  --name livekit-voice-agent \
  --restart unless-stopped \
  -e LIVEKIT_URL=wss://your-server.com \
  -e LIVEKIT_API_KEY=your_key \
  -e LIVEKIT_API_SECRET=your_secret \
  -e OPENAI_API_KEY=your_key \
  -e DEEPGRAM_API_KEY=your_key \
  -e ELEVEN_API_KEY=your_key \
  livekit-voice-agent:latest
```

#### Docker Compose

```yaml
version: '3.8'

services:
  agent:
    build: ./packages/backend
    restart: unless-stopped
    environment:
      - LIVEKIT_URL=${LIVEKIT_URL}
      - LIVEKIT_API_KEY=${LIVEKIT_API_KEY}
      - LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DEEPGRAM_API_KEY=${DEEPGRAM_API_KEY}
      - ELEVEN_API_KEY=${ELEVEN_API_KEY}
    env_file:
      - .env
```

### Option 3: Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: livekit-voice-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: livekit-voice-agent
  template:
    metadata:
      labels:
        app: livekit-voice-agent
    spec:
      containers:
      - name: agent
        image: livekit-voice-agent:latest
        env:
        - name: LIVEKIT_URL
          valueFrom:
            secretKeyRef:
              name: livekit-secrets
              key: url
        - name: LIVEKIT_API_KEY
          valueFrom:
            secretKeyRef:
              name: livekit-secrets
              key: api-key
        - name: LIVEKIT_API_SECRET
          valueFrom:
            secretKeyRef:
              name: livekit-secrets
              key: api-secret
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-secrets
              key: openai-key
        - name: DEEPGRAM_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-secrets
              key: deepgram-key
        - name: ELEVEN_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-secrets
              key: elevenlabs-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
```

## Frontend Deployment

### Next.js Standalone Build

```bash
cd packages/frontend

# Build for production
pnpm build

# Start production server
pnpm start
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd packages/frontend
vercel --prod
```

### Deploy to Docker

```dockerfile
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@10

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22-slim
WORKDIR /app
COPY --from=base /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./

EXPOSE 3000
CMD ["pnpm", "start"]
```

## Monitoring & Logging

### Health Checks

The agent exposes health check endpoints. Monitor:

- Agent registration status
- Job processing metrics
- Error rates
- Response times

### Logging

Configure structured logging:

```typescript
// In agent.ts
const logger = log().child({ 
  name: 'agent-Quinn_353',
  environment: process.env.NODE_ENV || 'production'
});
```

### Metrics

The agent collects metrics automatically:
- STT latency
- LLM token usage
- TTS generation time
- End-to-end latency

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use secret management (AWS Secrets Manager, HashiCorp Vault)
   - Rotate API keys regularly

2. **Network Security**
   - Use WSS (WebSocket Secure) in production
   - Enable TLS/SSL for all connections
   - Use firewall rules to restrict access

3. **API Keys**
   - Use separate API keys for production
   - Implement key rotation policies
   - Monitor API key usage

4. **Container Security**
   - Run containers as non-root user
   - Scan images for vulnerabilities
   - Keep base images updated

## Scaling

### Horizontal Scaling

- Deploy multiple agent instances
- LiveKit automatically load-balances jobs
- Each instance handles multiple concurrent sessions

### Vertical Scaling

- Adjust container resource limits
- Monitor CPU and memory usage
- Scale based on metrics

## Troubleshooting

### Agent Not Joining Rooms

1. Check agent registration logs
2. Verify `agentName` matches in frontend and backend
3. Check LiveKit server connectivity
4. Verify API keys are correct

### High Latency

1. Check network connectivity
2. Monitor AI provider API response times
3. Review metrics for bottlenecks
4. Consider using faster models

### Errors

1. Check application logs
2. Review error metrics
3. Verify environment variables
4. Check API key validity

## Support

- [LiveKit Documentation](https://docs.livekit.io)
- [LiveKit Discord](https://discord.gg/livekit)
- [GitHub Issues](https://github.com/livekit/agents-js/issues)

