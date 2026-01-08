"use client";
import { useEffect, useRef, useState } from "react";
import { loadTurnstileScript, removeTurnstile, usedContainerIds, usedResponseFieldNames } from "../utils";

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
  /** Controls when the challenge UI is shown. */
  appearance?: "always" | "execute" | "interaction-only";
  /**
   * Name of the hidden input that will receive the token.  Must be **unique**
   * per page.  The same name is also used to build callback identifiers, so
   * duplication would clash – we throw if this happens.
   */
  responseFieldName?: string;
  /** How Turnstile behaves when a token expires.  We default to 'auto' as cloudflare recommends. */
  refreshExpired?: "auto" | "manual" | "never";
  /** How Turnstile behaves when a widget times out.  We default to 'auto' as cloudflare recommends. */
  refreshTimeout?: "auto" | "manual" | "never";

  /* Callbacks */
  onSuccess?(token: string): void;
  onError?(): void;
  onExpire?(): void;
  onTimeout?(): void;
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
  appearance,
  onSuccess,
  onError,
  onExpire,
  onTimeout,
  refreshExpired = "auto",
  refreshTimeout = "auto",
  responseFieldName,
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
    // Prevent duplicate container IDs
    if (usedContainerIds.has(id)) {
      throw new Error(
        `Duplicate containerId "${id}" detected. ` +
          "Each <TurnstileExplicit> on the page must use a unique containerId."
      );
    }
    usedContainerIds.add(id);

    // Prevent duplicate response field names if provided
    if (responseFieldName) {
      if (usedResponseFieldNames.has(responseFieldName)) {
        throw new Error(
          `Duplicate responseFieldName "${responseFieldName}" detected. ` +
            "Each <TurnstileExplicit> on the page must use a unique responseFieldName."
        );
      }
      usedResponseFieldNames.add(responseFieldName);
    }

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
          ...(appearance && { appearance }),
          ...(responseFieldName && { "response-field-name": responseFieldName }),
          "refresh-expired": refreshExpired,
          "refresh-timeout": refreshTimeout,
          callback: (token: string) => onSuccess?.(token),
          "error-callback": (error?: any) => onError?.(),
          "expired-callback": () => onExpire?.(),
          "timeout-callback": () => onTimeout?.(),
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
      usedContainerIds.delete(id);
      if (responseFieldName) {
        usedResponseFieldNames.delete(responseFieldName);
      }
      if (localWidgetId) {
        removeTurnstile(localWidgetId);
      }
    };
  }, [id, siteKey, theme, size, appearance, onSuccess, onError, onExpire, onTimeout, refreshExpired, refreshTimeout, responseFieldName]);

  return <div ref={containerRef} id={id} className="cf-turnstile" />;
}
