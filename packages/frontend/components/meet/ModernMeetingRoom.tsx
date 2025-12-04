"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Room, Participant, ParticipantKind } from "livekit-client";
import { RoomContext } from "@livekit/components-react";
import { FloatingControlBar } from "./FloatingControlBar";
import { ParticipantGrid } from "./ParticipantGrid";
import { RightPanel } from "./RightPanel";
import styles from "./ModernMeetingRoom.module.css";

export interface TranscriptEntry {
  participantIdentity: string;
  participantName: string;
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

export interface ActiveCaption {
  participantIdentity: string;
  text: string;
  timestamp: Date;
}

interface ModernMeetingRoomProps {
  room: Room;
  onLeave: () => void;
}

export function ModernMeetingRoom({ room, onLeave }: ModernMeetingRoomProps) {
  const [isPeopleOpen, setIsPeopleOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [hideControlsTimeout, setHideControlsTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Transcription state
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [activeCaptions, setActiveCaptions] = useState<
    Map<string, ActiveCaption>
  >(new Map());

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

  // Handle transcription messages
  const handleTranscription = useCallback(
    async (
      reader: {
        readAll: () => Promise<string>;
        info: { attributes?: Record<string, string> };
      },
      participantInfo: { identity: string },
    ) => {
      try {
        const text = await reader.readAll();
        
        // Check if this is a transcription (vs other text stream)
        const isTranscription =
          reader.info.attributes?.["lk.transcribed_track_id"] != null;
        
        if (!isTranscription || !text.trim()) {
          return; // Ignore non-transcription text streams or empty text
        }

        // Check if this is a final transcription
        const isFinal =
          reader.info.attributes?.["lk.transcription_final"] === "true";
        
        // Get segment ID to track interim vs final
        const segmentId = reader.info.attributes?.["lk.segment_id"];

        // Get participant info - check both local and remote participants
        let participant: Participant | undefined =
          room.localParticipant.identity === participantInfo.identity
            ? room.localParticipant
            : room.remoteParticipants.get(participantInfo.identity);

        // If still not found, try to get any agent participant
        if (!participant) {
          const allParticipants = Array.from(room.remoteParticipants.values());
          participant = allParticipants.find(
            (p) => p.kind === ParticipantKind.AGENT,
          );
        }

        if (!participant) {
          console.warn(`Participant not found for identity: ${participantInfo.identity}`);
          return;
        }

        // Check if this is an agent - agent TTS should always be treated as final
        const isAgent = participant.kind === ParticipantKind.AGENT;
        const shouldAddToHistory = isFinal || isAgent;

        console.log(`[Transcription] ${participant.name || participant.identity}: "${text}" (final: ${isFinal}, isAgent: ${isAgent}, segment: ${segmentId})`);

        const entry: TranscriptEntry = {
          participantIdentity: participant.identity,
          participantName: participant.name || participant.identity,
          text,
          timestamp: new Date(),
          isFinal: shouldAddToHistory, // Mark as final if agent or actually final
        };

        if (shouldAddToHistory) {
          // Add to transcript history for final transcriptions or all agent messages
          setTranscripts((prev) => {
            // For agents, replace the last entry if it's from the same segment
            if (isAgent && segmentId) {
              const existingIndex = prev.findIndex(
                (t) => t.participantIdentity === participant.identity && 
                       Math.abs(t.timestamp.getTime() - entry.timestamp.getTime()) < 5000
              );
              if (existingIndex > -1) {
                const newArr = [...prev];
                newArr[existingIndex] = entry;
                return newArr;
              }
            }
            return [...prev, entry];
          });

          // Remove from active captions after delay
          setTimeout(() => {
            setActiveCaptions((prev) => {
              const next = new Map(prev);
              next.delete(participant.identity);
              return next;
            });
          }, 3000);
        }

        // Update active captions (for both interim and final)
        // This creates the "flowing" effect
        setActiveCaptions((prev) => {
          const next = new Map(prev);
          next.set(participant.identity, {
            participantIdentity: participant.identity,
            text,
            timestamp: new Date(),
          });
          return next;
        });
      } catch (error) {
        console.warn("Error reading transcription stream:", error);
      }
    },
    [room],
  );

  // Register transcription handler
  useEffect(() => {
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
  }, [room, handleTranscription]);

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
          <ParticipantGrid activeCaptions={activeCaptions} />
        </div>

        {/* Right Panel */}
        {(isPeopleOpen || isChatOpen || isSettingsOpen || isTranscriptOpen) && (
          <RightPanel
            room={room}
            activePanel={
              isPeopleOpen
                ? "people"
                : isChatOpen
                  ? "chat"
                  : isTranscriptOpen
                    ? "transcript"
                    : "settings"
            }
            transcripts={transcripts}
            onClose={() => {
              setIsPeopleOpen(false);
              setIsChatOpen(false);
              setIsSettingsOpen(false);
              setIsTranscriptOpen(false);
            }}
          />
        )}

        {/* Floating Control Bar */}
        <FloatingControlBar
          onLeave={onLeave}
          onPeopleToggle={() => {
            setIsPeopleOpen(!isPeopleOpen);
            setIsChatOpen(false);
            setIsSettingsOpen(false);
            setIsTranscriptOpen(false);
          }}
          onChatToggle={() => {
            setIsChatOpen(!isChatOpen);
            setIsPeopleOpen(false);
            setIsSettingsOpen(false);
            setIsTranscriptOpen(false);
          }}
          onSettingsToggle={() => {
            setIsSettingsOpen(!isSettingsOpen);
            setIsPeopleOpen(false);
            setIsChatOpen(false);
            setIsTranscriptOpen(false);
          }}
          onTranscriptToggle={() => {
            setIsTranscriptOpen(!isTranscriptOpen);
            setIsPeopleOpen(false);
            setIsChatOpen(false);
            setIsSettingsOpen(false);
          }}
          isPeopleOpen={isPeopleOpen}
          isChatOpen={isChatOpen}
          isSettingsOpen={isSettingsOpen}
          isTranscriptOpen={isTranscriptOpen}
          isVisible={isControlsVisible}
        />
      </div>
    </RoomContext.Provider>
  );
}
