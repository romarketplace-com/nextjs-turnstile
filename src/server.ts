import "server-only";

// =============================================================================
// Server-side Verification
// =============================================================================

export type {
	FailedVerifyResponse,
	// Verification response types
	SuccessfulVerifyResponse,
	TurnstileErrorCode,
	// Verification options and error codes
	VerifyOptions,
} from "./utils/verifyTurnstile";
export {
	getClientIp,
	getTurnstileErrorDescription,
	isSuccessfulVerifyResponse,
	verifyTurnstile,
} from "./utils/verifyTurnstile";
