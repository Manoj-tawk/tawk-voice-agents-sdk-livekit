import { NextResponse } from "next/server";
import {
  AccessToken,
  type AccessTokenOptions,
  type VideoGrant,
} from "livekit-server-sdk";
import { RoomConfiguration, RoomAgentDispatch } from "@livekit/protocol";

// LiveKit Server Configuration
const API_KEY = process.env.LIVEKIT_API_KEY || "devkey";
const API_SECRET = process.env.LIVEKIT_API_SECRET || "secret";
const LIVEKIT_URL = process.env.LIVEKIT_URL || "ws://localhost:7880";

export const revalidate = 0;

export async function POST(req: Request) {
  try {
    // Parse agent configuration from request body
    const body = await req.json().catch(() => ({}));
    // Get agentName from request body or use default 'Quinn_353'
    // This matches the backend ServerOptions.agentName
    const agentName: string =
      body?.room_config?.agents?.[0]?.agent_name ||
      body?.agentName ||
      "Quinn_353";

    // Generate participant token
    const participantName = "user";
    const participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
    const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;

    console.log(
      `[connection-details] Creating token for room: ${roomName}, agentName: ${agentName}`,
    );

    const participantToken = await createParticipantToken(
      { identity: participantIdentity, name: participantName },
      roomName,
      agentName,
    );

    // Return TokenSourceResponse format (snake_case) expected by livekit-client
    // Protocol buffer expects: participant_token (string), server_url (string)
    // See: https://docs.livekit.io/home/server/generating-tokens
    // Reference: https://github.com/livekit/node-sdks/tree/main/packages/livekit-server-sdk

    // Validate token is string before sending
    if (typeof participantToken !== "string") {
      console.error("Token generation failed:", {
        tokenType: typeof participantToken,
        token: participantToken,
      });
      throw new Error(
        `Invalid token type: expected string, got ${typeof participantToken}`,
      );
    }

    // Ensure we return the exact format expected by TokenSourceResponse protocol buffer
    const data: { participant_token: string; server_url: string } = {
      participant_token: String(participantToken), // Explicit string conversion
      server_url: String(LIVEKIT_URL),
    };

    const headers = new Headers({
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Type": "application/json",
    });

    return NextResponse.json(data, { headers });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("Internal server error", { status: 500 });
  }
}

async function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  agentName?: string,
): Promise<string> {
  // Create access token
  const at = new AccessToken(API_KEY, API_SECRET, {
    identity: userInfo.identity,
    name: userInfo.name,
    ttl: "15m",
  });

  // Add video grant
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);

  // Always add room configuration with agent for explicit dispatch
  // Reference: https://docs.livekit.io/agents/server/agent-dispatch#dispatch-on-participant-connection
  // This ensures the agent is dispatched when the participant connects
  at.roomConfig = new RoomConfiguration({
    agents: [
      new RoomAgentDispatch({
        agentName: agentName || "Quinn_353", // Default to 'Quinn_353' if not provided
      }),
    ],
  });

  console.log(
    `[connection-details] Token created with agent dispatch: ${agentName || "Quinn_353"}`,
  );

  // Return JWT token (async - toJwt() returns Promise<string>)
  const token = await at.toJwt();

  // Ensure token is a string (safety check)
  if (typeof token !== "string") {
    throw new Error(
      `Token generation failed: expected string, got ${typeof token}`,
    );
  }

  return token;
}
