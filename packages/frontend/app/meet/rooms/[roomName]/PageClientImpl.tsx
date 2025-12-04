"use client";

import "@livekit/components-styles";
import React from "react";
import { ConnectionDetails } from "@/lib/meet/types";
import {
  formatChatMessageLinks,
  PreJoin,
  RoomContext,
  VideoConference,
} from "@livekit/components-react";
import type { LocalUserChoices } from "@livekit/components-react";
import { VideoPresets, Room, RoomEvent } from "livekit-client";
import type {
  RoomOptions,
  VideoCodec,
  RoomConnectOptions,
  TrackPublishDefaults,
  VideoCaptureOptions,
} from "livekit-client";
import { useRouter } from "next/navigation";

const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details";

export function PageClientImpl(props: {
  roomName: string;
  region?: string;
  hq: boolean;
  codec: VideoCodec;
}) {
  const [preJoinChoices, setPreJoinChoices] = React.useState<
    LocalUserChoices | undefined
  >(undefined);
  const preJoinDefaults = React.useMemo(() => {
    return {
      username: "",
      videoEnabled: true,
      audioEnabled: true,
    };
  }, []);
  const [connectionDetails, setConnectionDetails] = React.useState<
    ConnectionDetails | undefined
  >(undefined);

  const handlePreJoinSubmit = React.useCallback(
    async (values: LocalUserChoices) => {
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
  const handlePreJoinError = React.useCallback(
    (e: unknown) => console.error(e),
    [],
  );

  return (
    <main data-lk-theme="default" style={{ height: "100%" }}>
      {connectionDetails === undefined || preJoinChoices === undefined ? (
        <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
          <PreJoin
            defaults={preJoinDefaults}
            onSubmit={handlePreJoinSubmit}
            onError={handlePreJoinError}
          />
        </div>
      ) : (
        <VideoConferenceComponent
          connectionDetails={connectionDetails}
          userChoices={preJoinChoices}
          options={{ codec: props.codec, hq: props.hq }}
        />
      )}
    </main>
  );
}

function VideoConferenceComponent(props: {
  userChoices: LocalUserChoices;
  connectionDetails: ConnectionDetails;
  options: {
    hq: boolean;
    codec: VideoCodec;
  };
}) {
  const e2eeEnabled = false;

  const roomOptions = React.useMemo((): RoomOptions => {
    let videoCodec: VideoCodec | undefined = props.options.codec
      ? props.options.codec
      : "vp9";
    if (e2eeEnabled && (videoCodec === "av1" || videoCodec === "vp9")) {
      videoCodec = undefined;
    }
    const videoCaptureDefaults: VideoCaptureOptions = {
      deviceId: props.userChoices.videoDeviceId ?? undefined,
      resolution: props.options.hq ? VideoPresets.h2160 : VideoPresets.h720,
    };
    const publishDefaults: TrackPublishDefaults = {
      dtx: false,
      videoSimulcastLayers: props.options.hq
        ? [VideoPresets.h1080, VideoPresets.h720]
        : [VideoPresets.h540, VideoPresets.h216],
      red: !e2eeEnabled,
      videoCodec,
    };
    return {
      videoCaptureDefaults: videoCaptureDefaults,
      publishDefaults: publishDefaults,
      audioCaptureDefaults: {
        deviceId: props.userChoices.audioDeviceId ?? undefined,
      },
      adaptiveStream: true,
      dynacast: true,
      e2ee: undefined,
      singlePeerConnection: true,
    };
  }, [props.userChoices, props.options.hq, props.options.codec, e2eeEnabled]);

  const room = React.useMemo(() => new Room(roomOptions), [roomOptions]);

  const connectOptions = React.useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  const router = useRouter();
  const handleOnLeave = React.useCallback(() => router.push("/"), [router]);
  const handleError = React.useCallback((error: Error) => {
    // Don't show alerts for device not found errors (expected when no camera/mic)
    if (error.name === "NotFoundError" && error.message.includes("device")) {
      console.warn("Device not available:", error.message);
      return;
    }
    console.error(error);
    // Only alert for unexpected errors
    if (
      !error.message.includes("device") &&
      !error.message.includes("permission")
    ) {
      alert(
        `Encountered an unexpected error, check the console logs for details: ${error.message}`,
      );
    }
  }, []);
  const handleEncryptionError = React.useCallback((error: Error) => {
    console.error(error);
    alert(
      `Encountered an unexpected encryption error, check the console logs for details: ${error.message}`,
    );
  }, []);

  // Register text stream handler for transcriptions so they appear in chat
  React.useEffect(() => {
    const handleTranscription = async (
      reader: {
        readAll: () => Promise<string>;
        info: { attributes?: Record<string, string> };
      },
      participantInfo: { identity: string },
    ) => {
      try {
        const message = await reader.readAll();
        const isTranscription =
          reader.info.attributes?.["lk.transcribed_track_id"] != null;
        const isFinal =
          reader.info.attributes?.["lk.transcription_final"] === "true";

        if (isTranscription && isFinal) {
          // Find the participant
          const participant = room.remoteParticipants.get(
            participantInfo.identity,
          );
          if (participant) {
            // Forward transcription to chat topic so it appears in VideoConference chat
            // The VideoConference component handles 'lk.chat' topic automatically
            // Note: This will appear as from the local participant, but the message
            // content will be the agent's transcription
            await room.localParticipant.sendText(message, {
              topic: "lk.chat",
            });
            console.log(
              `[Transcription] ${participantInfo.identity}: ${message}`,
            );
          }
        }
      } catch (error) {
        console.warn("Error reading transcription stream:", error);
      }
    };

    // Register handler for transcription text stream (synchronous call)
    try {
      room.registerTextStreamHandler("lk.transcription", handleTranscription);
    } catch (error) {
      console.warn("Failed to register transcription handler:", error);
    }

    return () => {
      // Unregister handler on cleanup
      try {
        room.unregisterTextStreamHandler("lk.transcription");
      } catch (error) {
        // Ignore errors during cleanup
      }
    };
  }, [room]);

  React.useEffect(() => {
    room.on(RoomEvent.Disconnected, handleOnLeave);
    room.on(RoomEvent.EncryptionError, handleEncryptionError);
    room.on(RoomEvent.MediaDevicesError, handleError);

    room
      .connect(
        props.connectionDetails.serverUrl,
        props.connectionDetails.participantToken,
        connectOptions,
      )
      .catch((error) => {
        handleError(error);
      });
    if (props.userChoices.videoEnabled) {
      room.localParticipant.setCameraEnabled(true).catch((error) => {
        handleError(error);
      });
    }
    if (props.userChoices.audioEnabled) {
      room.localParticipant.setMicrophoneEnabled(true).catch((error) => {
        handleError(error);
      });
    }
    return () => {
      room.off(RoomEvent.Disconnected, handleOnLeave);
      room.off(RoomEvent.EncryptionError, handleEncryptionError);
      room.off(RoomEvent.MediaDevicesError, handleError);
    };
  }, [
    e2eeEnabled,
    room,
    props.connectionDetails,
    props.userChoices,
    connectOptions,
    handleOnLeave,
    handleError,
    handleEncryptionError,
  ]);

  return (
    <div className="lk-room-container" style={{ height: "100vh" }}>
      <RoomContext.Provider value={room}>
        <VideoConference chatMessageFormatter={formatChatMessageLinks} />
      </RoomContext.Provider>
    </div>
  );
}
