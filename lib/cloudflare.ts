import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CounterStore } from "./paint-limit";

/** The Workers Rate Limiting binding: each key may call it as often per minute as wrangler.jsonc allows. */
export type RequestLimiter = { limit(options: { key: string }): Promise<{ success: boolean }> };

/**
 * A binding from wrangler.jsonc when the app runs on Cloudflare. Elsewhere (`next dev`, `next start`, the tests)
 * there is no Cloudflare context and no limit: someone running Skypost with their own key uses it freely.
 */
function binding<T>(name: string): T | null {
  try {
    return ((getCloudflareContext().env as Record<string, unknown>)[name] as T | undefined) ?? null;
  } catch {
    return null;
  }
}

/** The paint counters (Workers KV). */
export const paintCounters = () => binding<CounterStore>("PAINT_COUNTERS");

/** The per-visitor request limit on the API routes. */
export const apiLimiter = () => binding<RequestLimiter>("API_LIMITER");
