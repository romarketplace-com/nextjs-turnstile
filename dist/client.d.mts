import * as react from 'react';

/**
 * Size options for the Turnstile widget.
 * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/#widget-sizes
 */
type TurnstileSize = "normal" | "compact" | "flexible";
/**
 * Theme options for the Turnstile widget.
 * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/#theme-options
 */
type TurnstileTheme = "auto" | "light" | "dark";
/**
 * Appearance modes control when the widget becomes visible.
 * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/#appearance-modes
 */
type TurnstileAppearance = "always" | "execute" | "interaction-only";
/**
 * Execution modes control when the challenge runs.
 * - `render`: Challenge runs automatically after render (default)
 * - `execute`: Challenge runs only when `execute()` is called via ref
 * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/#execution-modes
 */
type TurnstileExecution = "render" | "execute";
/**
 * Refresh behavior options.
 * - `auto`: Automatically refresh (default, recommended)
 * - `manual`: User must manually trigger refresh
 * - `never`: Never refresh automatically
 */
type TurnstileRefreshBehavior = "auto" | "manual" | "never";
/**
 * Retry behavior options.
 * - `auto`: Automatically retry on failure (default)
 * - `never`: Never retry, handle manually via error callback
 */
type TurnstileRetry = "auto" | "never";
/**
 * Imperative handle for the Turnstile component.
 * Access via `useRef<TurnstileRef>()` and passing to the component.
 */
interface TurnstileRef {
    /** Resets the widget, allowing the user to solve the challenge again. */
    reset: () => void;
    /** Removes the widget from the page. */
    remove: () => void;
    /** Gets the current response token, or null if not available. */
    getResponse: () => string | null;
    /** Executes the challenge (only needed if `execution="execute"`). */
    execute: () => void;
    /** Returns true if the widget has been rendered and is ready. */
    isReady: () => boolean;
    /** Returns the internal widget ID assigned by Cloudflare. */
    getWidgetId: () => string | undefined;
}
/**
 * Props for the Turnstile component.
 */
