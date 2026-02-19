import "server-only";
// =============================================================================
// Server-side Verification
// =============================================================================

export {
  verifyTurnstile,
  getClientIp,
  getTurnstileErrorDescription,
  isSuccessfulVerifyResponse,
} from "./utils/verifyTurnstile";

export type {
  // Verification response types
  SuccessfulVerifyResponse,
  FailedVerifyResponse,
  // Verification options and error codes
  VerifyOptions,
  TurnstileErrorCode,
} from "./utils/verifyTurnstile";