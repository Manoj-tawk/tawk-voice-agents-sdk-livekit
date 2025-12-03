# Production Deployment Guide

This guide covers deploying the LiveKit Multi-Provider Voice Agent to production.

## Prerequisites

- Docker & Docker Compose
- Domain name with DNS access
- SSL certificates (Let's Encrypt recommended)
- Server with:
  - 4+ CPU cores
  - 8GB+ RAM
  - 100GB+ storage
  - Stable network connection

## Deployment Options

### Option 1: Single Server Deployment (Small Scale)

Suitable for: <1000 concurrent users, testing, small deployments

```
┌────────────────────────────────────┐
│         Single Server              │
│  ┌──────────────────────────────┐  │
│  │  nginx (TLS Termination)     │  │
│  └────────┬─────────────────────┘  │
│           │                         │
│  ┌────────▼──────────┐              │
│  │  LiveKit Server   │              │
│  └────────┬──────────┘              │
│           │                         │
│  ┌────────▼──────────┐              │
│  │  Agent Service    │              │
│  └────────┬──────────┘              │
│           │                         │
│  ┌────────▼──────────┐              │
│  │  Redis            │              │
│  └───────────────────┘              │
└────────────────────────────────────┘
```

### Option 2: Multi-Server Deployment (Production Scale)

Suitable for: >1000 concurrent users, high availability

```
┌────────────────┐
│ Load Balancer  │
│  (nginx/HAProxy│
└────────┬───────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│LK Srv│  │LK Srv│
└───┬──┘  └──┬───┘
    │        │
    └────┬───┘
         │
    ┌────▼────┐
    │         │
┌───▼──┐  ┌──▼───┐  ┌─────┐
│Agent │  │Agent │  │Agent│
└───┬──┘  └──┬───┘  └──┬──┘
    │        │         │
    └────────┴─────────┘
             │
      ┌──────▼──────┐
      │Redis Cluster│
      └─────────────┘
```

## Step-by-Step Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create app directory
sudo mkdir -p /opt/livekit-agent
cd /opt/livekit-agent
```

### 2. Configuration

#### 2.1 Create Production docker-compose.yml

```yaml
version: '3.9'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - livekit
    restart: unless-stopped
    networks:
      - livekit-network

  livekit:
    image: livekit/livekit-server:latest
    command: --config /etc/livekit.yaml
    ports:
      - "7880:7880"
      - "7881:7881"
      - "7882:7882"
      - "50000-50100:50000-50100/udp"
    volumes:
      - ./livekit-prod.yaml:/etc/livekit.yaml:ro
    environment:
      - LIVEKIT_KEYS=${LIVEKIT_API_KEY}:${LIVEKIT_API_SECRET}
    networks:
      - livekit-network
    restart: unless-stopped

  agent:
    image: your-registry/livekit-agent:latest
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    environment:
      - LIVEKIT_URL=ws://livekit:7880
      - LIVEKIT_API_KEY=${LIVEKIT_API_KEY}
      - LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - DEEPGRAM_API_KEY=${DEEPGRAM_API_KEY}
      - ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
      - GROQ_API_KEY=${GROQ_API_KEY}
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    depends_on:
      - livekit
      - redis
    networks:
      - livekit-network
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    image: redis:7-alpine
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    networks:
      - livekit-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  redis-data:
    driver: local

networks:
  livekit-network:
    driver: bridge
```

#### 2.2 Create nginx Configuration

```nginx
# /opt/livekit-agent/nginx.conf

events {
    worker_connections 4096;
}

http {
    upstream livekit {
        server livekit:7880;
    }

    upstream agent {
        least_conn;
        server agent:8080 max_fails=3 fail_timeout=30s;
    }

    # HTTP -> HTTPS redirect
    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # LiveKit WebSocket
        location / {
            proxy_pass http://livekit;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 86400;
        }

        # Agent API
        location /api/ {
            proxy_pass http://agent/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://agent/health;
            access_log off;
        }
    }
}
```

#### 2.3 Production LiveKit Configuration

```yaml
# /opt/livekit-agent/livekit-prod.yaml

port: 7880
bind_addresses:
  - "0.0.0.0"

rtc:
  port_range_start: 50000
  port_range_end: 50100
  use_external_ip: true
  # Set to your server's public IP
  external_ip: "YOUR_PUBLIC_IP"
  tcp_port: 7881
  udp_port: 7881

redis:
  address: redis:6379
  password: ${REDIS_PASSWORD}

keys:
  # Set via environment variable
  
turn:
  enabled: true
  domain: yourdomain.com
  tls_port: 5349
  udp_port: 7881
  external_tls: true

logging:
  level: info
  json: true

room:
  auto_create: true
  empty_timeout: 300
  departure_timeout: 20
  max_participants: 100

webhook:
  urls:
    - https://yourdomain.com/api/webhook
  api_key: ${WEBHOOK_API_KEY}

limits:
  num_tracks: 30
  bytes_per_sec: 100000000  # 100 MB/s
```

#### 2.4 Environment Variables

```bash
# /opt/livekit-agent/.env.production

# LiveKit
LIVEKIT_URL=wss://yourdomain.com
LIVEKIT_API_KEY=your-generated-key
LIVEKIT_API_SECRET=your-generated-secret

# Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DEEPGRAM_API_KEY=...
ELEVENLABS_API_KEY=...
GROQ_API_KEY=gsk_...

# Redis
REDIS_URL=redis://:password@redis:6379
REDIS_PASSWORD=strong-password-here

# Webhook
WEBHOOK_API_KEY=your-webhook-secret

# Priorities
STT_PROVIDERS=deepgram,openai
LLM_PROVIDERS=openai,anthropic,groq
TTS_PROVIDERS=elevenlabs,openai

