"use client";
import { useEffect, useRef } from "react";
import { loadTurnstileScript, usedContainerIds, usedResponseFieldNames } from "../utils";

/**
 * Public props for {@link TurnstileImplicit}.
 * All props are optional so you can drop the component in with zero config.
 */
export interface TurnstileImplicitProps {
  /** Your Cloudflare *site‑key*. If omitted we fall back to
   * `process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY`. */
  siteKey?: string;
  /** Widget theme. `'auto'` follows the user's colour‑scheme. */
  theme?: "auto" | "light" | "dark";
  /** Widget size. */
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
  /** Extra class to apply to the host `<div>` element. */
  className?: string;
  /** Fires when the widget returns a *valid* token. */
  onSuccess?(token: string): void;
  /** Fires when the token *expires* (~2 min). */
  onExpire?(): void;
  /** Fires when the interactive challenge times out. */
  onTimeout?(): void;
  /** Fires on unrecoverable error. */
  onError?(): void;
}

export default function TurnstileImplicit({
  siteKey,
  theme = "auto",
  size = "normal",
  appearance,
  responseFieldName = "cf-turnstile-response",
  refreshExpired = "auto",
  refreshTimeout = "auto",
  className,
  onSuccess,
  onExpire,
  onTimeout,
  onError,
}: TurnstileImplicitProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | number | null>(null);

  // Resolve site‑key lazily so it isn't baked into the bundle signature.
  const resolvedKey =
    siteKey ?? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  // Generate unique container ID
  const containerId = `cft-${responseFieldName}`;

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
    if (usedResponseFieldNames.has(responseFieldName)) {
      throw new Error(
        `Duplicate responseFieldName "${responseFieldName}" detected. ` +
          "Each <TurnstileImplicit> on the page must use a unique name."
      );
    }
    usedResponseFieldNames.add(responseFieldName);

    // Prevent duplicate container IDs
    if (usedContainerIds.has(containerId)) {
      throw new Error(
        `Duplicate containerId "${containerId}" detected. ` +
          "Each <TurnstileImplicit> on the page must use a unique responseFieldName."
      );
    }
    usedContainerIds.add(containerId);

    // Register global callbacks BEFORE the script loads
    // Cloudflare's implicit mode scans the DOM immediately when the script loads
    (window as any)[cbNames.verify] = (token: string) => onSuccess?.(token);
    (window as any)[cbNames.error] = () => onError?.();
    (window as any)[cbNames.expire] = () => {
      onExpire?.();
    };
    (window as any)[cbNames.timeout] = () => {
      onTimeout?.();
    };

    // Ensure a host element exists before we load the script.
    if (!hostRef.current) return;

    // Load Turnstile's script in *implicit* mode (idempotent).
    loadTurnstileScript("implicit")
      .then(() => {
        // The widget should render automatically in implicit mode
        // since we have the data attributes set on the div
      })
      .catch((err) => onError?.());

    // Cleanup on unmount / HMR.
    return () => {
      usedResponseFieldNames.delete(responseFieldName);
      usedContainerIds.delete(containerId);
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
    refreshExpired,
    refreshTimeout,
    onSuccess,
    onError,
    onExpire,
    onTimeout,
    cbNames.verify,
    cbNames.error,
    cbNames.expire,
    cbNames.timeout
  ]);

  // ---------------------------------------------------------------------------
  /* Hidden input:  Cloudflare automatically injects one, but exposing it in
   * the DOM helps with SSR validators / form libraries that expect to see it.
   */
  return (
    <>
      {/* Host div Turnstile will replace with an iframe. */}
      <div
        id={containerId}
        ref={hostRef}
        className={`cf-turnstile ${className ?? ""}`}
        data-sitekey={resolvedKey}
        data-theme={theme}
        data-size={size}
        data-appearance={appearance}
        data-response-field-name={responseFieldName}
        data-callback={cbNames.verify}
        data-error-callback={cbNames.error}
        data-expired-callback={cbNames.expire}
        data-timeout-callback={cbNames.timeout}
      />
    </>
  );
}
