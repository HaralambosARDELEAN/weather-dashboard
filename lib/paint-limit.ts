// Limits on painting for the public demo, so nobody can spend the OpenAI credit without end.

/** Expiring counters: Workers KV on Cloudflare, a Map in the tests. */
export type CounterStore = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options: { expirationTtl: number }): Promise<void>;
};

export const PAINT_LIMITS = { perVisitorPerHour: 10, perDay: 25 } as const;

export type PaintVerdict = { ok: true } | { ok: false; scope: "visitor" | "day"; retryAfterSeconds: number };

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** A one-way hash of the visitor's IP address, so the address itself is never stored. */
export async function visitorKey(ip: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(digest).slice(0, 12), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function count(store: CounterStore, key: string): Promise<number> {
  return Number(await store.get(key)) || 0;
}

/**
 * Takes one painting from the visitor's allowance for this clock hour and from the demo's for this UTC day,
 * or says which one is used up and when it renews. KV is eventually consistent, so a burst can pass a limit
 * by one or two: fine for a guard on cost.
 */
export async function takePaint(store: CounterStore, visitor: string, now: number): Promise<PaintVerdict> {
  const hour = Math.floor(now / HOUR);
  const day = Math.floor(now / DAY);
  const visitorCounter = `paint:visitor:${visitor}:${hour}`;
  const dayCounter = `paint:day:${day}`;
  const [used, usedToday] = await Promise.all([count(store, visitorCounter), count(store, dayCounter)]);

  if (usedToday >= PAINT_LIMITS.perDay) {
    return { ok: false, scope: "day", retryAfterSeconds: Math.ceil(((day + 1) * DAY - now) / 1000) };
  }
  if (used >= PAINT_LIMITS.perVisitorPerHour) {
    return { ok: false, scope: "visitor", retryAfterSeconds: Math.ceil(((hour + 1) * HOUR - now) / 1000) };
  }
  // The counters outlive their window a little, then KV deletes them.
  await Promise.all([
    store.put(visitorCounter, String(used + 1), { expirationTtl: 2 * 60 * 60 }),
    store.put(dayCounter, String(usedToday + 1), { expirationTtl: 2 * 24 * 60 * 60 }),
  ]);
  return { ok: true };
}

/** What the page shows when a painting is refused. */
export function limitMessage(verdict: Extract<PaintVerdict, { ok: false }>): string {
  if (verdict.scope === "day") {
    return "Today's paintings on this public demo are used up. Try again tomorrow, or run Skypost with your own OpenAI key (see the README).";
  }
  const minutes = Math.max(1, Math.ceil(verdict.retryAfterSeconds / 60));
  return `This public demo paints ${PAINT_LIMITS.perVisitorPerHour} pictures per visitor per hour. Try again in ${minutes} min.`;
}
