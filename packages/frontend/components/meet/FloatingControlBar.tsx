"use client";

import React from "react";
import { Room } from "livekit-client";
import { useLocalParticipant } from "@livekit/components-react";
import styles from "./FloatingControlBar.module.css";

interface FloatingControlBarProps {
  room: Room;
  onLeave: () => void;
  onPeopleToggle: () => void;
  onChatToggle: () => void;
  isPeopleOpen: boolean;
  isChatOpen: boolean;
  isVisible: boolean;
}

export function FloatingControlBar({
  onLeave,
  onPeopleToggle,
  onChatToggle,
  isPeopleOpen,
  isChatOpen,
  isVisible,
}: FloatingControlBarProps) {
  const { isMicrophoneEnabled, isCameraEnabled, localParticipant } =
    useLocalParticipant();

  const toggleMicrophone = () => {
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  const toggleCamera = () => {
    localParticipant.setCameraEnabled(!isCameraEnabled);
  };

  return (
    <div className={`${styles.container} ${!isVisible ? styles.hidden : ""}`}>
      <div className={styles.controlBar}>
        {/* Left Side - Media Controls */}
        <div className={styles.section}>
          <button
            className={`${styles.button} ${!isMicrophoneEnabled ? styles.disabled : ""}`}
            onClick={toggleMicrophone}
            title={isMicrophoneEnabled ? "Mute" : "Unmute"}
          >
            {isMicrophoneEnabled ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>

          <button
            className={`${styles.button} ${!isCameraEnabled ? styles.disabled : ""}`}
            onClick={toggleCamera}
            title={isCameraEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {isCameraEnabled ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </button>
        </div>

        {/* Center - Panel Toggles */}
        <div className={styles.section}>
          <button
            className={`${styles.button} ${isPeopleOpen ? styles.active : ""}`}
            onClick={onPeopleToggle}
            title="People"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </button>

          <button
            className={`${styles.button} ${isChatOpen ? styles.active : ""}`}
            onClick={onChatToggle}
            title="Chat"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>

        {/* Right Side - Leave Button */}
        <div className={styles.section}>
          <button
            className={styles.leaveButton}
            onClick={onLeave}
            title="Leave meeting"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
