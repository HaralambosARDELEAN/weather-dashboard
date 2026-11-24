import { apiLimiter } from "./cloudflare";
import { ApiError } from "./http";
import { visitorKey } from "./paint-limit";

/** The visitor's address as Cloudflare saw it (Cloudflare sets this header itself); "unknown" elsewhere. */
export function clientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") ?? "unknown";
}

/** On Cloudflare, each visitor may call the API routes only so often a minute (API_LIMITER in wrangler.jsonc). */
export async function limitRequests(request: Request): Promise<void> {
  const limiter = apiLimiter();
  if (!limiter) return;
  const { success } = await limiter.limit({ key: await visitorKey(clientIp(request)) });
  if (!success) throw new ApiError("Too many requests. Wait a minute and try again.", 429);
}

/**
 * The paint route answers only our own page: a JSON body, and not a request that another site's page sends
 * through the visitor's browser (browsers say so in Sec-Fetch-Site). Tools like curl send no Sec-Fetch-Site;
 * the per-visitor limits cover them.
 */
export function assertOwnPage(request: Request): void {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new ApiError("Send the places as JSON.", 415);
  }
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") throw new ApiError("This request did not come from the Skypost page.", 403);
}
