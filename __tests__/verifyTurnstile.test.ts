/**
 * @jest-environment node
 */
import { verifyTurnstile, getClientIp } from "../src/utils/verifyTurnstile";
import fetchMock from "jest-fetch-mock"; // install & enable in jest-setup

fetchMock.enableMocks();

beforeEach(() => fetchMock.resetMocks());

it("returns true on successful verification", async () => {
  fetchMock.mockResponseOnce(JSON.stringify({ success: true }));
  const ok = await verifyTurnstile("token-abc", { secretKey: "shhh" });
  expect(ok).toBe(true);
  expect(fetchMock).toHaveBeenCalledWith(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    expect.objectContaining({ method: "POST" }),
  );
});

it("throws when secret key missing", async () => {
  await expect(verifyTurnstile("token-abc")).rejects.toThrow(
    /Secret key not provided/i,
  );
});

it("getClientIp works with provided headers", async () => {
  const mockHeaders = {
    "x-forwarded-for": "192.168.1.1, 10.0.0.1",
    "cf-connecting-ip": "203.0.113.1",
  };
  
  const ip = await getClientIp(mockHeaders);
  expect(ip).toBe("192.168.1.1");
});

it("getClientIp works with Headers instance", async () => {
  const mockHeaders = new Headers({
    "x-forwarded-for": "192.168.1.1, 10.0.0.1",
    "cf-connecting-ip": "203.0.113.1",
  });
  
  const ip = await getClientIp(mockHeaders);
  expect(ip).toBe("192.168.1.1");
});

it("getClientIp falls back to cf-connecting-ip when x-forwarded-for not available", async () => {
  const mockHeaders = {
    "cf-connecting-ip": "203.0.113.1",
  };
  
  const ip = await getClientIp(mockHeaders);
  expect(ip).toBe("203.0.113.1");
});

it("getClientIp falls back to x-real-ip when other headers not available", async () => {
  const mockHeaders = {
    "x-real-ip": "198.51.100.1",
  };
  
  const ip = await getClientIp(mockHeaders);
  expect(ip).toBe("198.51.100.1");
});

it("getClientIp returns undefined when no headers provided and not in Next.js context", async () => {
  const ip = await getClientIp();
  expect(ip).toBeUndefined();
});

it("getClientIp handles next/headers async behavior (Next.js 13+)", async () => {
  // Mock next/headers to simulate Next.js 13+ async behavior
  const mockHeaders = new Headers({
    "x-forwarded-for": "192.168.1.1",
  });
  
  jest.doMock("next/headers", () => ({
    headers: jest.fn().mockResolvedValue(mockHeaders),
  }));
  
  // Re-import to get the mocked version
  const { getClientIp: getClientIpMocked } = await import("../src/utils/verifyTurnstile");
  
  const ip = await getClientIpMocked();
  expect(ip).toBe("192.168.1.1");
  
  // Clean up
  jest.dontMock("next/headers");
});

it("getClientIp handles next/headers sync behavior (Next.js 12)", async () => {
  // Mock next/headers to simulate Next.js 12 sync behavior
  const mockHeaders = new Headers({
    "x-forwarded-for": "192.168.1.1",
  });
  
  jest.doMock("next/headers", () => ({
    headers: jest.fn().mockReturnValue(mockHeaders),
  }));
  
  // Re-import to get the mocked version
  const { getClientIp: getClientIpMocked } = await import("../src/utils/verifyTurnstile");
  
  const ip = await getClientIpMocked();
  expect(ip).toBe("192.168.1.1");
  
  // Clean up
  jest.dontMock("next/headers");
});
