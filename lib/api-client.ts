type ErrorBody = { error?: string; slot?: number; prompt?: string };

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; slot?: number; prompt?: string };

/** Calls our own API routes from the browser. Never throws: failures come back as { ok: false }. */
export async function callApi<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    return { ok: false, error: "Could not reach the app server. Check that it is still running." };
  }
  const body = (await response.json().catch(() => null)) as (T & ErrorBody) | null;
  if (response.ok && body) return { ok: true, data: body };
  return {
    ok: false,
    error: body?.error ?? `The app server answered with an error (${response.status}).`,
    slot: body?.slot,
    prompt: body?.prompt,
  };
}
