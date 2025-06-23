"use client";
import { useEffect, useRef } from "react";
import Script from "next/script";
import { loadTurnstileScript } from "../utils";

/**
 * Public props for {@link TurnstileImplicit}.
 * All props are optional so you can drop the component in with zero config.
 */
export interface TurnstileImplicitProps {
  /** Your Cloudflare *site‑key*. If omitted we fall back to
   * `process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY`. */
  siteKey?: string;
  /** Widget theme. `'auto'` follows the user’s colour‑scheme. */
  theme?: "auto" | "light" | "dark";
  /** Widget size. */
  size?: "normal" | "compact";
  /**
   * Name of the hidden input that will receive the token.  Must be **unique**
   * per page.  The same name is also used to build callback identifiers, so
   * duplication would clash – we throw if this happens.
   */
  responseFieldName?: string;
  /** How Turnstile behaves when a token expires.  We default to `'manual'`
   * to prevent Cloudflare from reloading the top‑window in an SPA. */
  refreshExpired?: "auto" | "manual" | "never";
  /** Extra class to apply to the host `<div>` element. */
  className?: string;
  /** Fires when the widget returns a *valid* token. */
  onSuccess?(token: string): void;
  /** Fires when the token *expires* (~2 min). */
  onExpire?(): void;
  /** Fires on unrecoverable error. */
  onError?(): void;
}

// Registry guarding against duplicate `responseFieldName`s.
const usedNames = new Set<string>();

export default function TurnstileImplicit({
  siteKey,
  theme = "auto",
  size = "normal",
  responseFieldName = "cf-turnstile-response",
  refreshExpired = "manual",
  className,
  onSuccess,
  onExpire,
  onError,
}: TurnstileImplicitProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | number | null>(null);

  // Resolve site‑key lazily so it isn’t baked into the bundle signature.
  const resolvedKey =
    siteKey ?? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  /**
   * Callback prefix ensures every widget registers *unique* global function
   * names so Cloudflare can call them back.  Using the response field name
   * makes the mapping deterministic and developer‑friendly.
   */
  const CB_PREFIX = `turnstile_${responseFieldName}`;
  const cbNames = {
    verify: `${CB_PREFIX}_verify`,
    error: `${CB_PREFIX}_error`,
    expire: `${CB_PREFIX}_expire`,
    timeout: `${CB_PREFIX}_timeout`,
  } as const;

  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Prevent duplicate widgets binding the same hidden‑input name.
    if (usedNames.has(responseFieldName)) {
      throw new Error(
        `Duplicate responseFieldName \"${responseFieldName}\" detected. ` +
          "Each <TurnstileImplicit> on the page must use a unique name."
      );
    }
    usedNames.add(responseFieldName);

    // Ensure a host element exists before we load the script.
    if (!hostRef.current) return;

    // Load Turnstile’s script in *implicit* mode (idempotent).
    loadTurnstileScript("implicit")
      .then(() => {
        // clean host div if CF left hidden inputs from a previous scan
        if (hostRef.current) hostRef.current.innerHTML = "";
        // Register global callbacks so CF can reach React land.
        (window as any)[cbNames.verify] = (token: string) => onSuccess?.(token);
        (window as any)[cbNames.error] = () => onError?.();
        (window as any)[cbNames.expire] = () => {
          onExpire?.();
          if (widgetId.current != null)
            window.turnstile?.reset(widgetId.current);
        };
        (window as any)[cbNames.timeout] = () => {
          if (widgetId.current != null)
            window.turnstile?.reset(widgetId.current);
        };

        // Render the widget into the host div.
        if (!widgetId.current) {
          widgetId.current = window.turnstile!.render(hostRef.current!, {
            sitekey: resolvedKey,
            theme,
            size,
            "response-field-name": responseFieldName,
            "refresh-expired": refreshExpired,
            callback: cbNames.verify,
            "expired-callback": cbNames.expire,
            "error-callback": cbNames.error,
            "timeout-callback": cbNames.timeout,
          });
        }
      })
      .catch((err) => onError?.());

    // Cleanup on unmount / HMR.
    return () => {
      usedNames.delete(responseFieldName);
      if (widgetId.current) {
        window.turnstile!.remove(widgetId.current);
        widgetId.current = null;
      }
      // Remove global functions to avoid polluting window.
      (window as any)[cbNames.verify] = undefined;
      (window as any)[cbNames.error] = undefined;
      (window as any)[cbNames.expire] = undefined;
      (window as any)[cbNames.timeout] = undefined;
    };
  }, [
    resolvedKey,
    theme,
    size,
    responseFieldName,
    refreshExpired
  ]);

  // ---------------------------------------------------------------------------
  /* Hidden input:  Cloudflare automatically injects one, but exposing it in
   * the DOM helps with SSR validators / form libraries that expect to see it.
   */
  return (
    <>
      {/* Script tag duplicated safely across multiple widgets. */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
        strategy="afterInteractive"
      />

      {/* Host div Turnstile will replace with an iframe. */}
      <div
        id={`cft-${responseFieldName}`}
        ref={hostRef}
        className={`cf-turnstile ${className ?? ""}`}
        data-sitekey={resolvedKey}
        data-theme={theme}
        data-size={size}
        data-response-field-name={responseFieldName}
        data-callback={cbNames.verify}
        data-error-callback={cbNames.error}
        data-expired-callback={cbNames.expire}
        data-timeout-callback={cbNames.timeout}
      />
    </>
  );
}