interface TurnstileProps {
    /**
     * Your Cloudflare Turnstile site key.
     * Falls back to `process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY` if not provided.
     */
    siteKey?: string;
    /**
     * Widget theme. Defaults to `"auto"` which follows user's color scheme.
     */
    theme?: TurnstileTheme;
    /**
     * Widget size.
     * - `normal`: 300×65px (default)
     * - `compact`: 150×140px
     * - `flexible`: 100% width (min 300px), 65px height
     */
    size?: TurnstileSize;
    /**
     * Controls when the widget becomes visible.
     * - `always`: Always visible (default)
     * - `execute`: Visible only after challenge begins
     * - `interaction-only`: Visible only when user interaction is required
     */
    appearance?: TurnstileAppearance;
    /**
     * Controls when the challenge runs.
     * - `render`: Runs automatically after widget renders (default)
     * - `execute`: Runs only when `execute()` is called via ref
     */
    execution?: TurnstileExecution;
    /**
     * Name for the hidden input field that stores the token.
     * Useful when submitting forms. Defaults to `"cf-turnstile-response"`.
     * Set to `false` to disable the hidden input entirely.
     */
    responseFieldName?: string | false;
    /**
     * How the widget behaves when the token expires (~5 minutes).
     * Defaults to `"auto"` (recommended).
     */
    refreshExpired?: TurnstileRefreshBehavior;
    /**
     * How the widget behaves when an interactive challenge times out.
     * Defaults to `"auto"` (recommended).
     */
    refreshTimeout?: TurnstileRefreshBehavior;
    /**
     * Retry behavior on failure.
     * - `auto`: Automatically retry (default)
     * - `never`: Handle retries manually via `onError` callback
     */
    retry?: TurnstileRetry;
    /**
     * Retry interval in milliseconds when `retry="auto"`.
     * Must be between 0 and 900000. Defaults to 8000 (8 seconds).
     */
    retryInterval?: number;
    /**
     * Custom action identifier for analytics (max 32 alphanumeric chars).
     * Returned during server-side validation.
     */
    action?: string;
    /**
     * Custom data payload (max 255 alphanumeric chars).
     * Returned during server-side validation.
     */
    cData?: string;
    /**
     * Tab index for accessibility. Defaults to 0.
     */
    tabIndex?: number;
    /**
     * ISO 639-1 language code (e.g., "en", "fr", "de").
     * Defaults to `"auto"` which uses the visitor's browser language.
     */
    language?: string;
    /**
     * Additional CSS class for the container div.
     */
    className?: string;
    /**
     * Inline styles for the container div.
     */
    style?: React.CSSProperties;
    /**
     * Called when the challenge is successfully completed.
     * @param token - The verification token to send to your server.
     */
    onSuccess?: (token: string) => void;
    /**
     * Called when an error occurs (e.g., network error, challenge failed).
     *
     * This callback is always treated as "handled" by the widget, which prevents
     * Cloudflare from logging duplicate errors to its backend service.
     *
     * @param errorCode - Optional error code from Cloudflare.
     * @see https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/
     */
    onError?: (errorCode?: string) => void;
    /**
     * Called when the token expires (~5 minutes after issuance).
     * You may want to reset the widget or prompt the user to retry.
     */
    onExpire?: () => void;
    /**
     * Called when an interactive challenge times out without being solved.
     */
    onTimeout?: () => void;
    /**
     * Called before the widget enters interactive mode.
     */
    onBeforeInteractive?: () => void;
    /**
     * Called after the widget leaves interactive mode.
     */
    onAfterInteractive?: () => void;
    /**
     * Called when the visitor's browser is not supported.
     */
    onUnsupported?: () => void;
    /**
     * Called when the widget script has loaded and the widget is ready.
     */
    onLoad?: () => void;
}
/**
 * Cloudflare Turnstile CAPTCHA widget for Next.js applications.
 *
 * Uses explicit rendering mode for reliable lifecycle management in React.
 * Supports all Turnstile configuration options and provides an imperative API
 * via ref for programmatic control.
 *
 * @example
 * ```tsx
 * import { Turnstile, TurnstileRef } from 'nextjs-turnstile';
 *
 * function MyForm() {
 *   const turnstileRef = useRef<TurnstileRef>(null);
 *   const [token, setToken] = useState<string | null>(null);
 *
 *   return (
 *     <form>
 *       <Turnstile
 *         ref={turnstileRef}
 *         siteKey="your-site-key"
 *         onSuccess={setToken}
 *         onError={() => console.error('Turnstile error')}
 *       />
 *       <button
 *         type="button"
 *         onClick={() => turnstileRef.current?.reset()}
 *       >
 *         Reset CAPTCHA
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 *
 * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
 */
declare const Turnstile: react.ForwardRefExoticComponent<TurnstileProps & react.RefAttributes<TurnstileRef>>;

/**
 * Shared type definitions for the Turnstile library.
 * Centralizes all internal types to avoid duplication across modules.
 */
/**
 * Reference to a Turnstile widget.
 * Can be a widget ID (string or number) or a container element.
 */
type WidgetRef = string | number | HTMLElement;
/**
 * Minimal interface for Cloudflare's Turnstile API.
 * This is the global API object injected by the Turnstile script.
 * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
 * @internal
 */
interface TurnstileAPI {
    render(container: WidgetRef, options?: Record<string, unknown>): string | number;
    reset(widgetId?: WidgetRef): void;
    remove(widgetId?: WidgetRef): void;
    getResponse(widgetId?: WidgetRef): string | undefined;
    execute(widgetId?: WidgetRef): void;
    isExpired(widgetId?: WidgetRef): boolean;
}

/**
 * Utility functions for interacting with Cloudflare Turnstile.
 *
 * These helpers provide imperative control over Turnstile widgets.
 * All functions are SSR-safe and will no-op when `window` is undefined.
 *
 * @module
 */

declare global {
    interface Window {
        turnstile?: TurnstileAPI;
    }
}
/**
 * Loads the Cloudflare Turnstile script in explicit rendering mode.
 *
 * This function is idempotent - calling it multiple times will return
 * the same promise. The script is loaded with `async` and `defer` attributes
 * for optimal performance.
 *
 * @returns Promise that resolves when the script is loaded and `window.turnstile` is available.
 * @throws Error if the script fails to load within the timeout period.
 *
 * @example
 * ```ts
 * await loadTurnstileScript();
 * // window.turnstile is now available
 * window.turnstile.render('#my-widget', { sitekey: 'xxx' });
 * ```
 */
