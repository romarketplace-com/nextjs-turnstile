/**
 * Shared type definitions for the Turnstile library.
 * Centralizes all internal types to avoid duplication across modules.
 */

/**
 * Reference to a Turnstile widget.
 * Can be a widget ID (string or number) or a container element.
 */
export type WidgetRef = string | number | HTMLElement;

/**
 * Minimal interface for Cloudflare's Turnstile API.
 * This is the global API object injected by the Turnstile script.
 * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
 * @internal
 */
export interface TurnstileAPI {
	render(
		container: WidgetRef,
		options?: Record<string, unknown>,
	): string | number;
	reset(widgetId?: WidgetRef): void;
	remove(widgetId?: WidgetRef): void;
	getResponse(widgetId?: WidgetRef): string | undefined;
	execute(widgetId?: WidgetRef): void;
	isExpired(widgetId?: WidgetRef): boolean;
}
