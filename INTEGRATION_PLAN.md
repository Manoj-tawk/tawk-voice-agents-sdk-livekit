# Final Integration Plan: Meet App with Agent Dispatch

## ✅ Verified with LiveKit Documentation

Based on LiveKit docs review, this plan uses the correct approach:
- **RoomAgentDispatch** in token's `RoomConfiguration` for explicit dispatch
- Agent automatically joins when participant connects (dispatch on participant connection)
- Works with video conferencing rooms (meeting rooms)

---

## 🎯 Goal

Integrate LiveKit Meet UI into the monorepo and enable automatic agent dispatch to meeting rooms based on room ID. When a participant joins a meeting room, the agent should automatically join and start conversation.

---

## 📁 Final File Structure

```
packages/frontend/
├── app/
│   ├── page.tsx                          # Meet landing page (room creation)
│   ├── voice-assistant/
│   │   └── page.tsx                     # Current voice assistant (moved)
│   ├── meet/
│   │   └── rooms/
│   │       └── [roomName]/
│   │           ├── page.tsx             # Room page (server component)
│   │           └── PageClientImpl.tsx   # Room client component
│   └── api/
│       └── connection-details/
│           └── route.ts                 # Updated: supports both POST (voice) and GET (meet)
├── lib/
│   ├── meet/                            # Meet utilities (copied from repos/meet/lib/)
│   │   ├── client-utils.ts
│   │   ├── types.ts
│   │   ├── getLiveKitURL.ts
│   │   └── ...
│   └── ...                              # Existing utilities
└── components/
    └── ...                              # Existing components
```

---

## 🔧 Implementation Steps

### Phase 1: Move Current Voice Assistant UI

**Step 1.1**: Move voice assistant route
- Move `/app/(app)/page.tsx` → `/app/voice-assistant/page.tsx`
- Update imports and routing
- Keep existing functionality intact

**Step 1.2**: Update navigation/links
- Update any internal links to point to `/voice-assistant`
- Ensure voice assistant still works independently

---

### Phase 2: Integrate Meet App Components

**Step 2.1**: Copy Meet utilities
- Copy `repos/meet/lib/*` → `packages/frontend/lib/meet/`
- Files to copy:
  - `client-utils.ts` (randomString, generateRoomId, etc.)
  - `types.ts` (ConnectionDetails type)
  - `getLiveKitURL.ts` (region handling)
  - Other utility files as needed

**Step 2.2**: Create Meet landing page
- Create `/app/page.tsx` with meet app home page
- Includes room creation UI (Start Meeting button)
- Routes to `/meet/rooms/[roomName]` when room is created

**Step 2.3**: Create Meet room page
- Create `/app/meet/rooms/[roomName]/page.tsx` (server component)
- Create `/app/meet/rooms/[roomName]/PageClientImpl.tsx` (client component)
- Copy from `repos/meet/app/rooms/[roomName]/` and adapt
- Uses `@livekit/components-react` VideoConference component

---

### Phase 3: Agent Dispatch Integration

**Step 3.1**: Update Connection Details API
- Modify `/app/api/connection-details/route.ts` to support both:
  - **GET** (for meet app): `?roomName=xxx&participantName=xxx`
  - **POST** (for voice assistant): existing format
- For GET requests (meet rooms):
  - Accept `roomName` and `participantName` from query params
  - Generate participant token
  - **Add RoomAgentDispatch** with `agentName: 'Quinn_353'` to token
  - Return connection details in meet format

**Step 3.2**: Verify Agent Configuration
- Ensure backend agent has `agentName: 'Quinn_353'` in ServerOptions
- Agent will automatically join when participant connects (explicit dispatch)

---

### Phase 4: Dependencies & Configuration

**Step 4.1**: Install Missing Dependencies
```json
{
  "@livekit/components-styles": "^1.2.0",
  "@livekit/krisp-noise-filter": "^0.3.4",
  "@livekit/track-processors": "^0.6.0",
  "react-hot-toast": "^2.5.2",
  "tinykeys": "^3.0.0"
}
```

