"use client";
import { useEffect, useRef, useState } from "react";
import { loadTurnstileScript, removeTurnstile } from "../utils";

/** Props for an explicit-mode Turnstile widget. */
export interface TurnstileExplicitProps {
  /** ID of the div that will contain the widget.  
      If omitted we generate a unique one so you can mount many widgets. */
  containerId?: string;
  /** Your public site-key (defaults to `process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY`). */
  siteKey?: string;
  /** 'auto' picks-up user's colour-scheme. */
  theme?: "auto" | "light" | "dark";
  /** 'normal' ≈ 300×65, 'compact' ≈ 130×65. */
  size?: "normal" | "compact";

  /* Callbacks */
  onSuccess?(token: string): void;
  onError?(): void;
  onExpire?(): void;
}

/**
 * Renders a Cloudflare Turnstile widget in explicit mode.
 *
 * This component handles the entire lifecycle of the widget, from loading the
 * Turnstile script to rendering the widget and cleaning up on unmount. It is
 * designed to be resilient to the complexities of React's rendering lifecycle
 * in development environments (like Strict Mode and Fast Refresh).
 *
 * @param {TurnstileExplicitProps} props - The component's props.
 * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#explicitly-render-the-turnstile-widget
 */
export default function TurnstileExplicit({
  containerId: customContainerId,
  siteKey: customSiteKey,
  theme = "auto",
  size = "normal",
  onSuccess,
  onError,
  onExpire,
}: TurnstileExplicitProps) {
  const siteKey = customSiteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const [id] = useState(() => customContainerId || `cf-turnstile-${Math.random().toString(36).slice(2)}`);
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetId, setWidgetId] = useState<string>("");

  if (!siteKey) {
    throw new Error(
      `TurnstileExplicit: Missing 'siteKey' prop or environment variable 'NEXT_PUBLIC_TURNSTILE_SITE_KEY'.`
    );
  }

  // Validate site key format
  if (!siteKey.startsWith('0x') && !siteKey.startsWith('1x')) {
    console.warn(`TurnstileExplicit: Site key '${siteKey}' doesn't match expected format (should start with 0x or 1x)`);
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      // This can happen if the component is unmounted quickly after mounting.
      return;
    }

    let isMounted = true;
    let localWidgetId: string;

    loadTurnstileScript("explicit")
      .then(() => {
        if (!isMounted || !containerRef.current) return;
        
        const turnstile = (window as any).turnstile;
        if (!turnstile) {
          console.error("Turnstile failed to load, object not found on window.");
          onError?.();
          return;
        }

        const renderedWidgetId = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          size,
          callback: (token: string) => onSuccess?.(token),
          "error-callback": () => onError?.(),
          "expired-callback": () => onExpire?.(),
        });
        
        if (renderedWidgetId) {
          setWidgetId(renderedWidgetId);
          localWidgetId = renderedWidgetId;
        } else {
          console.error("Turnstile render failed. Check your sitekey and other widget configuration.");
          onError?.();
        }
      })
      .catch((error) => {
        console.error("Failed to load Turnstile script:", error);
        onError?.();
      });

    return () => {
      isMounted = false;
      if (localWidgetId) {
        removeTurnstile(localWidgetId);
      }
    };
  }, [id, siteKey, theme, size, onSuccess, onError, onExpire]);

  return <div ref={containerRef} id={id} className="cf-turnstile" />;
}
