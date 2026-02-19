"use client";

// =============================================================================
// Component
// =============================================================================

export { default as Turnstile } from "./components/Turnstile";

// =============================================================================
// Component Types
// =============================================================================

export type {
  TurnstileProps,
  TurnstileRef,
  TurnstileSize,
  TurnstileTheme,
  TurnstileAppearance,
  TurnstileExecution,
  TurnstileRefreshBehavior,
  TurnstileRetry,
} from "./components/Turnstile";

// =============================================================================
// Client-side Utilities
// =============================================================================

export {
  // Script loading
  loadTurnstileScript,
  isTurnstileLoaded,

  // Widget control
  resetTurnstile,
  removeTurnstile,
  getTurnstileResponse,
  executeTurnstile,
  isTokenExpired,
  renderTurnstile,
} from "./utils";

export type { WidgetRef } from "./types";
