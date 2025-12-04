# SigNoz Observability for Tawk.to Voice Agents

This directory contains the complete **open-source observability stack** using **SigNoz** for monitoring your LiveKit voice agents.

## 🎯 What You Get

- **📊 Metrics**: Real-time performance metrics (latency, throughput, errors)
- **🔍 Distributed Tracing**: Complete visibility into STT→LLM→TTS pipeline
- **📜 Logs**: Centralized log aggregation and search
- **📈 Dashboards**: Beautiful, customizable dashboards
- **🚨 Alerts**: Set up alerts for critical issues
- **💰 Cost Tracking**: Monitor LLM/STT/TTS usage and costs

## 🏗️ Architecture

```
┌─────────────────────┐
│  Voice Agent App    │
│  (packages/backend) │
└──────────┬──────────┘
           │ OpenTelemetry SDK
           ▼
┌─────────────────────┐
│  OTEL Collector     │◄─ Receives traces, metrics, logs
│  (Port: 4317/4318)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  ClickHouse         │◄─ Stores all data
│  (Port: 9000/8123)  │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Query Service      │◄─ API for data retrieval
│  (Port: 8080)       │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  SigNoz Frontend    │◄─ Beautiful UI
│  (Port: 3301)       │
└─────────────────────┘
```

## 🚀 Quick Start

### 1. Start SigNoz

```bash
cd observability
docker-compose -f docker-compose.signoz.yml up -d
```

**Wait 1-2 minutes** for all services to start.

### 2. Verify Services

```bash
docker-compose -f docker-compose.signoz.yml ps
```

All services should be "healthy" or "running".

### 3. Access SigNoz UI

Open in browser: **http://localhost:3301**

**First-time setup:**
1. Create an account (local, no internet required)
2. Set your organization name: "Tawk.to"
3. You're ready!

### 4. Start Your Voice Agent

```bash
cd ../packages/backend
pnpm start
```

The agent will automatically send telemetry to SigNoz!

### 5. Make a Test Call

1. Open frontend: http://localhost:3000
2. Click "New Meeting" or "Voice Agent Demo"
3. Have a conversation with the agent

### 6. View Metrics in SigNoz

Go to http://localhost:3301 and you'll see:

- **Services**: `tawk-voice-agent` should appear
- **Traces**: Click on a trace to see the full STT→LLM→TTS flow
- **Metrics**: View latency, throughput, error rates
- **Logs**: Search and filter agent logs

## 📊 Key Metrics to Monitor

### Conversation Latency
```
Total Latency = EOU Delay + LLM TTFT + TTS TTFB
```

- **EOU (End of Utterance)**: Time to detect user stopped speaking
- **LLM TTFT (Time to First Token)**: How fast LLM starts responding
- **TTS TTFB (Time to First Byte)**: How fast TTS starts playing audio

**Target:** < 1 second for good UX

### STT Metrics
- `audio_duration`: Duration of user's speech
- `duration`: Time to transcribe
- `streamed`: Whether streaming STT is used

### LLM Metrics
- `ttft`: Time to first token (critical for responsiveness)
- `tokens_per_second`: LLM generation speed
- `completion_tokens`: Output tokens (cost tracking)
- `prompt_tokens`: Input tokens (cost tracking)
- `prompt_cached_tokens`: Cached tokens (cost savings)

### TTS Metrics
- `ttfb`: Time to first byte
- `audio_duration`: Length of generated audio
- `characters_count`: Text input length
- `duration`: Total generation time

## 🔧 Configuration

### Environment Variables

Add to `packages/backend/.env.local`:

```bash
# SigNoz Configuration
SIGNOZ_ENDPOINT=http://localhost:4318
SERVICE_NAME=tawk-voice-agent
SERVICE_VERSION=1.0.0
DEPLOYMENT_ENVIRONMENT=development
```

### For Production

Update `SIGNOZ_ENDPOINT` to your production SigNoz instance:

```bash
SIGNOZ_ENDPOINT=https://your-signoz-instance.com:4318
DEPLOYMENT_ENVIRONMENT=production
```

## 📈 Creating Custom Dashboards

### 1. Go to Dashboards
http://localhost:3301/dashboards

### 2. Click "New Dashboard"

### 3. Add Panels

**Example: Average LLM Latency**
- Metric: `llm.ttft`
- Aggregation: `avg`
- Group by: `service.name`

**Example: Total Token Usage (Cost)**
- Metric: `llm.completion_tokens`
- Aggregation: `sum`
- Time range: Last 24 hours

**Example: Error Rate**
- Metric: `traces.error`
- Aggregation: `count`
- Filter: `status = error`

## 🚨 Setting Up Alerts

### 1. Go to Alerts
http://localhost:3301/alerts

### 2. Create Alert Rule

**Example: High Latency Alert**
```yaml
Name: High LLM Latency
Condition: llm.ttft > 2000 (ms)
Evaluation: every 1 minute
Duration: 5 minutes
Notification: Slack/Email
```

