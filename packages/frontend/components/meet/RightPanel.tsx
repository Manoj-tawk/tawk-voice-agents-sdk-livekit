"use client";

import React, { useState, useEffect } from "react";
import { Room, ParticipantKind } from "livekit-client";
import { useParticipants } from "@livekit/components-react";
import styles from "./RightPanel.module.css";

interface RightPanelProps {
  room: Room;
  activePanel: "people" | "chat";
  onClose: () => void;
}

export function RightPanel({ room, activePanel, onClose }: RightPanelProps) {
  const participants = useParticipants();
  const [messages, setMessages] = useState<
    Array<{ sender: string; text: string; time: string }>
  >([]);
  const [messageInput, setMessageInput] = useState("");

  // Register text stream handler for transcriptions
  useEffect(() => {
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
          const participant = room.remoteParticipants.get(
            participantInfo.identity,
          );
          if (participant) {
            const timestamp = new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            setMessages((prev) => [
              ...prev,
              {
                sender: participant.name || participant.identity,
                text: message,
                time: timestamp,
              },
            ]);
          }
        }
      } catch (error) {
        console.warn("Error reading transcription stream:", error);
      }
    };

    try {
      room.registerTextStreamHandler("lk.transcription", handleTranscription);
    } catch (error) {
      console.warn("Failed to register transcription handler:", error);
    }

    return () => {
      try {
        room.unregisterTextStreamHandler("lk.transcription");
      } catch {
        // Ignore errors during cleanup
      }
    };
  }, [room]);

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
          {activePanel === "people" ? "People" : "Chat"}
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
                  <span className={styles.agentTag}>AI Agent</span>
                )}
              </div>
            </div>
          ))}
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
