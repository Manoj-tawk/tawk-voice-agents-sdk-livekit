"use client";

import React from "react";
import { Participant, Track, ParticipantKind } from "livekit-client";
import {
  useTracks,
  VideoTrack,
  AudioTrack,
  useIsSpeaking,
  useParticipantInfo,
} from "@livekit/components-react";
import { ActiveCaption } from "./ModernMeetingRoom";
import { AnimatedAIAvatar } from "./AnimatedAIAvatar";
import styles from "./ParticipantTile.module.css";

interface ParticipantTileProps {
  participant: Participant;
  activeCaption?: ActiveCaption;
}

export function ParticipantTile({
  participant,
  activeCaption,
}: ParticipantTileProps) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone], {
    onlySubscribed: false,
  });
  const videoTrack = tracks.find(
    (t) =>
      t.participant.identity === participant.identity &&
      t.source === Track.Source.Camera,
  );
  const audioTrack = tracks.find(
    (t) =>
      t.participant.identity === participant.identity &&
      t.source === Track.Source.Microphone,
  );
  const isSpeaking = useIsSpeaking(participant);
  const { identity, name } = useParticipantInfo({ participant });

  const isAgent = participant.kind === ParticipantKind.AGENT;
  const displayName = name || identity || "Unknown";

  return (
    <div
      className={`${styles.container} ${isSpeaking ? styles.speaking : ""} ${isAgent ? styles.ai : ""}`}
    >
      {videoTrack ? (
        <VideoTrack trackRef={videoTrack} className={styles.video} />
      ) : (
        <div className={styles.placeholder}>
          {isAgent ? (
            <AnimatedAIAvatar isSpeaking={isSpeaking} size={200} />
          ) : (
            <div className={styles.avatar}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Render audio track for all participants */}
      {audioTrack && <AudioTrack trackRef={audioTrack} />}

      {/* Real-time caption overlay */}
      {activeCaption && (
        <div className={styles.captionOverlay}>
          <div className={styles.caption}>{activeCaption.text}</div>
        </div>
      )}

      <div className={styles.nameBar}>
        {isAgent && <span className={styles.aiIcon}>✨</span>}
        <span className={styles.name}>{displayName}</span>
        {isSpeaking && <span className={styles.speakingIndicator}>🎙️</span>}
      </div>

      {isAgent && (
        <div className={styles.aiBadge}>
          <span className={styles.aiLabel}>Voice Agent</span>
        </div>
      )}
    </div>
  );
}
