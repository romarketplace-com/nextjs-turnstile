"use client";

// src/components/Turnstile.tsx
import {
  useEffect,
  useRef as useRef2,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle
} from "react";

// src/utils/debug.ts
function debugLog(message, ...args) {
  if (process.env.NODE_ENV === "development") {
    console.log(message, ...args);
  }
}
function debugWarn(message, ...args) {
  if (process.env.NODE_ENV === "development") {
    console.warn(message, ...args);
  }
}

// src/utils/index.ts
var TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js";
var SCRIPT_LOAD_TIMEOUT = 1e4;
var SCRIPT_POLL_INTERVAL = 100;
var SCRIPT_PROMISE_KEY = "__turnstile_load_promise__";
function loadTurnstileScript() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  const cached = window[SCRIPT_PROMISE_KEY];
  if (cached) {
    return cached;
  }
  const promise = new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve();
      return;
    }
    const existingScript = document.querySelector(
      `script[src^="${TURNSTILE_SCRIPT_URL}"]`
    );
    if (existingScript) {
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += SCRIPT_POLL_INTERVAL;
        if (window.turnstile) {
          clearInterval(interval);
          resolve();
        } else if (elapsed >= SCRIPT_LOAD_TIMEOUT) {
          clearInterval(interval);
          reject(new Error("[Turnstile] Script load timeout - turnstile object not found."));
        }
      }, SCRIPT_POLL_INTERVAL);
      return;
    }
    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    const callbackName = `__cfTurnstileOnLoad_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    script.src = `${TURNSTILE_SCRIPT_URL}?render=explicit&onload=${callbackName}`;
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("[Turnstile] Script load timeout."));
    }, SCRIPT_LOAD_TIMEOUT);
    const cleanup = () => {
      clearTimeout(timeoutId);
      delete window[callbackName];
    };
    window[callbackName] = () => {
      cleanup();
      if (window.turnstile) {
        resolve();
      } else {
        reject(new Error("[Turnstile] Script loaded but turnstile object not found."));
      }
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("[Turnstile] Script failed to load."));
    };
    document.head.appendChild(script);
  });
  window[SCRIPT_PROMISE_KEY] = promise;
  return promise;
}
function isTurnstileLoaded() {
  return typeof window !== "undefined" && typeof window.turnstile !== "undefined";
}
function getTurnstile() {
  if (typeof window === "undefined") return void 0;
  return window.turnstile;
}
function resetTurnstile(widgetRef) {
  const turnstile = getTurnstile();
  if (!turnstile) return;
  try {
    turnstile.reset(widgetRef);
  } catch (error) {
    debugWarn("[Turnstile] Reset failed:", error);
  }
}
function removeTurnstile(widgetRef) {
  const turnstile = getTurnstile();
  if (!turnstile) return;
  try {
    turnstile.remove(widgetRef);
  } catch (error) {
    debugWarn("[Turnstile] Remove failed:", error);
  }
}
function getTurnstileResponse(widgetRef) {
  const turnstile = getTurnstile();
  if (!turnstile) return null;
  try {
    const response = turnstile.getResponse(widgetRef);
    return response || null;
  } catch (error) {
    debugWarn("[Turnstile] getResponse failed:", error);
    return null;
  }
}
function executeTurnstile(widgetRef) {
  const turnstile = getTurnstile();
  if (!turnstile) return;
  try {
    turnstile.execute(widgetRef);
  } catch (error) {
    debugWarn("[Turnstile] Execute failed:", error);
  }
}
function isTokenExpired(widgetRef) {
  const turnstile = getTurnstile();
  if (!turnstile) return false;
  try {
    return turnstile.isExpired(widgetRef);
  } catch {
    return false;
  }
}
async function renderTurnstile(container, options) {
  await loadTurnstileScript();
  const turnstile = getTurnstile();
  if (!turnstile) {
    throw new Error("[Turnstile] Script loaded but turnstile object not found.");
  }
  try {
    const widgetId = turnstile.render(container, options);
    return widgetId !== void 0 ? String(widgetId) : void 0;
  } catch (error) {
    console.error("[Turnstile] Render failed:", error);
    return void 0;
  }
}

// src/components/hooks/useCallbackRefs.ts
import { useLayoutEffect, useRef } from "react";
function useCallbackRefs(callbacks) {
  const refsObject = useRef(
    Object.keys(callbacks).reduce(
      (acc, key) => {
        acc[key] = useRef(callbacks[key]);
        return acc;
      },
      {}
    )
  ).current;
  useLayoutEffect(() => {
    Object.keys(callbacks).forEach((key) => {
      refsObject[key].current = callbacks[key];
    });
  });
  return refsObject;
}

// src/components/Turnstile.tsx
import { jsx } from "react/jsx-runtime";
var Turnstile = forwardRef(function Turnstile2({
  siteKey: customSiteKey,
  theme = "auto",
  size = "normal",
  appearance = "always",
  execution = "render",
  responseFieldName = "cf-turnstile-response",
  refreshExpired = "auto",
  refreshTimeout = "auto",
  retry = "auto",
  retryInterval = 8e3,
  action,
  cData,
  tabIndex = 0,
  language = "auto",
  className,
  style,
  onSuccess,
  onError,
  onExpire,
  onTimeout,
  onBeforeInteractive,
  onAfterInteractive,
  onUnsupported,
  onLoad
}, ref) {
  const siteKey = customSiteKey != null ? customSiteKey : process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) {
    throw new Error(
      "[Turnstile] Missing site key. Provide `siteKey` prop or set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` environment variable."
    );
  }
  if (process.env.NODE_ENV === "development" && !siteKey.startsWith("0x") && !siteKey.startsWith("1x")) {
    console.warn(
      `[Turnstile] Site key "${siteKey}" doesn't match expected format (should start with 0x or 1x).`
    );
  }
  const containerRef = useRef2(null);
  const widgetIdRef = useRef2(void 0);
  const [isReady, setIsReady] = useState(false);
  const isMountedRef = useRef2(true);
  const hasRenderedRef = useRef2(false);
  const callbackRefs = useCallbackRefs({
    onSuccess,
    onError,
    onExpire,
    onTimeout,
    onBeforeInteractive,
    onAfterInteractive,
    onUnsupported,
    onLoad
  });
  const getTurnstile2 = useCallback(() => {
    if (typeof window === "undefined") return null;
    return window.turnstile;
  }, []);
  useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        const turnstile = getTurnstile2();
        if (turnstile && widgetIdRef.current) {
          try {
            turnstile.reset(widgetIdRef.current);
          } catch (e) {
            console.error("[Turnstile] Reset failed:", e);
          }
        }
      },
      remove: () => {
        const turnstile = getTurnstile2();
        if (turnstile && widgetIdRef.current) {
          try {
            turnstile.remove(widgetIdRef.current);
            widgetIdRef.current = void 0;
            hasRenderedRef.current = false;
            setIsReady(false);
          } catch (e) {
            console.error("[Turnstile] Remove failed:", e);
          }
        }
      },
      getResponse: () => {
        const turnstile = getTurnstile2();
        if (turnstile && widgetIdRef.current) {
          try {
            return turnstile.getResponse(widgetIdRef.current) || null;
          } catch {
            return null;
          }
        }
        return null;
      },
      execute: () => {
        const turnstile = getTurnstile2();
        if (turnstile && widgetIdRef.current) {
          try {
            turnstile.execute(widgetIdRef.current);
          } catch (e) {
            console.error("[Turnstile] Execute failed:", e);
          }
        }
      },
      isReady: () => isReady,
      getWidgetId: () => widgetIdRef.current
    }),
    [getTurnstile2, isReady]
  );
  useEffect(() => {
    isMountedRef.current = true;
    const container = containerRef.current;
    if (!container) {
      return;
    }
    if (hasRenderedRef.current) {
      return;
    }
    if (widgetIdRef.current) {
      debugLog("[Turnstile] Configuration changed, re-rendering widget");
      const turnstile = window.turnstile;
      if (turnstile) {
        try {
          turnstile.remove(widgetIdRef.current);
        } catch (e) {
          console.warn("[Turnstile] Failed to remove previous widget:", e);
        }
      }
      widgetIdRef.current = void 0;
      setIsReady(false);
    }
    if (container.querySelector('iframe[src*="turnstile"], iframe[allow*="cross-origin"]')) {
      return;
    }
    hasRenderedRef.current = true;
    loadTurnstileScript().then(() => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
      if (!isMountedRef.current || !containerRef.current) {
        hasRenderedRef.current = false;
        return;
      }
      const turnstile = window.turnstile;
      if (!turnstile) {
        console.error("[Turnstile] Script loaded but turnstile object not found.");
        (_b = (_a = callbackRefs.onError).current) == null ? void 0 : _b.call(_a, "script_load_failed");
        hasRenderedRef.current = false;
        return;
      }
      if (containerRef.current.querySelector("iframe")) {
        setIsReady(true);
        (_d = (_c = callbackRefs.onLoad).current) == null ? void 0 : _d.call(_c);
        return;
      }
      if (widgetIdRef.current) {
        setIsReady(true);
        (_f = (_e = callbackRefs.onLoad).current) == null ? void 0 : _f.call(_e);
        return;
      }
      const options = {
        sitekey: siteKey,
        theme,
        size,
        appearance,
        execution,
        "refresh-expired": refreshExpired,
        "refresh-timeout": refreshTimeout,
        retry,
        "retry-interval": retryInterval,
        tabindex: tabIndex,
        language,
        // Callbacks - use refs to get latest values
        callback: (token) => {
          var _a2, _b2;
          (_b2 = (_a2 = callbackRefs.onSuccess).current) == null ? void 0 : _b2.call(_a2, token);
        },
        "error-callback": (errorCode) => {
          var _a2, _b2;
          (_b2 = (_a2 = callbackRefs.onError).current) == null ? void 0 : _b2.call(_a2, errorCode);
          return true;
        },
        "expired-callback": () => {
          var _a2, _b2;
          (_b2 = (_a2 = callbackRefs.onExpire).current) == null ? void 0 : _b2.call(_a2);
        },
        "timeout-callback": () => {
          var _a2, _b2;
          (_b2 = (_a2 = callbackRefs.onTimeout).current) == null ? void 0 : _b2.call(_a2);
        },
        "before-interactive-callback": () => {
          var _a2, _b2;
          (_b2 = (_a2 = callbackRefs.onBeforeInteractive).current) == null ? void 0 : _b2.call(_a2);
        },
        "after-interactive-callback": () => {
          var _a2, _b2;
          (_b2 = (_a2 = callbackRefs.onAfterInteractive).current) == null ? void 0 : _b2.call(_a2);
        },
        "unsupported-callback": () => {
          var _a2, _b2;
          (_b2 = (_a2 = callbackRefs.onUnsupported).current) == null ? void 0 : _b2.call(_a2);
        }
      };
      if (responseFieldName === false) {
        options["response-field"] = false;
      } else if (responseFieldName) {
        options["response-field-name"] = responseFieldName;
      }
      if (action) {
        options.action = action;
      }
      if (cData) {
        options.cData = cData;
      }
      try {
        const renderedId = turnstile.render(containerRef.current, options);
        if (renderedId !== void 0 && renderedId !== null) {
          widgetIdRef.current = String(renderedId);
          if (isMountedRef.current) {
            setIsReady(true);
            (_h = (_g = callbackRefs.onLoad).current) == null ? void 0 : _h.call(_g);
          }
        } else {
          console.error("[Turnstile] Render returned invalid widget ID.");
          (_j = (_i = callbackRefs.onError).current) == null ? void 0 : _j.call(_i, "render_failed");
          hasRenderedRef.current = false;
        }
      } catch (e) {
        console.error("[Turnstile] Render failed:", e);
        (_l = (_k = callbackRefs.onError).current) == null ? void 0 : _l.call(_k, "render_exception");
        hasRenderedRef.current = false;
      }
    }).catch((error) => {
      var _a, _b;
      console.error("[Turnstile] Script load failed:", error);
      if (isMountedRef.current) {
        (_b = (_a = callbackRefs.onError).current) == null ? void 0 : _b.call(_a, "script_load_failed");
      }
      hasRenderedRef.current = false;
    });
    return () => {
      isMountedRef.current = false;
      const isRealUnmount = !containerRef.current || !document.body.contains(containerRef.current);
      if (isRealUnmount && widgetIdRef.current) {
        removeTurnstile(widgetIdRef.current);
        widgetIdRef.current = void 0;
        hasRenderedRef.current = false;
        setIsReady(false);
      } else {
        hasRenderedRef.current = false;
      }
    };
  }, [
    // Only include props that should cause a full re-render of the widget.
    // Callbacks are intentionally excluded and accessed via refs instead.
    // This prevents widget destruction/recreation when callback functions change
    // (e.g., when parent passes inline arrow functions on every render).
    siteKey,
    theme,
    size,
    appearance,
    execution,
    responseFieldName,
    refreshExpired,
    refreshTimeout,
    retry,
    retryInterval,
    action,
    cData,
    tabIndex,
    language
  ]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: containerRef,
      className,
      style,
      "aria-label": "Cloudflare Turnstile challenge"
    }
  );
});
var Turnstile_default = Turnstile;
export {
  Turnstile_default as Turnstile,
  executeTurnstile,
  getTurnstileResponse,
  isTokenExpired,
  isTurnstileLoaded,
  loadTurnstileScript,
  removeTurnstile,
  renderTurnstile,
  resetTurnstile
};
