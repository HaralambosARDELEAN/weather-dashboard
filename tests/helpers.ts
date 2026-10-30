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

/** Sunrise and sunset (UTC seconds) that the forecast mock returns for yesterday, today and tomorrow. */
export const SUNRISE = [1793250634, 1793337117, 1793423601];
export const SUNSET = [1793287580, 1793373891, 1793460203];

export function forecast(current: Record<string, number> = {}) {
  return {
    current: { temperature_2m: 11.7, weather_code: 61, wind_speed_10m: 11.9, is_day: 1, ...current },
    // Yesterday, today, tomorrow: only the middle values are today's.
    daily: {
      temperature_2m_max: [14.1, 15.9, 13.0],
      temperature_2m_min: [7.4, 8.2, 6.9],
      sunrise: SUNRISE,
      sunset: SUNSET,
    },
  };
}

/** The `sun` field getWeather builds from the forecast mock. */
export const SUN = SUNRISE.map((rise, i) => ({ rise: rise * 1000, set: SUNSET[i] * 1000 }));
