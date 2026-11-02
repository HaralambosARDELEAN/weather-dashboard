import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/image/route";
import { PAINT_LIMITS } from "@/lib/paint-limit";
import { forecast, geoResult, json, mockFetch } from "../helpers";

// The route as it runs on Cloudflare: the paint counters exist (a Map stands in for Workers KV).
const counters = vi.hoisted(() => {
  const values = new Map<string, string>();
  return {
    values,
    get: async (key: string) => values.get(key) ?? null,
    put: async (key: string, value: string) => void values.set(key, value),
  };
});
vi.mock("@/lib/cloudflare", () => ({ paintCounters: () => counters }));

const call = (ip: string) =>
  POST(
    new Request("http://localhost/api/image", {
      method: "POST",
      headers: { "cf-connecting-ip": ip },
      body: JSON.stringify({ placeIds: [1, 2, 3, 4] }),
    }),
  );

const isOpenAI = (url: string) => url.startsWith("https://api.openai.com/");

function services() {
  return mockFetch((url) => {
    if (url.includes("/v1/get")) return json(geoResult(1, "City"));
    if (url.includes("/v1/forecast")) return json(forecast());
    if (isOpenAI(url)) return json({ data: [{ b64_json: "aGVsbG8=" }] });
    throw new Error(`Unexpected request to ${url}`);
  });
}

beforeEach(() => {
  vi.stubEnv("OPENAI_API_KEY", "test-key");
  counters.values.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("POST /api/image on the public demo", () => {
  it("paints a few times per visitor, then refuses with 429 before calling OpenAI", async () => {
    const fake = services();
    for (let i = 0; i < PAINT_LIMITS.perVisitorPerHour; i++) expect((await call("203.0.113.7")).status).toBe(200);

    const refused = await call("203.0.113.7");
    expect(refused.status).toBe(429);
    await expect(refused.json()).resolves.toMatchObject({ error: expect.stringContaining("per visitor per hour") });
    expect(fake.mock.calls.filter(([url]) => isOpenAI(String(url)))).toHaveLength(PAINT_LIMITS.perVisitorPerHour);
  });

  it("counts another visitor apart", async () => {
    services();
    for (let i = 0; i < PAINT_LIMITS.perVisitorPerHour; i++) await call("203.0.113.7");
    expect((await call("198.51.100.2")).status).toBe(200);
  });
});