# Settings
MAX_RETRIES=3
TIMEOUT_MS=10000
ENABLE_FALLBACK=true
NODE_ENV=production
LOG_LEVEL=info
```

### 3. SSL Certificates

#### Option A: Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy to nginx directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/livekit-agent/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/livekit-agent/ssl/

# Set up auto-renewal
sudo crontab -e
# Add: 0 0 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/yourdomain.com/* /opt/livekit-agent/ssl/ && docker-compose restart nginx
```

#### Option B: Self-Signed (Development Only)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /opt/livekit-agent/ssl/privkey.pem \
  -out /opt/livekit-agent/ssl/fullchain.pem \
  -subj "/CN=yourdomain.com"
```

### 4. Build and Deploy

```bash
# Build Docker image
docker build -t your-registry/livekit-agent:latest .

# Push to registry
docker push your-registry/livekit-agent:latest

# Pull on server
docker pull your-registry/livekit-agent:latest

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose logs -f
```

### 5. Monitoring Setup

#### 5.1 Install Monitoring Stack

```bash
# Create monitoring directory
mkdir -p /opt/monitoring
cd /opt/monitoring

# Create prometheus.yml
cat > prometheus.yml <<EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'agent'
    static_configs:
      - targets: ['agent:8080']
  
  - job_name: 'livekit'
    static_configs:
      - targets: ['livekit:6789']
EOF

# Create docker-compose.monitoring.yml
cat > docker-compose.monitoring.yml <<EOF
version: '3.9'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "127.0.0.1:9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - livekit-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    networks:
      - livekit-network
    restart: unless-stopped

volumes:
  prometheus-data:
  grafana-data:

networks:
  livekit-network:
    external: true
EOF

# Start monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

### 6. Firewall Configuration

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow WebRTC
sudo ufw allow 50000:50100/udp

# Allow SSH (if not already)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

### 7. Health Checks and Monitoring

```bash
# Create healthcheck script
cat > /opt/livekit-agent/healthcheck.sh <<'EOF'
#!/bin/bash

# Check agent service
if curl -sf http://localhost:8080/health > /dev/null; then
    echo "✅ Agent service: healthy"
else
    echo "❌ Agent service: unhealthy"
    docker-compose restart agent
fi

# Check LiveKit
if curl -sf http://localhost:7880 > /dev/null; then
    echo "✅ LiveKit: healthy"
else
    echo "❌ LiveKit: unhealthy"
    docker-compose restart livekit
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null; then
    echo "✅ Redis: healthy"
else
    echo "❌ Redis: unhealthy"
    docker-compose restart redis
fi
EOF

chmod +x /opt/livekit-agent/healthcheck.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/livekit-agent/healthcheck.sh >> /var/log/healthcheck.log 2>&1") | crontab -
```

### 8. Backup Strategy

```bash
# Create backup script
cat > /opt/livekit-agent/backup.sh <<'EOF'
#!/bin/bash

BACKUP_DIR="/backup/livekit"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup Redis
docker-compose exec -T redis redis-cli --rdb /data/dump.rdb save
docker cp livekit-agent_redis_1:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Backup config
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
    /opt/livekit-agent/.env.production \
    /opt/livekit-agent/livekit-prod.yaml \
    /opt/livekit-agent/nginx.conf

# Clean old backups (keep 7 days)
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/livekit-agent/backup.sh

# Schedule daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/livekit-agent/backup.sh >> /var/log/backup.log 2>&1") | crontab -
```

## Performance Tuning

### System Limits

```bash
# Increase file descriptors
sudo tee -a /etc/security/limits.conf <<EOF
* soft nofile 65535
* hard nofile 65535
EOF

# Increase network buffer sizes
sudo tee -a /etc/sysctl.conf <<EOF
net.core.rmem_max=134217728
net.core.wmem_max=134217728
net.ipv4.tcp_rmem=4096 87380 67108864
net.ipv4.tcp_wmem=4096 65536 67108864
net.ipv4.tcp_congestion_control=bbr
EOF

sudo sysctl -p
```

### Docker Optimization

```yaml
# Add to service definitions
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '1'
      memory: 1G
  restart_policy:
    condition: on-failure
    delay: 5s
    max_attempts: 3
```

## Troubleshooting

### Common Issues

**1. WebRTC not connecting**
```bash
# Check UDP ports
sudo netstat -tulpn | grep 5000

# Test STUN/TURN
docker-compose logs livekit | grep -i turn
```

**2. High latency**
```bash
# Check provider latency
curl http://localhost:8080/metrics | jq '.agents[].session.metrics.providerUsage'

# Check network
ping -c 10 api.openai.com
```

**3. Memory leaks**
```bash
# Monitor memory
docker stats

# Restart if needed
docker-compose restart agent
```

## Maintenance

### Regular Tasks

**Daily**:
- Review logs for errors
- Check metrics dashboard
- Verify backup completion

**Weekly**:
- Review provider usage and costs
- Update SSL certificates if needed
- Check for security updates

**Monthly**:
- Update Docker images
- Review and optimize provider priorities
- Capacity planning review

## Security Checklist

- [ ] SSL/TLS configured
- [ ] Firewall rules applied
- [ ] Redis password set
- [ ] API authentication enabled
- [ ] Secrets in environment variables
- [ ] Log rotation configured
- [ ] Backups automated
- [ ] Monitoring alerts set up
- [ ] Regular security updates
- [ ] Rate limiting enabled

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Review metrics: `curl http://localhost:8080/metrics`
3. Check health: `curl http://localhost:8080/health`
4. Review documentation
5. Open GitHub issue
