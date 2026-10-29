import { vi } from "vitest";

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** Replaces global fetch. The handler gets the URL and returns the fake response. */
export function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const fake = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => handler(String(input), init));
  vi.stubGlobal("fetch", fake);
  return fake;
}

/** What fetch throws when AbortSignal.timeout() fires. */
export function timeoutError(): DOMException {
  return new DOMException("The operation was aborted due to timeout", "TimeoutError");
}

export function geoResult(id: number, name: string, timezone = "Europe/Bucharest") {
  return { id, name, latitude: 45.75, longitude: 21.23, country: "Romania", admin1: "Timiș", timezone };
}

export function forecast(current: Record<string, number> = {}) {
  return {
    current: { temperature_2m: 11.7, weather_code: 61, wind_speed_10m: 11.9, is_day: 1, ...current },
    daily: { temperature_2m_max: [15.9], temperature_2m_min: [8.2] },
  };
}
