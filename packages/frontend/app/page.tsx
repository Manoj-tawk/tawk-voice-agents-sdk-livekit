"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, GlassInput } from "@/components/modern";
import styles from "./page.module.css";
import "@/styles/design-tokens.css";
import "@/styles/modern-globals.css";

export default function ModernLandingPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");

  const startMeeting = () => {
    // Generate random room ID
    const roomId = Math.random().toString(36).substring(2, 11);
    router.push(`/meet/rooms/${roomId}`);
  };

  const joinMeeting = () => {
    if (roomCode.trim()) {
      router.push(`/meet/rooms/${roomCode.trim()}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && roomCode.trim()) {
      joinMeeting();
    }
  };

  return (
    <main className={styles.container}>
      {/* Animated Background */}
      <div className={styles.background}>
        <div className={styles.gradientOrb1} />
        <div className={styles.gradientOrb2} />
        <div className={styles.gradientOrb3} />
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            className={styles.logoIcon}
          >
            <circle cx="16" cy="16" r="14" stroke="#FFFFFF" strokeWidth="2" />
            <path
              d="M16 8v16M8 16h16"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className={styles.logoText}>Tawk Meet</span>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" size="sm">
            Login
          </Button>
          <Button variant="secondary" size="sm">
            Sign Up
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            <span className={styles.gradientText}>Enterprise-Grade</span>
            <br />
            Video Conferencing
            <br />
            with AI Voice Agent
          </h1>
          <p className={styles.subtitle}>
            Professional video meetings powered by intelligent voice agents.
            Secure, reliable, and built for business.
          </p>

          {/* Main CTA */}
          <div className={styles.ctaContainer}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={startMeeting}
              icon={
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
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <circle cx="9" cy="10" r="1" />
                  <circle cx="15" cy="10" r="1" />
                  <path d="M9 14a5 5 0 0 0 6 0" />
                </svg>
              }
            >
              New Meeting
            </Button>

            <div className={styles.divider}>
              <span>or</span>
            </div>

            <div className={styles.joinContainer}>
              <GlassInput
                placeholder="Enter meeting code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                onKeyPress={handleKeyPress}
                icon={
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                }
              />
              <Button
                variant="secondary"
                onClick={joinMeeting}
                disabled={!roomCode.trim()}
              >
                Join Meeting
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>✨</span>
              <span>Live Transcription</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🎯</span>
              <span>Meeting Summaries</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🤖</span>
              <span>Voice Agent Support</span>
            </div>
          </div>

          {/* Voice Agent Link */}
          <div className={styles.voiceAssistantLink}>
            <a href="/voice-assistant">Voice Agent Demo →</a>
          </div>
        </div>
      </div>
    </main>
  );
}