declare function loadTurnstileScript(): Promise<void>;
/**
 * Checks if the Turnstile script has been loaded and is ready to use.
 *
 * @returns `true` if `window.turnstile` is available, `false` otherwise.
 *
 * @example
 * ```ts
 * if (isTurnstileLoaded()) {
 *   window.turnstile.reset();
 * }
 * ```
 */
declare function isTurnstileLoaded(): boolean;
/**
 * Resets a Turnstile widget, allowing the user to solve the challenge again.
 *
 * This is useful after form submission errors or when you need to
 * re-verify the user.
 *
 * @param widgetRef - Widget ID, container selector, or element.
 *                    If omitted, resets all widgets on the page.
 *
 * @example
 * ```ts
 * // Reset a specific widget by ID
 * resetTurnstile('widget-123');
 *
 * // Reset widget in a specific container
 * resetTurnstile('#my-form .turnstile-container');
 *
 * // Reset all widgets
 * resetTurnstile();
 * ```
 */
declare function resetTurnstile(widgetRef?: WidgetRef): void;
/**
 * Removes a Turnstile widget from the page.
 *
 * This destroys the widget and removes all associated DOM elements.
 * The widget cannot be used after removal - you'll need to render a new one.
 *
 * @param widgetRef - Widget ID, container selector, or element.
 *
 * @example
 * ```ts
 * removeTurnstile('widget-123');
 * ```
 */
declare function removeTurnstile(widgetRef: WidgetRef): void;
/**
 * Gets the current response token from a Turnstile widget.
 *
 * The token is what you send to your server for verification.
 * Returns `null` if the widget hasn't been solved yet or doesn't exist.
 *
 * @param widgetRef - Widget ID, container selector, or element.
 * @returns The response token, or `null` if unavailable.
 *
 * @example
 * ```ts
 * const token = getTurnstileResponse('widget-123');
 * if (token) {
 *   // Send token to server for verification
 *   await verifyTurnstile(token);
 * }
 * ```
 */
declare function getTurnstileResponse(widgetRef: WidgetRef): string | null;
/**
 * Executes the challenge for a widget with `execution="execute"` mode.
 *
 * This is only needed when you've configured the widget to not run
 * automatically on render. Call this when you're ready for the user
 * to complete the challenge (e.g., when they click submit).
 *
 * @param widgetRef - Widget ID, container selector, or element.
 *
 * @example
 * ```tsx
 * // In your form component
 * <Turnstile execution="execute" ref={turnstileRef} />
 *
 * // When form is submitted
 * const handleSubmit = () => {
 *   executeTurnstile(turnstileRef.current?.getWidgetId());
 * };
 * ```
 */
declare function executeTurnstile(widgetRef: WidgetRef): void;
/**
 * Checks if a widget's token has expired.
 *
 * Tokens expire after 300 seconds (5 minutes). If expired, you should
 * reset the widget and have the user solve it again.
 *
 * @param widgetRef - Widget ID, container selector, or element.
 * @returns `true` if expired, `false` otherwise. Returns `false` if widget doesn't exist.
 *
 * @example
 * ```ts
 * if (isTokenExpired('widget-123')) {
 *   resetTurnstile('widget-123');
 *   alert('Please complete the CAPTCHA again.');
 * }
 * ```
 */
declare function isTokenExpired(widgetRef: WidgetRef): boolean;
/**
 * Renders a Turnstile widget in a container element.
 *
 * This is a low-level function for advanced use cases. In most cases,
 * you should use the `<Turnstile>` component instead.
 *
 * @param container - Element or selector where the widget should be rendered.
 * @param options - Widget configuration options.
 * @returns The widget ID, or `undefined` if rendering failed.
 *
 * @example
 * ```ts
 * const widgetId = await renderTurnstile('#my-container', {
 *   sitekey: 'your-site-key',
 *   callback: (token) => console.log('Token:', token),
 * });
 * ```
 */
declare function renderTurnstile(container: WidgetRef, options: Record<string, unknown>): Promise<string | undefined>;

export { Turnstile, type TurnstileAppearance, type TurnstileExecution, type TurnstileProps, type TurnstileRef, type TurnstileRefreshBehavior, type TurnstileRetry, type TurnstileSize, type TurnstileTheme, type WidgetRef, executeTurnstile, getTurnstileResponse, isTokenExpired, isTurnstileLoaded, loadTurnstileScript, removeTurnstile, renderTurnstile, resetTurnstile };
