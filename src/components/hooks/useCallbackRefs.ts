/**
 * Custom hook for managing multiple callback refs.
 * Consolidates the pattern of storing callbacks in refs and updating them
 * in a useLayoutEffect to prevent widget re-creation when callback props change.
 */

import { useLayoutEffect, useRef } from "react";

/**
 * Manages multiple callback refs with synchronized updates.
 *
 * This hook reduces boilerplate when you need to:
 * 1. Store multiple callbacks in refs (to avoid dependency array issues)
 * 2. Update all refs synchronously in a useLayoutEffect
 *
 * Supports optional callbacks - pass undefined for callbacks that aren't being used.
 *
 * @param callbacks - Object where keys are callback names and values are the callback functions (can be undefined)
 * @returns Object with the same keys containing refs to the callbacks
 *
 * @example
 * ```tsx
 * const { onSuccess, onError, onExpire } = useCallbackRefs({
 *   onSuccess,
 *   onError,
 *   onExpire,
 * });
 *
 * // Use in rendering:
 * const options = {
 *   callbacks: {
 *     callback: () => onSuccess.current?.(),
 *     "error-callback": () => onError.current?.(),
 *   }
 * };
 * ```
 */
export function useCallbackRefs<T extends Record<string, unknown>>(
  callbacks: T
): { [K in keyof T]: React.MutableRefObject<T[K] | undefined> } {
  // Create refs for each callback, initialized from the callbacks object
  const refsObject = useRef<{ [K in keyof T]: React.MutableRefObject<T[K] | undefined> }>(
    Object.keys(callbacks).reduce(
      (acc, key) => {
        acc[key as keyof T] = useRef<T[keyof T] | undefined>(callbacks[key as keyof T] as any);
        return acc;
      },
      {} as { [K in keyof T]: React.MutableRefObject<T[K] | undefined> }
    )
  ).current;

  // Update all refs when callbacks change
  useLayoutEffect(() => {
    Object.keys(callbacks).forEach((key) => {
      refsObject[key as keyof T].current = callbacks[key as keyof T] as any;
    });
  });

  return refsObject;
}
