"use client";

import React from "react";
import { Participant, Track, ParticipantKind } from "livekit-client";
import {
  useTracks,
  VideoTrack,
  useIsSpeaking,
  useParticipantInfo,
} from "@livekit/components-react";
import styles from "./ParticipantTile.module.css";

interface ParticipantTileProps {
  participant: Participant;
}

export function ParticipantTile({ participant }: ParticipantTileProps) {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const videoTrack = tracks.find(
    (t) => t.participant.identity === participant.identity,
  );
  const isSpeaking = useIsSpeaking(participant);
  const { identity, name } = useParticipantInfo({ participant });

  const isAgent = participant.kind === ParticipantKind.AGENT;
  const displayName = name || identity || "Unknown";

  return (
    <div
      className={`${styles.container} ${isSpeaking ? styles.speaking : ""} ${isAgent ? styles.agent : ""}`}
    >
      {videoTrack ? (
        <VideoTrack trackRef={videoTrack} className={styles.video} />
      ) : (
        <div className={styles.placeholder}>
          <div className={styles.avatar}>
            {isAgent ? "🤖" : displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      <div className={styles.nameBar}>
        {isAgent && <span className={styles.aiIcon}>✨</span>}
        <span className={styles.name}>{displayName}</span>
        {isSpeaking && <span className={styles.speakingIndicator}>🎙️</span>}
      </div>

      {isAgent && (
        <div className={styles.agentBadge}>
          <span className={styles.agentLabel}>AI Agent</span>
        </div>
      )}
    </div>
  );
}
