"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Room, VideoPresets, RoomEvent } from "livekit-client";
import type {
  RoomOptions,
  VideoCodec,
  RoomConnectOptions,
  TrackPublishDefaults,
  VideoCaptureOptions,
} from "livekit-client";
import { ConnectionDetails } from "@/lib/meet/types";
import { ModernPreJoin } from "@/components/meet/ModernPreJoin";
import { ModernMeetingRoom } from "@/components/meet/ModernMeetingRoom";
import "@/styles/design-tokens.css";
import "@/styles/modern-globals.css";

const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details";

export interface UserChoices {
  username: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
  videoDeviceId?: string;
  audioDeviceId?: string;
}

export function PageClientImpl(props: {
  roomName: string;
  region?: string;
  hq: boolean;
  codec: VideoCodec;
}) {
  const [preJoinChoices, setPreJoinChoices] = useState<UserChoices | undefined>(
    undefined,
  );
  const [connectionDetails, setConnectionDetails] = useState<
    ConnectionDetails | undefined
  >(undefined);
  const [room, setRoom] = useState<Room | undefined>(undefined);
  const router = useRouter();

  const handlePreJoinSubmit = useCallback(
    async (values: UserChoices) => {
      setPreJoinChoices(values);
      const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
      url.searchParams.append("roomName", props.roomName);
      url.searchParams.append("participantName", values.username);
      if (props.region) {
        url.searchParams.append("region", props.region);
      }
      const connectionDetailsResp = await fetch(url.toString());
      const connectionDetailsData = await connectionDetailsResp.json();
      setConnectionDetails(connectionDetailsData);
    },
    [props.roomName, props.region],
  );

  const roomOptions = useMemo((): RoomOptions => {
    const videoCodec: VideoCodec | undefined = props.codec
      ? props.codec
      : "vp9";
    const videoCaptureDefaults: VideoCaptureOptions = {
      deviceId: preJoinChoices?.videoDeviceId ?? undefined,
      resolution: props.hq ? VideoPresets.h2160 : VideoPresets.h720,
    };
    const publishDefaults: TrackPublishDefaults = {
      dtx: false,
      videoSimulcastLayers: props.hq
        ? [VideoPresets.h1080, VideoPresets.h720]
        : [VideoPresets.h540, VideoPresets.h216],
      red: true,
      videoCodec,
    };
    return {
      videoCaptureDefaults: videoCaptureDefaults,
      publishDefaults: publishDefaults,
      audioCaptureDefaults: {
        deviceId: preJoinChoices?.audioDeviceId ?? undefined,
      },
      adaptiveStream: true,
      dynacast: true,
      e2ee: undefined,
      singlePeerConnection: true,
    };
  }, [preJoinChoices, props.hq, props.codec]);

  const connectOptions = useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  const handleOnLeave = useCallback(() => {
    router.push("/");
  }, [router]);

  React.useEffect(() => {
    if (!connectionDetails || !preJoinChoices) return;

    const newRoom = new Room(roomOptions);
    setRoom(newRoom);

    const handleError = (error: Error) => {
      if (error.name === "NotFoundError" && error.message.includes("device")) {
        console.warn("Device not available:", error.message);
        return;
      }
      console.error(error);
    };

    newRoom.on(RoomEvent.Disconnected, handleOnLeave);
    newRoom.on(RoomEvent.MediaDevicesError, handleError);

    newRoom
      .connect(
        connectionDetails.serverUrl,
        connectionDetails.participantToken,
        connectOptions,
      )
      .then(() => {
        if (preJoinChoices.videoEnabled) {
          newRoom.localParticipant.setCameraEnabled(true).catch(handleError);
        }
        if (preJoinChoices.audioEnabled) {
          newRoom.localParticipant
            .setMicrophoneEnabled(true)
            .catch(handleError);
        }
      })
      .catch(handleError);

    return () => {
      newRoom.off(RoomEvent.Disconnected, handleOnLeave);
      newRoom.off(RoomEvent.MediaDevicesError, handleError);
      newRoom.disconnect();
    };
  }, [
    connectionDetails,
    preJoinChoices,
    roomOptions,
    connectOptions,
    handleOnLeave,
  ]);

  if (!connectionDetails || !preJoinChoices) {
    return (
      <ModernPreJoin roomName={props.roomName} onSubmit={handlePreJoinSubmit} />
    );
  }

  if (!room) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--bg-primary)",
        }}
      >
        <p style={{ color: "var(--text-secondary)" }}>Connecting...</p>
      </div>
    );
  }

  return <ModernMeetingRoom room={room} onLeave={handleOnLeave} />;
}
