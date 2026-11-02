import { describe, expect, it } from "vitest";
import { PAINT_LIMITS, limitMessage, takePaint, visitorKey, type CounterStore } from "@/lib/paint-limit";

/** Workers KV as a Map: enough for counters (expiry is not needed within one test). */
function memoryStore(): CounterStore & { keys: () => string[] } {
  const values = new Map<string, string>();
  return {
    get: async (key) => values.get(key) ?? null,
    put: async (key, value) => void values.set(key, value),
    keys: () => [...values.keys()],
  };
}

const HOUR = 3_600_000;
// 2026-11-02 10:15 UTC: 45 minutes to the next hour, 13 h 45 min to the next UTC day.
const NOW = Date.UTC(2026, 10, 2, 10, 15);

describe("takePaint", () => {
  it("lets a visitor paint a few times an hour, then says when it renews", async () => {
    const store = memoryStore();
    for (let i = 0; i < PAINT_LIMITS.perVisitorPerHour; i++) {
      expect(await takePaint(store, "a", NOW)).toEqual({ ok: true });
    }
    expect(await takePaint(store, "a", NOW)).toEqual({ ok: false, scope: "visitor", retryAfterSeconds: 45 * 60 });
  });

  it("counts each visitor apart and starts again the next hour", async () => {
    const store = memoryStore();
    for (let i = 0; i < PAINT_LIMITS.perVisitorPerHour; i++) await takePaint(store, "a", NOW);
    expect((await takePaint(store, "b", NOW)).ok).toBe(true);
    expect((await takePaint(store, "a", NOW + HOUR)).ok).toBe(true);
  });

  it("stops everyone once the day's paintings are used up", async () => {
    const store = memoryStore();
    for (let i = 0; i < PAINT_LIMITS.perDay; i++) {
      expect((await takePaint(store, `visitor-${i}`, NOW)).ok).toBe(true);
    }
    expect(await takePaint(store, "new", NOW)).toEqual({ ok: false, scope: "day", retryAfterSeconds: (13 * 60 + 45) * 60 });
  });

  it("does not count a refused painting", async () => {
    const store = memoryStore();
    for (let i = 0; i < PAINT_LIMITS.perVisitorPerHour + 2; i++) await takePaint(store, "a", NOW);
    expect(await store.get(`paint:day:${Math.floor(NOW / (24 * HOUR))}`)).toBe(String(PAINT_LIMITS.perVisitorPerHour));
  });
});

describe("visitorKey", () => {
  it("is the same for the same address and never contains the address", async () => {
    const key = await visitorKey("203.0.113.7");
    expect(key).toBe(await visitorKey("203.0.113.7"));
    expect(key).not.toBe(await visitorKey("203.0.113.8"));
    expect(key).toMatch(/^[0-9a-f]{24}$/);

    const store = memoryStore();
    await takePaint(store, key, NOW);
    expect(store.keys().join(" ")).not.toContain("203.0.113.7");
  });
});

describe("limitMessage", () => {
  it("says how long to wait, or that the day is over", () => {
    expect(limitMessage({ ok: false, scope: "visitor", retryAfterSeconds: 45 * 60 })).toBe(
      `This public demo paints ${PAINT_LIMITS.perVisitorPerHour} pictures per visitor per hour. Try again in 45 min.`,
    );
    expect(limitMessage({ ok: false, scope: "visitor", retryAfterSeconds: 20 })).toContain("Try again in 1 min.");
    expect(limitMessage({ ok: false, scope: "day", retryAfterSeconds: 3600 })).toBe(
      "Today's paintings on this public demo are used up. Try again tomorrow, or run Skypost with your own OpenAI key (see the README).",
    );
  });
});
