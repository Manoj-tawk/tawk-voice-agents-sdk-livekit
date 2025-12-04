"use client";

import React from "react";
import { useParticipants } from "@livekit/components-react";
import { ParticipantTile } from "./ParticipantTile";
import { ActiveCaption } from "./ModernMeetingRoom";
import styles from "./ParticipantGrid.module.css";

interface ParticipantGridProps {
  activeCaptions: Map<string, ActiveCaption>;
}

export function ParticipantGrid({ activeCaptions }: ParticipantGridProps) {
  const participants = useParticipants();

  const getGridClass = () => {
    const count = participants.length;
    if (count === 1) return styles.grid1;
    if (count === 2) return styles.grid2;
    if (count <= 4) return styles.grid4;
    return styles.grid6;
  };

  return (
    <div className={`${styles.container} ${getGridClass()}`}>
      {participants.map((participant) => (
        <ParticipantTile
          key={participant.identity}
          participant={participant}
          activeCaption={activeCaptions.get(participant.identity)}
        />
      ))}
    </div>
  );
}
