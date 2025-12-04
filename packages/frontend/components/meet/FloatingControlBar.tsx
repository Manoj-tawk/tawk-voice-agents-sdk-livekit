"use client";

import React, { useState } from "react";
import { Track } from "livekit-client";
import {
  useLocalParticipant,
  useMediaDeviceSelect,
  useTrackToggle,
  useMaybeRoomContext,
} from "@livekit/components-react";
import styles from "./FloatingControlBar.module.css";

interface FloatingControlBarProps {
  onLeave: () => void;
  onPeopleToggle: () => void;
  onChatToggle: () => void;
  onSettingsToggle: () => void;
  onTranscriptToggle: () => void;
  isPeopleOpen: boolean;
  isChatOpen: boolean;
  isSettingsOpen: boolean;
  isTranscriptOpen: boolean;
  isVisible: boolean;
}

export function FloatingControlBar({
  onLeave,
  onPeopleToggle,
  onChatToggle,
  onSettingsToggle,
  onTranscriptToggle,
  isPeopleOpen,
  isChatOpen,
  isSettingsOpen,
  isTranscriptOpen,
  isVisible,
}: FloatingControlBarProps) {
  const room = useMaybeRoomContext();
  const { microphoneTrack, cameraTrack } = useLocalParticipant();

  const {
    toggle: toggleMic,
    enabled: micEnabled,
    pending: micPending,
  } = useTrackToggle({ source: Track.Source.Microphone });

  const {
    toggle: toggleCamera,
    enabled: cameraEnabled,
    pending: cameraPending,
  } = useTrackToggle({ source: Track.Source.Camera });

  const {
    toggle: toggleScreenShare,
    enabled: screenShareEnabled,
    pending: screenSharePending,
  } = useTrackToggle({ source: Track.Source.ScreenShare });

  // Device selection hooks
  const {
    devices: microphones,
    activeDeviceId: activeMicId,
    setActiveMediaDevice: setActiveMic,
  } = useMediaDeviceSelect({
    kind: "audioinput",
    room,
    track: microphoneTrack,
  });

  const {
    devices: cameras,
    activeDeviceId: activeCameraId,
    setActiveMediaDevice: setActiveCamera,
  } = useMediaDeviceSelect({
    kind: "videoinput",
    room,
    track: cameraTrack,
  });

  const [showMicMenu, setShowMicMenu] = useState(false);
  const [showCameraMenu, setShowCameraMenu] = useState(false);

  return (
    <div className={`${styles.container} ${!isVisible ? styles.hidden : ""}`}>
      <div className={styles.controlBar}>
        {/* Left Side - Media Controls with Menus */}
        <div className={styles.section}>
          {/* Microphone with Device Menu */}
          <div className={styles.controlGroup}>
            <button
              className={`${styles.button} ${!micEnabled ? styles.disabled : ""}`}
              onClick={() => toggleMic()}
              disabled={micPending}
              title={micEnabled ? "Mute" : "Unmute"}
            >
              {micEnabled ? (
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
            {microphones.length > 1 && (
              <>
                <button
                  className={styles.menuButton}
                  onClick={() => setShowMicMenu(!showMicMenu)}
                  title="Select microphone"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="currentColor"
                  >
                    <path d="M6 9l-4-4h8z" />
                  </svg>
                </button>
                {showMicMenu && (
                  <div className={styles.deviceMenu}>
                    {microphones.map((device) => (
                      <button
                        key={device.deviceId}
                        className={`${styles.deviceItem} ${
                          device.deviceId === activeMicId ? styles.active : ""
                        }`}
                        onClick={() => {
                          setActiveMic(device.deviceId);
                          setShowMicMenu(false);
                        }}
                      >
                        {device.label || "Unknown Device"}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Camera with Device Menu */}
          <div className={styles.controlGroup}>
            <button
              className={`${styles.button} ${!cameraEnabled ? styles.disabled : ""}`}
              onClick={() => toggleCamera()}
              disabled={cameraPending}
              title={cameraEnabled ? "Turn off camera" : "Turn on camera"}
            >
              {cameraEnabled ? (
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
            {cameras.length > 1 && (
              <>
                <button
                  className={styles.menuButton}
                  onClick={() => setShowCameraMenu(!showCameraMenu)}
                  title="Select camera"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="currentColor"
                  >
                    <path d="M6 9l-4-4h8z" />
                  </svg>
                </button>
                {showCameraMenu && (
                  <div className={styles.deviceMenu}>
                    {cameras.map((device) => (
                      <button
                        key={device.deviceId}
                        className={`${styles.deviceItem} ${
                          device.deviceId === activeCameraId
                            ? styles.active
                            : ""
                        }`}
                        onClick={() => {
                          setActiveCamera(device.deviceId);
                          setShowCameraMenu(false);
                        }}
                      >
                        {device.label || "Unknown Device"}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Screen Share */}
          <button
            className={`${styles.button} ${screenShareEnabled ? styles.active : ""}`}
            onClick={() => toggleScreenShare()}
            disabled={screenSharePending}
            title={screenShareEnabled ? "Stop sharing" : "Share screen"}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
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

          <button
            className={`${styles.button} ${isTranscriptOpen ? styles.active : ""}`}
            onClick={onTranscriptToggle}
            title="Transcript"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </button>

          <button
            className={`${styles.button} ${isSettingsOpen ? styles.active : ""}`}
            onClick={onSettingsToggle}
            title="Settings"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6M5.636 5.636l4.243 4.243m4.242 4.242l4.243 4.243M1 12h6m6 0h6M5.636 18.364l4.243-4.243m4.242-4.242l4.243-4.243" />
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
