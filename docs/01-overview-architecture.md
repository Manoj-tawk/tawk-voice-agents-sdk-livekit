# 01. Overview & Architecture

> **Understanding the complete system architecture of the TAWK.To Marketplace Voice Agent platform.**

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Components](#components)
4. [Data Flow](#data-flow)
5. [Technology Stack](#technology-stack)
6. [Key Concepts](#key-concepts)

---

## System Overview

The TAWK.To Marketplace Voice Agent is an **AI-powered conversational shopping assistant** built on LiveKit's real-time communication platform. The system enables customers to:

- **Search products** via natural voice commands
- **Get product details** through conversational Q&A
- **Add items to cart** with voice interactions
- **Complete checkout** including shipping selection
- **Track orders** and process returns

### Core Features

- **🎤 Voice-First Interface**: Natural speech recognition and synthesis
- **🤖 AI Agent**: GPT-4o-mini powered conversational AI
- **🎯 Low Latency**: < 1 second response time
- **📱 Video Conferencing**: Google Meet-style UI with AI agent
- **📝 Real-time Transcription**: Live captions and full transcript history
- **🛠️ Tool Calling**: LLM can execute functions (search, cart, checkout)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER'S BROWSER                                  │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Next.js Frontend (React)                                          │ │
│  │  - Landing Page (/page.tsx)                                        │ │
│  │  - Meet App (/meet/rooms/[roomName])                              │ │
│  │  - Voice Assistant (/voice-assistant)                              │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │  LiveKit React Components                                     │ │ │
│  │  │  - VideoConference / ModernMeetingRoom                       │ │ │
│  │  │  - ParticipantTile, FloatingControlBar                       │ │ │
│  │  │  - Transcription Display, Transcript History                 │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                 ↕ WebRTC + WebSocket                    │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                        LIVEKIT SERVER                                    │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  WebRTC SFU (Selective Forwarding Unit)                           │ │
│  │  - Room Management                                                 │ │
│  │  - Participant Management                                          │ │
│  │  - Audio/Video Track Routing                                      │ │
│  │  - Data Channel Messaging                                          │ │
│  │  - TURN/STUN Server                                                │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                 ↕ Agent Protocol                         │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                     AGENT SERVER (Node.js Backend)                       │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  LiveKit Agents SDK                                                │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │  MarketplaceAgent (voice.Agent)                              │ │ │
│  │  │  - Lifecycle Hooks (onEnter, onExit, onUserTurnCompleted)   │ │ │
│  │  │  - Pipeline Nodes (stt, llm, tts, transcription)            │ │ │
│  │  │  - Tools (searchProducts, checkout, etc.)                   │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  │                                                                     │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │  Voice Pipeline (STT → LLM → TTS)                           │ │ │
│  │  │                                                               │ │ │
│  │  │  1. STT: User Audio → Text (Deepgram Nova-3)               │ │ │
│  │  │     ↓                                                        │ │ │
│  │  │  2. LLM: Text → Response/Tools (GPT-4o-mini)               │ │ │
│  │  │     ↓                                                        │ │ │
│  │  │  3. TTS: Text → Agent Audio (ElevenLabs Turbo v2.5)        │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  │                                                                     │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │  Agent Tools (LLM Function Calling)                         │ │ │
│  │  │  - searchProducts(query, category, filters)                 │ │ │
│  │  │  - getProductDetails(itemId)                                │ │ │
│  │  │  - addToCart(itemId, quantity, variant)                     │ │ │
│  │  │  - getShippingOptions(zipCode, itemIds)                     │ │ │
│  │  │  - checkout(shippingType, zipCode, paymentMethod)           │ │ │
│  │  │  - checkOrderStatus(orderId)                                │ │ │
│  │  │  - getShippingInfo(orderId)                                 │ │ │
│  │  │  - checkInventory(productId)                                │ │ │
│  │  │  - processReturn(orderId, reason)                           │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL AI SERVICES                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Deepgram    │  │   OpenAI     │  │  ElevenLabs  │                  │
│  │  STT         │  │   LLM        │  │  TTS         │                  │
│  │  (Nova-3)    │  │  (GPT-4o-mini)│  │  (Turbo v2.5)│                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Frontend (Next.js Application)

**Location**: `packages/frontend/`

**Purpose**: User-facing web application for video conferencing and voice interactions.

**Key Files**:
- `app/page.tsx` - Landing page with meeting join/create
- `app/meet/rooms/[roomName]/` - Meet app implementation
- `app/voice-assistant/page.tsx` - Standalone voice assistant
- `components/meet/ModernMeetingRoom.tsx` - Main meeting UI
- `components/app/` - Voice assistant components

**Features**:
- Video conferencing UI (Google Meet style)
- Voice assistant interface
- Real-time transcription display
- Screen sharing
- Device switching (mic/camera/speaker)
- Transcript history panel

### 2. Agent Server (Node.js Backend)

**Location**: `packages/backend/`

**Purpose**: Runs the AI voice agent that processes audio, makes decisions, and responds.

**Key Files**:
- `src/agent.ts` - Main agent implementation
- `src/customerServiceRetail/` - Additional agent examples

**Features**:
- Voice pipeline (STT → LLM → TTS)
- Tool/function calling
- Lifecycle hooks
- Pipeline node customization
- Background noise cancellation
- Preemptive generation for low latency

### 3. LiveKit Server

**Purpose**: WebRTC SFU for real-time audio/video/data communication.

**Options**:
- **Self-hosted**: Run locally via binary or Docker
- **LiveKit Cloud**: Managed service (https://cloud.livekit.io)

**Features**:
- Room management
- Audio/Video track routing
- Data channel messaging (for transcriptions)
- TURN/STUN server for NAT traversal
- Agent dispatch mechanism

### 4. External AI Services

**Deepgram** (Speech-to-Text)
- Model: Nova-3 (fastest)
- Streaming: Yes
- Language: English
- Features: Smart formatting, interim results

**OpenAI** (Large Language Model)
- Model: GPT-4o-mini
- Temperature: 0.7 (balanced)
- Features: Function calling, streaming, prompt caching

**ElevenLabs** (Text-to-Speech)
- Voice: Alice (professional, clear)
- Model: Turbo v2.5 (lowest latency)
- Streaming: Yes
- Features: Streaming latency optimization

---

## Data Flow

### 1. User Joins Meeting

```
User Browser
  → Creates room or joins existing room
  → Requests connection token from Frontend API
  → Frontend API generates JWT token (with agent metadata)
  → User connects to LiveKit Server
  → LiveKit Server creates participant
```

### 2. Agent Joins Automatically

```
LiveKit Server
  → Detects new room with agent metadata
  → Dispatches job to Agent Server
  → Agent Server creates MarketplaceAgent instance
  → Agent connects to LiveKit room as participant
  → Agent's onEnter() hook fires
  → Agent generates greeting: "Welcome to TAWK.To Marketplace!"
```

### 3. User Speaks

```
User Microphone
  → Audio captured as PCM frames (48kHz, 16-bit)
  → Sent to LiveKit Server via WebRTC
  → LiveKit Server forwards to Agent
  → Agent's STT (Deepgram)
     - Streams audio to Deepgram API
     - Returns transcribed text (streaming)
  → VAD detects end of speech
  → User turn completed
```

### 4. Agent Processes & Responds

```
Agent LLM (OpenAI GPT-4o-mini)
  → Receives user message + chat history + tools
  → Decides: respond with text OR call a tool
  
  OPTION A: Text Response
  → LLM generates text response (streaming)
  → Agent's TTS (ElevenLabs)
     - Converts text to audio (streaming)
     - Returns PCM audio frames
  → Agent publishes audio to LiveKit room
  → User hears agent's voice
  → Transcription sent via data channel
  
  OPTION B: Tool Call
  → LLM calls tool (e.g., searchProducts)
  → Tool execute() function runs
     - Optional: generateReply() for status update ("Searching now...")
     - Returns result to LLM
  → LLM generates response based on tool result
  → Continue to TTS → Audio playback
```

### 5. Transcription Flow

```
Agent TTS Output
  → Text chunks generated by LLM
  → Sent to Transcription Node
  → Packaged as data message
  → Sent via LiveKit data channel (topic: "lk.transcription")
  → Frontend receives transcription
  → Displayed on participant tile (captions)
  → Added to transcript history panel
```

---

## Technology Stack

### Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Node.js | 20+ | JavaScript runtime |
| Language | TypeScript | 5.x | Type-safe code |
| SDK | @livekit/agents | 0.11.x | Agent framework |
| STT | Deepgram Nova-3 | Latest | Speech recognition |
| LLM | OpenAI GPT-4o-mini | Latest | Conversation AI |
| TTS | ElevenLabs Turbo v2.5 | Latest | Speech synthesis |
| VAD | Silero VAD | Latest | Voice activity detection |
| Noise Cancellation | Background Voice Cancellation | Latest | Audio enhancement |

### Frontend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | Next.js | 15 | React framework |
| Language | TypeScript | 5.x | Type-safe code |
| UI Library | React | 19 | UI components |
| LiveKit Client | livekit-client | 2.x | WebRTC client |
| LiveKit Components | @livekit/components-react | 2.x | React components |
| Styling | CSS Modules | - | Component styling |
| Theme | Spotify Dark | - | UI design system |

### Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| LiveKit Server | LiveKit OSS | WebRTC SFU |
| Package Manager | pnpm | Monorepo management |
| Redis | (Optional) | LiveKit Cloud metadata |

---

## Key Concepts

### 1. Rooms

A **Room** is a virtual space where participants (users and agents) connect for real-time communication.

- **Unique Name**: Each room has a unique identifier (e.g., `abc123def`)
- **Participants**: Users, agents, or other clients
- **Tracks**: Audio, video, data streams
- **Metadata**: Custom data attached to room (e.g., agent name)

### 2. Participants

A **Participant** is a client connected to a room.

Types:
- **Remote Participant**: Other users in the room
- **Local Participant**: The current client
- **Agent Participant**: AI voice agent

Properties:
- `identity`: Unique identifier
- `name`: Display name
- `kind`: `STANDARD`, `INGRESS`, `EGRESS`, `SIP`, `AGENT`
- `tracks`: Audio/video/data tracks

### 3. Tracks

A **Track** is a stream of media (audio, video, or data).

Types:
- **AudioTrack**: Microphone input/output
- **VideoTrack**: Camera input/output
- **DataTrack**: Custom data (transcriptions, chat)

Properties:
- `source`: `MICROPHONE`, `CAMERA`, `SCREEN_SHARE`
- `muted`: Track enabled/disabled state

### 4. Agent Lifecycle

An **Agent** goes through a lifecycle with hooks:

1. **Agent Spawn**: LiveKit spawns new process for agent job
2. **onEnter()**: Agent joins session, can send greeting
3. **Voice Pipeline**: User speaks → Agent responds (loop)
4. **onExit()**: Agent leaves session (optional handoff)
5. **Process Exit**: Agent process terminates

### 5. Voice Pipeline

The **Voice Pipeline** processes voice in 3 stages:

```
STT (Speech-to-Text)
  → User audio → Text transcript
  
LLM (Large Language Model)
  → Text → Response text + Tool calls
  
TTS (Text-to-Speech)
  → Response text → Agent audio
```

### 6. Tools (Function Calling)

**Tools** allow the LLM to take actions via code execution.

Example:
```typescript
llm.tool({
  description: 'Search for products',
  parameters: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    const results = await searchDatabase(query);
    return results;
  },
})
```

LLM decides when to call tools based on user intent.

### 7. Transcription

**Transcriptions** are text representations of audio sent to the frontend.

- **STT Transcription**: User speech → Text (automatic)
- **Agent Transcription**: Agent TTS output → Text (via data channel)
- **Topic**: `lk.transcription`
- **Format**: Interim (partial) vs Final (complete)

---

## Next Steps

- **Quick Start**: [02. Quick Start Guide](./02-quick-start.md)
- **Installation**: [03. Installation & Setup](./03-installation-setup.md)
- **Building Agents**: [07. Building Agents](./07-building-agents.md)

---

[← Back to Index](./README.md) | [Next: Quick Start Guide →](./02-quick-start.md)

