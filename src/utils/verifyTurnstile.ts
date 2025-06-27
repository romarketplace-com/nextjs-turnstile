/** Options for verifying a Turnstile token. */
export interface VerifyOptions {
  /** Override default secret key (falls back to `TURNSTILE_SECRET_KEY`). */
  secretKey?: string;
  /** Provide IP manually – otherwise we attempt to auto‑detect via `getClientIp()`. */
  ip?: string;
  /** Optional headers fallback when running in pages router API routes. */
  headers?: Record<string, string | string[] | undefined> | Headers;
}

/**
 * Verifies a Cloudflare Turnstile token on the server.
 *
 * ```ts
 * const ok = await verifyTurnstile(token);
 * if (!ok) throw new Error("Captcha failed");
 * ```
 *
 * @param token   - The token returned by the widget.
 * @param options - Optional overrides (`secretKey`, `ip`, `headers`).
 * @returns Whether the token is valid.
 */
export async function verifyTurnstile(
  token: string,
  options: VerifyOptions = {}
): Promise<boolean> {
  const secret = options.secretKey ?? process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new Error("Turnstile Secret key not provided");

  const ip = options.ip ?? await getClientIp(options?.headers);

  // Cloudflare's API accepts JSON (cf. docs 2024‑12‑01)
  const body: Record<string, string> = { secret, response: token };
  if (ip) body["remoteip"] = ip;

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    throw new Error(
      `[nextjs‑turnstile] Verification request failed: ${res.status} ${res.statusText}`
    );
  }

  const json = (await res.json()) as { success: boolean };
  return Boolean(json.success);
}

export async function getClientIp(
  initHeaders?: Record<string, string | string[] | undefined> | Headers
): Promise<string | undefined> {
  // 1. Try next/headers (App Router & Server Actions)
  try {
    // Lazy require so code still compiles in Next 12 environments
    // where `next/headers` doesn't exist.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { headers } = require("next/headers");
    
    // Handle both sync (Next.js 12) and async (Next.js 13+) headers()
    let h: Headers;
    try {
      // Try calling headers() as async first (Next.js 13+)
      h = await headers();
    } catch {
      // Fallback to sync call (Next.js 12)
      h = headers();
    }
    
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("cf-connecting-ip") ||
      h.get("x-real-ip");
    if (ip) return ip;
    // fallthrough to initHeaders if nothing found
  } catch {
    /* not in app‑router context */
  }

  // 2. Fallback: inspect provided initHeaders (Pages API route etc.)
  if (initHeaders) {
    const get = (name: string): string | undefined => {
      if (initHeaders instanceof Headers)
        return initHeaders.get(name) ?? undefined;
      const val = (
        initHeaders as Record<string, string | string[] | undefined>
      )[name];
      return Array.isArray(val) ? val[0] : val;
    };
    return (
      get("x-forwarded-for")?.split(",")[0]?.trim() ||
      get("cf-connecting-ip") ||
      get("x-real-ip") ||
      undefined
    );
  }

  // 3. Nothing found
  return undefined;
}
