import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, errorResponse, request } from "@/lib/http";
import { json, mockFetch, timeoutError } from "../helpers";

const options = { timeoutMs: 1000, timeoutMessage: "Too slow.", networkMessage: "No network." };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("request", () => {
  it("returns status and parsed JSON", async () => {
    mockFetch(() => json({ hello: "world" }, 201));
    await expect(request("https://example.test", options)).resolves.toEqual({
      ok: true,
      status: 201,
      body: { hello: "world" },
    });
  });

  it("returns a null body when the answer is not JSON", async () => {
    mockFetch(() => new Response("<html>oops</html>", { status: 500 }));
    await expect(request("https://example.test", options)).resolves.toEqual({ ok: false, status: 500, body: null });
  });

  it("turns a timeout into a 504 ApiError", async () => {
    mockFetch(() => Promise.reject(timeoutError()));
    await expect(request("https://example.test", options)).rejects.toMatchObject({ status: 504, message: "Too slow." });
  });

  it("turns a network failure into a 502 ApiError", async () => {
    mockFetch(() => Promise.reject(new TypeError("fetch failed")));
    await expect(request("https://example.test", options)).rejects.toMatchObject({ status: 502, message: "No network." });
  });
});

describe("errorResponse", () => {
  it("uses the ApiError message, status and slot", async () => {
    const response = errorResponse(new ApiError("Bad place.", 502, 2));
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "Bad place.", slot: 2 });
  });

  it("adds extra fields", async () => {
    const response = errorResponse(new ApiError("Refused.", 422), { prompt: "p" });
    await expect(response.json()).resolves.toEqual({ error: "Refused.", prompt: "p" });
  });

  it("hides unexpected errors behind a generic 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = errorResponse(new Error("secret detail"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Something went wrong on the server. Try again." });
  });
});
