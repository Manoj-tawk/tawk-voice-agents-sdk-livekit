# Frontend Setup Guide

This guide shows how to use the `agent-starter-react` frontend with your backend.

## Quick Start

1. **Navigate to the frontend directory:**
   ```bash
   cd repos/agent-starter-react
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
   NEXT_PUBLIC_LIVEKIT_URL=ws://localhost:7880
   ```

3. **Install dependencies:**
   ```bash
   pnpm install
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   ```

5. **Open in browser:**
   ```
   http://localhost:3000
   ```

## How It Works

### Connection Flow

1. **User clicks "Start call"** in the frontend
2. **Frontend calls** `/api/connection-details` (Next.js API route)
3. **Next.js API route:**
   - Calls your backend `POST /agent/create` to create an agent
   - Calls your backend `POST /token` to get a participant token
   - Returns connection details to frontend
4. **Frontend connects** to LiveKit server using the token
5. **Your backend agent** handles voice AI processing

### Backend Integration

The frontend is configured to connect to your backend at:
- **Backend URL**: `http://localhost:8080` (configurable via `NEXT_PUBLIC_BACKEND_URL`)
- **LiveKit URL**: `ws://localhost:7880` (configurable via `NEXT_PUBLIC_LIVEKIT_URL`)

### API Endpoints Used

- `POST /agent/create` - Creates an agent in a room
- `POST /token` - Generates a participant token

## Customization

You can customize the frontend by editing:
- `app-config.ts` - UI configuration, branding, features
- `components/` - React components
- `app/api/connection-details/route.ts` - Backend integration logic

## Production Deployment

For production:
1. Set `NEXT_PUBLIC_BACKEND_URL` to your production backend URL
2. Set `NEXT_PUBLIC_LIVEKIT_URL` to your production LiveKit server URL
3. Build: `pnpm build`
4. Start: `pnpm start`

## Troubleshooting

- **CORS errors**: Make sure your backend has CORS enabled (already configured)
- **Connection failed**: Verify LiveKit server is running and accessible
- **Agent not responding**: Check backend logs and agent creation endpoint

