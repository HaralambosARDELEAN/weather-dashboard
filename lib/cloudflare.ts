import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CounterStore } from "./paint-limit";

/**
 * The paint counters (Workers KV) when the app runs on Cloudflare. Elsewhere (`next dev`, `next start`, the tests)
 * there is no Cloudflare context and no limit: someone running Skypost with their own key paints freely.
 */
export function paintCounters(): CounterStore | null {
  try {
    return (getCloudflareContext().env as { PAINT_COUNTERS?: CounterStore }).PAINT_COUNTERS ?? null;
  } catch {
    return null;
  }
}
