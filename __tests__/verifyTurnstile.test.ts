/**
 * @jest-environment node
 */
import { verifyTurnstile } from "../src/utils/verifyTurnstile";
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
