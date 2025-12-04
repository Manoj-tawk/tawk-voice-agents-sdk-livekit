export interface AppConfig {
  pageTitle: string;
  pageDescription: string;
  companyName: string;

  supportsChatInput: boolean;
  supportsVideoInput: boolean;
  supportsScreenShare: boolean;
  isPreConnectBufferEnabled: boolean;

  logo: string;
  startButtonText: string;
  accent?: string;
  logoDark?: string;
  accentDark?: string;

  // for LiveKit Cloud Sandbox
  sandboxId?: string;
  agentName?: string;
}

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: "tawk.to",
  pageTitle: "tawk.to Voice Agent",
  pageDescription: "AI-powered voice agent by tawk.to",

  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: true,
  isPreConnectBufferEnabled: true,

  logo: "/lk-logo.svg",
  accent: "#1DB954" /* Spotify Green */,
  logoDark: "/lk-logo-dark.svg",
  accentDark: "#1ED760" /* Lighter Spotify Green */,
  startButtonText: "Start Session",

  // for LiveKit Cloud Sandbox
  sandboxId: undefined,
  agentName: "Quinn_353", // Default agent name - must match backend ServerOptions.agentName
};