**Example: High Error Rate**
```yaml
Name: Agent Errors
Condition: error_count > 10
Evaluation: every 1 minute
Duration: 5 minutes
Notification: Slack/Email
```

### 3. Configure Notifications

Edit `signoz-config/alertmanager-config.yaml`:

```yaml
receivers:
  - name: 'slack-alerts'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#alerts'
        title: 'Agent Alert: {{ .GroupLabels.alertname }}'
        text: '{{ .CommonAnnotations.summary }}'
```

## 🔍 Distributed Tracing

### View a Single Conversation

1. Go to **Traces** tab
2. Filter by `room.name` or `job.id`
3. Click on a trace to see:
   - User speech detected (STT)
   - Transcript generated
   - LLM inference started/completed
   - TTS generation started/completed
   - Audio playback started/completed
   - Tool calls (if any)

### Trace Attributes

Each span includes:
- `job.id`: Unique job identifier
- `room.name`: Room name
- `agent.name`: Agent name (Quinn_353)
- `speech_id`: Links STT→LLM→TTS for a single turn
- `metrics.*`: All collected metrics

## 💰 Cost Tracking

### 1. Create a Dashboard for Token Usage

**Total Tokens Used (Last 24h)**
```
Query: sum(llm.completion_tokens) + sum(llm.prompt_tokens)
```

**Cost Estimation**
```
GPT-4o-mini: $0.15 / 1M input tokens, $0.60 / 1M output tokens
Deepgram: $0.0043 / minute
ElevenLabs: $0.30 / 1K characters
```

### 2. Export Usage Data

Go to SigNoz → Query Builder → Export to CSV

Or use the API:
```bash
curl -X POST http://localhost:8080/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "metric": "llm.completion_tokens",
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z",
    "aggregation": "sum"
  }'
```

## 🐛 Debugging Issues

### Agent Not Sending Metrics?

**Check:**
1. SigNoz is running: `docker-compose -f docker-compose.signoz.yml ps`
2. OTEL Collector is healthy: `curl http://localhost:13133`
3. Agent logs show telemetry initialized:
   ```
   [Telemetry] OpenTelemetry initialized successfully
   [Telemetry] Service: tawk-voice-agent (1.0.0)
   [Telemetry] SigNoz Endpoint: http://localhost:4318
   ```

### Can't Access SigNoz UI?

**Check:**
```bash
# Frontend should be running
docker-compose -f docker-compose.signoz.yml logs frontend

# Port should be available
lsof -i :3301
```

**Solution:**
```bash
# Restart SigNoz
docker-compose -f docker-compose.signoz.yml restart frontend
```

### ClickHouse Errors?

**Check disk space:**
```bash
df -h
```

**Clear old data:**
```bash
docker-compose -f docker-compose.signoz.yml exec clickhouse \
  clickhouse-client --query "TRUNCATE TABLE signoz_traces.signoz_index_v2"
```

## 📦 Managing Data

### View Data Size

```bash
docker-compose -f docker-compose.signoz.yml exec clickhouse \
  clickhouse-client --query "
    SELECT
      table,
      formatReadableSize(sum(bytes)) as size
    FROM system.parts
    WHERE database = 'signoz_traces'
    GROUP BY table
  "
```

### Clean Up Old Data

```bash
# Stop SigNoz
docker-compose -f docker-compose.signoz.yml down

# Remove volumes (WARNING: Deletes all data!)
docker volume rm observability_clickhouse-data

# Restart
docker-compose -f docker-compose.signoz.yml up -d
```

## 🔐 Security (Production)

### 1. Enable Authentication

Edit `docker-compose.signoz.yml`:

```yaml
frontend:
  environment:
    - ADMIN_PASSWORD=your-secure-password
```

### 2. Use HTTPS

Put SigNoz behind a reverse proxy (Nginx/Caddy):

```nginx
server {
  listen 443 ssl;
  server_name observability.yourdomain.com;

  location / {
    proxy_pass http://localhost:3301;
  }
}
```

### 3. Restrict OTEL Collector Access

In production, use API keys:

```yaml
otel-collector:
  environment:
    - OTEL_EXPORTER_OTLP_HEADERS=authorization=Bearer YOUR_SECRET_KEY
```

## 📚 Resources

- **SigNoz Docs**: https://signoz.io/docs/
- **OpenTelemetry Docs**: https://opentelemetry.io/docs/
- **LiveKit Agent Observability**: https://docs.livekit.io/agents/observability/

## 🆘 Support

**Issues?**
1. Check logs: `docker-compose -f docker-compose.signoz.yml logs`
2. SigNoz Community: https://signoz.io/slack
3. Tawk.to Internal: Contact DevOps team

---

**Happy Monitoring!** 🎉

Your voice agents are now fully observable with open-source tools!

