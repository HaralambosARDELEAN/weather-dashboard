import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/geocode/route";
import { geoResult, json, mockFetch, timeoutError } from "../helpers";

afterEach(() => vi.unstubAllGlobals());

const call = (q: string) => GET(new Request(`http://localhost/api/geocode?q=${encodeURIComponent(q)}`));

describe("GET /api/geocode", () => {
  it("rejects queries shorter than 2 characters", async () => {
    const response = await call("a");
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Type at least 2 characters to search." });
  });

  it("returns matching places", async () => {
    mockFetch(() => json({ results: [geoResult(683506, "Timișoara")] }));
    const response = await call("Timi");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ results: [{ id: 683506, name: "Timișoara" }] });
  });

  it("returns an empty list for an unknown place", async () => {
    mockFetch(() => json({ generationtime_ms: 0.1 }));
    await expect((await call("Xyzzyq")).json()).resolves.toEqual({ results: [] });
  });

  it("returns 504 when the service does not answer", async () => {
    mockFetch(() => Promise.reject(timeoutError()));
    expect((await call("Timi")).status).toBe(504);
  });
});
