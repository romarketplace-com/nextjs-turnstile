/**
 * Debug logging utilities for Turnstile.
 * Provides a centralized way to handle development-only logging,
 * ensuring logs are completely tree-shaken in production builds.
 */

/**
 * Logs a message to the console in development mode only.
 * In production, this function is completely eliminated via tree-shaking.
 *
 * @param message - The log message
 * @param args - Additional arguments to pass to console.log
 *
 * @example
 * ```ts
 * debugLog("[Turnstile] Widget rendered");
 * debugLog("Current state:", { isReady: true });
 * ```
 */
export function debugLog(message: string, ...args: unknown[]): void {
	if (process.env.NODE_ENV === "development") {
		console.log(message, ...args);
	}
}

/**
 * Logs a warning to the console in development mode only.
 * In production, this function is completely eliminated via tree-shaking.
 *
 * @param message - The warning message
 * @param args - Additional arguments to pass to console.warn
 */
export function debugWarn(message: string, ...args: unknown[]): void {
	if (process.env.NODE_ENV === "development") {
		console.warn(message, ...args);
	}
}
