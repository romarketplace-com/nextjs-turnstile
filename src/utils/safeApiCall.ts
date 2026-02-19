/**
 * Generic wrapper for safe API calls with centralized error handling.
 * Reduces code duplication for Turnstile API method invocations.
 */

import { TurnstileAPI, WidgetRef } from "../types";
import { debugWarn } from "./debug";

/**
 * Safely calls a Turnstile API method with error handling and debugging.
 * Returns early if the API is not available (e.g., script not loaded).
 *
 * @param apiMethod - The name of the method to call (for debugging)
 * @param fn - Callback function that receives the Turnstile API object and widget ref
 * @param widgetRef - Optional widget reference (usually from a ref)
 *
 * @example
 * ```ts
 * safeApiCall("reset", (api) => {
 *   api.reset(widgetId);
 * });
 * ```
 */
export function safeApiCall(
  apiMethod: string,
  fn: (api: TurnstileAPI) => void,
  widgetRef?: WidgetRef
): void {
  const turnstile = getTurnstile();
  if (!turnstile) {
    return;
  }

  try {
    fn(turnstile);
  } catch (error) {
    debugWarn(`[Turnstile] ${apiMethod} failed:`, error);
  }
}

/**
 * Gets the Turnstile API object from the global window scope.
 * Returns undefined if the script hasn't been loaded yet.
 *
 * @internal
 */
function getTurnstile(): TurnstileAPI | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return (window as any).turnstile as TurnstileAPI | undefined;
}
