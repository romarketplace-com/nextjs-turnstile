var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/server.ts
import "server-only";

// src/utils/verifyTurnstile.ts
var turnstileErrorDescriptions = {
  "missing-input-secret": "Secret parameter not provided",
  "invalid-input-secret": "Secret key is invalid or expired",
  "missing-input-response": "Response parameter was not provided",
  "invalid-input-response": "Token is invalid, malformed, or expired",
  "bad-request": "Request is malformed",
  "timeout-or-duplicate": "Token has already been validated or expired",
  "internal-error": "Internal error occurred in Cloudflare service",
  "invalid-token-format": "Token is not a valid string format",
  "token-too-long": "Token exceeds maximum length (2048 characters)",
  "action-mismatch": "Token action does not match expected action",
  "hostname-mismatch": "Token hostname does not match expected hostname",
  "token-too-old": "Token age exceeds maximum allowed age",
  "validation-timeout": "Token validation request timed out"
};
function isSuccessfulVerifyResponse(response) {
  return typeof response === "object" && response !== null && "success" in response && response.success === true;
}
async function verifyTurnstile(token, options = {}) {
  var _a, _b;
  if (!token || typeof token !== "string") {
    if (options.returnFullResponse) return { success: false, "error-codes": ["invalid-token-format"] };
    return false;
  }
  if (token.length > 2048) {
    if (options.returnFullResponse) return { success: false, "error-codes": ["token-too-long"] };
    return false;
  }
  const secret = (_a = options.secretKey) != null ? _a : process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new Error("Turnstile Secret key not provided");
  const ip = (_b = options.ip) != null ? _b : await getClientIp(options == null ? void 0 : options.headers);
  const body = { secret, response: token };
  if (ip) body["remoteip"] = ip;
  if (options.idempotencyKey) body["idempotency_key"] = options.idempotencyKey;
  let timeoutId;
  try {
    const controller = new AbortController();
    timeoutId = options.timeout ? setTimeout(() => controller.abort(), options.timeout) : void 0;
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: options.timeout ? controller.signal : void 0
      }
    );
    if (timeoutId) clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(
        `[nextjs-turnstile] Verification request failed: ${res.status} ${res.statusText}`
      );
    }
    const responseBody = await res.json();
    if (!isSuccessfulVerifyResponse(responseBody)) {
      if (options.returnFullResponse) return responseBody;
      return false;
    }
    const verifyResponse = responseBody;
    if (options.action && verifyResponse.action !== options.action) {
      if (options.returnFullResponse) {
        return {
          success: false,
          "error-codes": ["action-mismatch"]
        };
      }
      return false;
    }
    if (options.hostname && verifyResponse.hostname !== options.hostname) {
      if (options.returnFullResponse) {
        return {
          success: false,
          "error-codes": ["hostname-mismatch"]
        };
      }
      return false;
    }
    if (options.maxTokenAge !== void 0) {
      const challengeTime = new Date(verifyResponse.challenge_ts);
      const now = /* @__PURE__ */ new Date();
      const ageSeconds = (now.getTime() - challengeTime.getTime()) / 1e3;
      if (ageSeconds > options.maxTokenAge) {
        if (options.returnFullResponse) {
          return {
            success: false,
            "error-codes": ["timeout-or-duplicate"]
          };
        }
        return false;
      }
    }
    if (options.returnFullResponse) return verifyResponse;
    return true;
  } catch (error) {
    if (error.name === "AbortError") {
      if (options.returnFullResponse) return { success: false, "error-codes": ["validation-timeout"] };
      return false;
    }
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
async function getClientIp(initHeaders) {
  var _a, _b, _c, _d;
  try {
    const { headers } = __require("next/headers");
    let h;
    try {
      h = await headers();
    } catch {
      h = headers();
    }
    const ip = ((_b = (_a = h.get("x-forwarded-for")) == null ? void 0 : _a.split(",")[0]) == null ? void 0 : _b.trim()) || h.get("cf-connecting-ip") || h.get("x-real-ip");
    if (ip) return ip;
  } catch {
  }
  if (initHeaders) {
    const get = (name) => {
      var _a2;
      if (initHeaders instanceof Headers)
        return (_a2 = initHeaders.get(name)) != null ? _a2 : void 0;
      const val = initHeaders[name];
      return Array.isArray(val) ? val[0] : val;
    };
    return ((_d = (_c = get("x-forwarded-for")) == null ? void 0 : _c.split(",")[0]) == null ? void 0 : _d.trim()) || get("cf-connecting-ip") || get("x-real-ip") || void 0;
  }
  return void 0;
}
function getTurnstileErrorDescription(errorCode) {
  return turnstileErrorDescriptions[errorCode] || "Unknown error";
}
export {
  getClientIp,
  getTurnstileErrorDescription,
  isSuccessfulVerifyResponse,
  verifyTurnstile
};
