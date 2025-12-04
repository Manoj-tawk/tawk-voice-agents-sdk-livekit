"use client";

import React, { useState } from "react";
import { Room } from "livekit-client";
import { RoomContext } from "@livekit/components-react";
import { FloatingControlBar } from "./FloatingControlBar";
import { ParticipantGrid } from "./ParticipantGrid";
import { RightPanel } from "./RightPanel";
import styles from "./ModernMeetingRoom.module.css";

interface ModernMeetingRoomProps {
  room: Room;
  onLeave: () => void;
}

export function ModernMeetingRoom({ room, onLeave }: ModernMeetingRoomProps) {
  const [isPeopleOpen, setIsPeopleOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [hideControlsTimeout, setHideControlsTimeout] =
    useState<NodeJS.Timeout | null>(null);

  const handleMouseMove = () => {
    setIsControlsVisible(true);
    if (hideControlsTimeout) {
      clearTimeout(hideControlsTimeout);
    }
    const timeout = setTimeout(() => {
      setIsControlsVisible(false);
    }, 3000);
    setHideControlsTimeout(timeout);
  };

  React.useEffect(() => {
    return () => {
      if (hideControlsTimeout) {
        clearTimeout(hideControlsTimeout);
      }
    };
  }, [hideControlsTimeout]);

  return (
    <RoomContext.Provider value={room}>
      <div className={styles.container} onMouseMove={handleMouseMove}>
        <div className={styles.background}>
          <div className={styles.gradientOrb1} />
          <div className={styles.gradientOrb2} />
        </div>

        <div className={styles.mainContent}>
          <ParticipantGrid />
        </div>

        {/* Right Panel */}
        {(isPeopleOpen || isChatOpen) && (
          <RightPanel
            room={room}
            activePanel={isPeopleOpen ? "people" : "chat"}
            onClose={() => {
              setIsPeopleOpen(false);
              setIsChatOpen(false);
            }}
          />
        )}

        {/* Floating Control Bar */}
        <FloatingControlBar
          room={room}
          onLeave={onLeave}
          onPeopleToggle={() => {
            setIsPeopleOpen(!isPeopleOpen);
            setIsChatOpen(false);
          }}
          onChatToggle={() => {
            setIsChatOpen(!isChatOpen);
            setIsPeopleOpen(false);
          }}
          isPeopleOpen={isPeopleOpen}
          isChatOpen={isChatOpen}
          isVisible={isControlsVisible}
        />
      </div>
    </RoomContext.Provider>
  );
}
