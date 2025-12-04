"use client";

import React from "react";
import { useParticipants } from "@livekit/components-react";
import { ParticipantTile } from "./ParticipantTile";
import styles from "./ParticipantGrid.module.css";

export function ParticipantGrid() {
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
        <ParticipantTile key={participant.identity} participant={participant} />
      ))}
    </div>
  );
}