**Step 4.2**: Update Environment Variables
- Ensure `.env.local` has all required LiveKit credentials
- Same credentials work for both voice assistant and meet

---

### Phase 5: Testing & Verification

**Step 5.1**: Test Voice Assistant
- Navigate to `/voice-assistant`
- Verify agent joins and conversation works

**Step 5.2**: Test Meet Room with Agent
- Navigate to `/` (meet landing page)
- Create/join a room
- Verify agent automatically joins when participant connects
- Verify conversation works in meeting room

**Step 5.3**: Test Multiple Participants
- Multiple participants join same room
- Verify agent handles multiple participants correctly

---

## 🔑 Key Implementation Details

### Connection Details API (Updated)

```typescript
// GET /api/connection-details?roomName=room-123&participantName=John
export async function GET(request: NextRequest) {
  const roomName = request.nextUrl.searchParams.get('roomName');
  const participantName = request.nextUrl.searchParams.get('participantName');
  
  // Generate token with RoomAgentDispatch
  const at = new AccessToken(API_KEY, API_SECRET, {
    identity: `${participantName}__${randomPostfix}`,
    name: participantName,
  });
  
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });
  
  // ✅ CRITICAL: Add agent dispatch for automatic agent join
  at.roomConfig = new RoomConfiguration({
    agents: [
      new RoomAgentDispatch({
        agentName: 'Quinn_353', // Must match backend ServerOptions.agentName
      }),
    ],
  });
  
  return NextResponse.json({
    serverUrl: LIVEKIT_URL,
    roomName: roomName,
    participantToken: await at.toJwt(),
    participantName: participantName,
  });
}
```

### Agent Dispatch Flow

1. **User creates/joins room** → `/meet/rooms/room-123`
2. **Frontend calls** → `GET /api/connection-details?roomName=room-123&participantName=John`
3. **API generates token** → Includes `RoomAgentDispatch` with `agentName: 'Quinn_353'`
4. **Participant connects** → Token includes agent dispatch configuration
5. **LiveKit server** → Automatically dispatches agent to room
6. **Agent joins** → Same room, starts conversation
7. **Conversation happens** → In the meeting room with all participants

---

## ✅ Verification Checklist

- [ ] Voice assistant works at `/voice-assistant`
- [ ] Meet landing page works at `/`
- [ ] Room creation works
- [ ] Participant can join room at `/meet/rooms/[roomName]`
- [ ] Agent automatically joins when participant connects
- [ ] Agent conversation works in meeting room
- [ ] Multiple participants can join same room
- [ ] Agent handles multiple participants correctly
- [ ] Video/audio tracks work correctly
- [ ] No conflicts between voice assistant and meet routes

---

## 📚 Documentation References

- [Agent Dispatch - Dispatch on Participant Connection](https://docs.livekit.io/agents/server/agent-dispatch#dispatch-on-participant-connection)
- [Explicit Agent Dispatch](https://docs.livekit.io/agents/server/agent-dispatch#explicit)
- [Web & Mobile Frontends](https://docs.livekit.io/agents/start/frontend)
- [LiveKit Components React](https://github.com/livekit/components-js)

---

## 🎯 Success Criteria

1. ✅ Current voice assistant UI moved to `/voice-assistant` and still works
2. ✅ Meet app integrated at `/` and `/meet/rooms/[roomName]`
3. ✅ Agent automatically joins meeting rooms when participant connects
4. ✅ Conversation works in meeting rooms
5. ✅ Both voice assistant and meet app work independently
6. ✅ No breaking changes to existing functionality

---

## 🚀 Ready to Implement

This plan is verified against LiveKit documentation and follows best practices for:
- Explicit agent dispatch via `RoomAgentDispatch`
- Token-based authentication
- Video conferencing with agents
- Multiple participants support

**Next Step**: Begin Phase 1 implementation.

