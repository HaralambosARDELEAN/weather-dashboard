import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as geocode } from "@/app/api/geocode/route";
import { GET as weather } from "@/app/api/weather/route";
import { forecast, geoResult, json, mockFetch } from "../helpers";

// The routes as they run on Cloudflare: a request limiter that lets each visitor through twice, then says no.
const limiter = vi.hoisted(() => {
  const seen = new Map<string, number>();
  return {
    seen,
    limit: async ({ key }: { key: string }) => {
      const calls = (seen.get(key) ?? 0) + 1;
      seen.set(key, calls);
      return { success: calls <= 2 };
    },
  };
});
vi.mock("@/lib/cloudflare", () => ({ paintCounters: () => null, apiLimiter: () => limiter }));

const from = (ip: string, url: string) => new Request(url, { headers: { "cf-connecting-ip": ip } });

afterEach(() => {
  vi.unstubAllGlobals();
  limiter.seen.clear();
});

describe("the search and weather routes on the public demo", () => {
  it("answer 429 once a visitor sends too many requests, and count each visitor apart", async () => {
    mockFetch((url) => (url.includes("/v1/search") ? json({ results: [geoResult(1, "Paris")] }) : json(forecast())));
    expect((await geocode(from("203.0.113.7", "http://localhost/api/geocode?q=Paris"))).status).toBe(200);
    expect((await weather(from("203.0.113.7", "http://localhost/api/weather?lat=45&lon=21&tz=Europe/Bucharest"))).status).toBe(200);

    const refused = await geocode(from("203.0.113.7", "http://localhost/api/geocode?q=Paris"));
    expect(refused.status).toBe(429);
    await expect(refused.json()).resolves.toMatchObject({ error: expect.stringContaining("Too many requests") });

    expect((await geocode(from("198.51.100.2", "http://localhost/api/geocode?q=Paris"))).status).toBe(200);
  });
});
