// General‑purpose helpers for interacting with Cloudflare Turnstile.
// These helpers expose imperative control & query functions for widgets.
// Safe to import from Node contexts (SSR) – every function no‑ops if
// `window` or `turnstile` are unavailable.

// Shared registries for preventing duplicate IDs across all Turnstile components
export const usedContainerIds = new Set<string>();
export const usedResponseFieldNames = new Set<string>();

// ──────────────────────────────────────────────────────────────────────────
// Types & ambient declaration
// --------------------------------------------------------------------------

/** Union of the values users can pass when referring to a widget. */
export type WidgetRef = string | number | HTMLElement;

/** Minimal subset of Cloudflare's Turnstile API used by the helpers. */
interface TurnstileAPI {
  render(host: WidgetRef, cfg?: Record<string, unknown>): string | number;
  reset(widget?: WidgetRef): void;
  remove(widget?: WidgetRef): void;
  getResponse(widget?: WidgetRef): string | null;
}

declare global {
  interface Window {
    turnstile?: TurnstileAPI;
  }
}

/**
 * Dynamically loads the Cloudflare Turnstile script in either *implicit* or
 * *explicit* mode. A cached Promise is used so each mode loads at most once.
 *
 * @example
 *   await loadTurnstileScript()        // implicit (default)
 *   await loadTurnstileScript('explicit')
 */
export function loadTurnstileScript(
  mode: 'implicit' | 'explicit' = 'implicit',
): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve(); // SSR guard

  const cacheKey = `__turnstile_promise_${mode}`;
  if ((window as any)[cacheKey]) {
    return (window as any)[cacheKey];
  }

  (window as any)[cacheKey] = new Promise<void>((resolve, reject) => {
    const srcBase = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    
    if (document.querySelector(`script[src^="${srcBase}"]`)) {
      // A script is already loaded or loading. We can't add another.
      // The best we can do is poll for window.turnstile to become available.
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
      return;
    }
    
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Turnstile script failed to load'));
    
    if (mode === 'explicit') {
      // For explicit rendering, we use the onload callback to know when the script is ready.
      const onloadCallbackName = `__cfTurnstileOnload_${Math.random().toString(36).slice(2)}`;
      script.src = `${srcBase}?render=explicit&onload=${onloadCallbackName}`;
      (window as any)[onloadCallbackName] = () => {
        resolve();
        delete (window as any)[onloadCallbackName];
      };
    } else { // implicit
      script.src = srcBase;
      script.onload = () => resolve();
    }
    
    document.head.appendChild(script);
  });

  return (window as any)[cacheKey];
}

/**
 * Returns **true** once `window.turnstile` is available.
 */
export function isTurnstileLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.turnstile !== 'undefined';
}

/**
 * Resets a widget by ID / selector so the user can solve it again.
 * No‑ops silently on server or if Turnstile isn't loaded.
 */
export function resetTurnstile(widget?: WidgetRef): void {
  if (!isTurnstileLoaded()) return;
  try {
    window.turnstile!.reset(widget);
  } catch {
    /* silent */
  }
}

/**
 * Ensures a widget is rendered
 *
 * Implementation notes:
 *  • Cloudflare exposes no standalone `execute()` API like reCAPTCHA. The
 *    closest is implicit execution: the widget renders automatically on
 *    elements with `.cf‑turnstile`.  To mimic a user's expectation of
 *    "execute", we attempt to read the response.  If `turnstile.getResponse`
 *    throws (widget not found) **or** returns an empty string, we *render*
 *    the widget in place and then return `null` so callers can wait for the
 *    normal `callback` to fire.
 *
 * @param widget   CSS selector, numeric widgetId, or host element.
 * @returns        Current response token, or `null` if none.
 */
export function executeTurnstile(widget: WidgetRef): void {
  if (!isTurnstileLoaded()) return;
  let resp;
  try {
    // Call to see respond back
    resp = window.turnstile!.getResponse(widget);
  } catch (err: any) {
    // Then render the widget
    window.turnstile!.render(widget);
  }
}

/**
 * Returns the current CAPTCHA token for a widget, or **null** if unavailable.
 * Wrapper is SSR‑safe and suppresses Turnstile errors.
 */
export function getTurnstileResponse(widget: WidgetRef): string | null {
  if (!isTurnstileLoaded()) return null;
  try {
    return window.turnstile!.getResponse(widget) || null;
  } catch (err) {
    console.error('Turnstile getResponse error:', err);
    return null;
  }
}

/** Removes (destroys) the widget and its iframe. */
export function removeTurnstile(ref: WidgetRef): void {
  if (!isTurnstileLoaded()) return;
  try {
    window.turnstile!.remove(ref);
  } catch {/* swallow */}
}