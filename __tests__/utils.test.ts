/**
 * @jest-environment jsdom
 */
import {
  loadTurnstileScript,
  isTurnstileLoaded,
  resetTurnstile,
  executeTurnstile,
  removeTurnstile,
  getTurnstileResponse,
} from "../src/utils";

// Silence error-path log noise
jest.spyOn(console, "error").mockImplementation(() => {});

describe("Turnstile utils", () => {
  const mockTS = {
    render: jest.fn(() => "mock-id"),
    getResponse: jest.fn(),
    reset: jest.fn(),
    execute: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    (globalThis as any).turnstile = { ...mockTS };
    jest.clearAllMocks();
    document.body.innerHTML = `
      <div id="foo"></div>
      <div id="w1"></div>
    `;
  });

  afterEach(() => {
    delete (globalThis as any).turnstile;
  });

  /* ------------------------------------------------------------------ */
  test("loadTurnstileScript caches per mode", () => {
    const a = loadTurnstileScript("implicit");
    const b = loadTurnstileScript("implicit");
    const c = loadTurnstileScript("explicit");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  /* ------------------------------------------------------------------ */
  test("isTurnstileLoaded reflects global presence", () => {
    expect(isTurnstileLoaded()).toBe(true);
    delete (global as any).turnstile;
    expect(isTurnstileLoaded()).toBe(false);
  });

  /* ------------------------------------------------------------------ */
  describe("executeTurnstile", () => {
    test("renders when getResponse throws", () => {
      mockTS.getResponse.mockImplementationOnce(() => {
        throw new Error("not rendered");
      });
      executeTurnstile("#foo");
      expect(mockTS.render).toHaveBeenCalledWith("#foo");
    });

    test("skips render when token already present", () => {
      mockTS.getResponse.mockReturnValueOnce("tok!");
      executeTurnstile("#foo");
      expect(mockTS.render).not.toHaveBeenCalled();
    });
  });

  /* ------------------------------------------------------------------ */
  test("imperative helpers proxy correctly", () => {
    // force executeTurnstile to render
    mockTS.getResponse.mockImplementation(() => {
      throw new Error("not rendered");
    });

    resetTurnstile("w1");
    executeTurnstile("w1");
    removeTurnstile("w1");

    expect(mockTS.reset).toHaveBeenCalledWith("w1");
    expect(mockTS.render).toHaveBeenCalledWith("w1");
    expect(mockTS.remove).toHaveBeenCalledWith("w1");
  });

  /* ------------------------------------------------------------------ */
  test("getTurnstileResponse returns token or null", () => {
    mockTS.getResponse.mockReturnValueOnce("abc");
    expect(getTurnstileResponse("#foo")).toBe("abc");

    mockTS.getResponse.mockImplementationOnce(() => {
      throw new Error("not rendered");
    });
    expect(getTurnstileResponse("#foo")).toBeNull();
  });
});
