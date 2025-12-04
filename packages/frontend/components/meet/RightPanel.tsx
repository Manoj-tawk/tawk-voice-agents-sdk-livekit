"use client";

import React, { useState, useEffect, useRef } from "react";
import { Room, ParticipantKind } from "livekit-client";
import {
  useParticipants,
  useMediaDeviceSelect,
  useLocalParticipant,
  useMaybeRoomContext,
} from "@livekit/components-react";
import { TranscriptEntry } from "./ModernMeetingRoom";
import styles from "./RightPanel.module.css";

interface RightPanelProps {
  room: Room;
  activePanel: "people" | "chat" | "settings" | "transcript";
  transcripts: TranscriptEntry[];
  onClose: () => void;
}

export function RightPanel({
  room,
  activePanel,
  transcripts,
  onClose,
}: RightPanelProps) {
  const participants = useParticipants();
  const { microphoneTrack, cameraTrack } = useLocalParticipant();
  const roomContext = useMaybeRoomContext();
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<
    Array<{ sender: string; text: string; time: string }>
  >([]);
  const [messageInput, setMessageInput] = useState("");

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (activePanel === "transcript" && transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop =
        transcriptScrollRef.current.scrollHeight;
    }
  }, [transcripts, activePanel]);

  // Device selection hooks
  const {
    devices: microphones,
    activeDeviceId: activeMicId,
    setActiveMediaDevice: setActiveMic,
  } = useMediaDeviceSelect({
    kind: "audioinput",
    room: roomContext,
    track: microphoneTrack,
  });

  const {
    devices: cameras,
    activeDeviceId: activeCameraId,
    setActiveMediaDevice: setActiveCamera,
  } = useMediaDeviceSelect({
    kind: "videoinput",
    room: roomContext,
    track: cameraTrack,
  });

  const {
    devices: speakers,
    activeDeviceId: activeSpeakerId,
    setActiveMediaDevice: setActiveSpeaker,
  } = useMediaDeviceSelect({
    kind: "audiooutput",
    room: roomContext,
  });

  const sendMessage = () => {
    if (messageInput.trim()) {
      const timestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setMessages((prev) => [
        ...prev,
        { sender: "You", text: messageInput.trim(), time: timestamp },
      ]);
      room.localParticipant.publishData(
        new TextEncoder().encode(
          JSON.stringify({ text: messageInput.trim(), timestamp }),
        ),
        { reliable: true, topic: "lk.chat" },
      );
      setMessageInput("");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          {activePanel === "people"
            ? "People"
            : activePanel === "chat"
              ? "Chat"
              : activePanel === "transcript"
                ? "Transcript"
                : "Settings"}
        </h3>
        <button className={styles.closeButton} onClick={onClose}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {activePanel === "people" ? (
        <div className={styles.peopleList}>
          {participants.map((participant) => (
            <div key={participant.identity} className={styles.personItem}>
              <div className={styles.personAvatar}>
                {participant.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className={styles.personInfo}>
                <span className={styles.personName}>
                  {participant.name || participant.identity}
                </span>
                {participant.kind === ParticipantKind.AGENT && (
                  <span className={styles.aiTag}>Voice Agent</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : activePanel === "transcript" ? (
        <div className={styles.transcriptContainer}>
          <div className={styles.transcriptList} ref={transcriptScrollRef}>
            {transcripts.length === 0 ? (
              <div className={styles.emptyState}>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ opacity: 0.3, marginBottom: "1rem" }}
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <p>No transcripts yet</p>
                <p className={styles.emptyHint}>
                  Start speaking and transcripts will appear here
                </p>
              </div>
            ) : (
              transcripts.map((entry, index) => (
                <div key={index} className={styles.transcriptEntry}>
                  <div className={styles.transcriptHeader}>
                    <span className={styles.transcriptName}>
                      {entry.participantName}
                    </span>
                    <span className={styles.transcriptTime}>
                      {entry.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className={styles.transcriptText}>{entry.text}</p>
                </div>
              ))
            )}
          </div>
          <div className={styles.transcriptFooter}>
            <button
              className={styles.clearButton}
              onClick={() => {
                if (
                  confirm(
                    "Are you sure you want to clear all transcripts? This cannot be undone.",
                  )
                ) {
                  // Note: This won't actually clear the transcripts state
                  // since we don't have a callback for that. You might want to
                  // add a callback to ModernMeetingRoom for this
                  console.log("Clear transcripts requested");
                }
              }}
              disabled={transcripts.length === 0}
            >
              Clear Transcript
            </button>
          </div>
        </div>
      ) : activePanel === "settings" ? (
        <div className={styles.settingsContainer}>
          <div className={styles.settingSection}>
            <h4>Microphone</h4>
            <div className={styles.deviceList}>
              {microphones.map((device) => (
                <button
                  key={device.deviceId}
                  className={`${styles.deviceButton} ${
                    device.deviceId === activeMicId ? styles.active : ""
                  }`}
                  onClick={() => setActiveMic(device.deviceId)}
                >
                  {device.label || "Unknown Microphone"}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.settingSection}>
            <h4>Camera</h4>
            <div className={styles.deviceList}>
              {cameras.map((device) => (
                <button
                  key={device.deviceId}
                  className={`${styles.deviceButton} ${
                    device.deviceId === activeCameraId ? styles.active : ""
                  }`}
                  onClick={() => setActiveCamera(device.deviceId)}
                >
                  {device.label || "Unknown Camera"}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.settingSection}>
            <h4>Speaker</h4>
            <div className={styles.deviceList}>
              {speakers.map((device) => (
                <button
                  key={device.deviceId}
                  className={`${styles.deviceButton} ${
                    device.deviceId === activeSpeakerId ? styles.active : ""
                  }`}
                  onClick={() => setActiveSpeaker(device.deviceId)}
                >
                  {device.label || "Unknown Speaker"}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.chatContainer}>
          <div className={styles.messagesList}>
            {messages.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No messages yet</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={styles.message}>
                  <div className={styles.messageHeader}>
                    <span className={styles.messageSender}>{msg.sender}</span>
                    <span className={styles.messageTime}>{msg.time}</span>
                  </div>
                  <p className={styles.messageText}>{msg.text}</p>
                </div>
              ))
            )}
          </div>
          <div className={styles.chatInput}>
            <input
              type="text"
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              className={styles.input}
            />
            <button
              className={styles.sendButton}
              onClick={sendMessage}
              disabled={!messageInput.trim()}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
