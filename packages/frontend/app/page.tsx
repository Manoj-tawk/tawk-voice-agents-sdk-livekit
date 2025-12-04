"use client";

import "@livekit/components-styles";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  encodePassphrase,
  generateRoomId,
  randomString,
} from "@/lib/meet/client-utils";

function DemoMeetingTab() {
  const router = useRouter();
  const [e2ee, setE2ee] = useState(false);
  const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64));
  const startMeeting = () => {
    if (e2ee) {
      router.push(
        `/meet/rooms/${generateRoomId()}#${encodePassphrase(sharedPassphrase)}`,
      );
    } else {
      router.push(`/meet/rooms/${generateRoomId()}`);
    }
  };
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <p style={{ margin: 0 }}>
        Start a video meeting with AI agent assistance.
      </p>
      <button
        style={{
          marginTop: "1rem",
          padding: "0.75rem 1.5rem",
          fontSize: "1rem",
        }}
        className="lk-button"
        onClick={startMeeting}
      >
        Start Meeting
      </button>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          <input
            id="use-e2ee"
            type="checkbox"
            checked={e2ee}
            onChange={(ev) => setE2ee(ev.target.checked)}
          />
          <label htmlFor="use-e2ee">Enable end-to-end encryption</label>
        </div>
        {e2ee && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            <label htmlFor="passphrase">Passphrase</label>
            <input
              id="passphrase"
              type="password"
              value={sharedPassphrase}
              onChange={(ev) => setSharedPassphrase(ev.target.value)}
            />
          </div>
        )}
      </div>
      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "8px",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.9rem" }}>
          <a href="/voice-assistant" style={{ color: "#4A9EFF" }}>
            Or try the voice assistant
          </a>
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
        data-lk-theme="default"
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
            LiveKit Meet with AI Agent
          </h1>
          <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.7)" }}>
            Video conferencing with automatic AI agent assistance
          </p>
        </div>
        <DemoMeetingTab />
      </main>
    </>
  );
}
