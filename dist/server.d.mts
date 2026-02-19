/** Cloudflare Turnstile error codes */
type TurnstileErrorCode = "missing-input-secret" | "invalid-input-secret" | "missing-input-response" | "invalid-input-response" | "bad-request" | "timeout-or-duplicate" | "internal-error" | "invalid-token-format" | "token-too-long" | "action-mismatch" | "hostname-mismatch" | "token-too-old" | "validation-timeout";
/** Options for verifying a Turnstile token. */
interface VerifyOptions {
    /** Override default secret key (falls back to `TURNSTILE_SECRET_KEY`). */
    secretKey?: string;
    /** Provide IP manually – otherwise we attempt to auto‑detect via `getClientIp()`. */
    ip?: string;
    /** Optional headers fallback when running in pages router API routes. */
    headers?: Record<string, string | string[] | undefined> | Headers;
    /** Expected Action (e.g. "login", "signup", etc.). */
    action?: string;
    /** Expected Hostname (e.g. "example.com"). */
    hostname?: string;
    /** Timeout in milliseconds */
    timeout?: number;
    /** UUID for retry protection (idempotency key). Recommended for production. */
    idempotencyKey?: string;
    /** Maximum token age in seconds. Defaults to 300 (5 minutes). */
    maxTokenAge?: number;
    /** If true, returns full validation response. Otherwise returns only success boolean. */
    returnFullResponse?: boolean;
}
type SuccessfulVerifyResponse = {
    success: true;
    challenge_ts: string;
    hostname: string;
    "error-codes": never[];
    action: string;
    cdata: string;
    metadata: Record<string, string>;
};
type FailedVerifyResponse = {
    success: false;
    "error-codes": TurnstileErrorCode[];
};
/**
 * Type guard to check if a response is a SuccessfulVerifyResponse.
 * Provides safe type narrowing without unsafe casting.
 *
 * @param response - The response to check
 * @returns true if the response is a successful verification
 *
 * @example
 * ```ts
 * const response = await verifyTurnstile(token, { returnFullResponse: true });
 * if (isSuccessfulVerifyResponse(response)) {
 *   console.log("Verified at:", response.challenge_ts);
 * }
 * ```
 */
declare function isSuccessfulVerifyResponse(response: SuccessfulVerifyResponse | FailedVerifyResponse | boolean): response is SuccessfulVerifyResponse;
/**
 * Verifies a Cloudflare Turnstile token on the server.
 *
 * Follows Cloudflare security best practices:
 * - Validates token format and length (max 2048 characters)
 * - Optional action and hostname validation
 * - Optional token age validation
 * - Optional idempotency key for retry protection
 *
 * ```ts
 * const result = await verifyTurnstile(token);
 * if (!result.success) throw new Error("Captcha failed");
 * ```
 *
 * @param token   - The token returned by the widget.
 * @param options - Optional configuration and security settings.
 * @returns Boolean (by default) or full verification response if `returnFullResponse` is true.
 */
declare function verifyTurnstile(token: string, options?: VerifyOptions): Promise<boolean | SuccessfulVerifyResponse | FailedVerifyResponse>;
declare function getClientIp(initHeaders?: Record<string, string | string[] | undefined> | Headers): Promise<string | undefined>;
/**
 * Gets a human-readable description for a Turnstile error code.
 * Useful for logging and debugging.
 *
 * @param errorCode - The error code to get a description for
 * @returns A human-readable description of the error
 */
declare function getTurnstileErrorDescription(errorCode: TurnstileErrorCode): string;

export { type FailedVerifyResponse, type SuccessfulVerifyResponse, type TurnstileErrorCode, type VerifyOptions, getClientIp, getTurnstileErrorDescription, isSuccessfulVerifyResponse, verifyTurnstile };
