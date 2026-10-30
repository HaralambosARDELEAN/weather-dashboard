import { z } from "zod";
import { ApiError, request } from "./http";
import type { Place, Weather } from "./schemas";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const options = {
  timeoutMs: 8_000,
  timeoutMessage: "The weather service did not answer in time. Try again.",
  networkMessage: "Could not reach the weather service. Check your connection and try again.",
};

// Open-Meteo answers 429 "Too many concurrent requests" when several requests arrive at once
// (four cards loading, or the picture asking for four places). Those are worth one or two more tries.
const RETRY_DELAYS_MS = [400, 1200];
const TRANSIENT = new Set([429, 502, 503, 504]);

async function fetchOpenMeteo(url: string) {
  let response = await request(url, options);
  for (const delay of RETRY_DELAYS_MS) {
    if (!TRANSIENT.has(response.status)) break;
    await new Promise((resolve) => setTimeout(resolve, delay));
    response = await request(url, options);
  }
  return response;
}

const geoResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  country: z.string().optional(),
  admin1: z.string().optional(),
  timezone: z.string().optional(),
});

// Open-Meteo leaves out "results" when nothing matches.
const searchResponseSchema = z.object({ results: z.array(geoResultSchema).optional() });

const forecastSchema = z.object({
  current: z.object({
    temperature_2m: z.number(),
    weather_code: z.number(),
    wind_speed_10m: z.number(),
    is_day: z.number(),
  }),
  daily: z.object({
    temperature_2m_max: z.array(z.number()).min(1),
    temperature_2m_min: z.array(z.number()).min(1),
  }),
});

type GeoResult = z.infer<typeof geoResultSchema>;

// Without a timezone we cannot show the local time, so such results are dropped.
function toPlace(result: GeoResult): Place | null {
  if (!result.timezone) return null;
  return {
    id: result.id,
    name: result.name,
    region: result.admin1 ?? null,
    country: result.country ?? "",
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone,
  };
}

export async function searchPlaces(query: string): Promise<Place[]> {
  const params = new URLSearchParams({ name: query, count: "8", language: "en", format: "json" });
  const response = await fetchOpenMeteo(`${GEOCODING_URL}/search?${params}`);
  if (!response.ok) throw new ApiError("The place search is not available right now. Try again in a moment.", 502);

  const parsed = searchResponseSchema.safeParse(response.body);
  if (!parsed.success) throw new ApiError("The place search sent data we could not read. Try again.", 502);
  return (parsed.data.results ?? []).map(toPlace).filter((place) => place !== null);
}

export async function getPlace(id: number): Promise<Place> {
  const params = new URLSearchParams({ id: String(id), language: "en" });
  const response = await fetchOpenMeteo(`${GEOCODING_URL}/get?${params}`);
  const parsed = geoResultSchema.safeParse(response.body);
  const place = response.ok && parsed.success ? toPlace(parsed.data) : null;
  if (!place) throw new ApiError("This place could not be found any more. Replace it and try again.", 502);
  return place;
}

export async function getWeather(place: Pick<Place, "latitude" | "longitude" | "timezone">): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: "temperature_2m,weather_code,wind_speed_10m,is_day",
    daily: "temperature_2m_max,temperature_2m_min",
    timezone: place.timezone, // so "today" means today in that place
    forecast_days: "1",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
  });
  const response = await fetchOpenMeteo(`${FORECAST_URL}?${params}`);
  if (!response.ok) throw new ApiError("The weather service returned an error. Try again in a moment.", 502);

  const parsed = forecastSchema.safeParse(response.body);
  if (!parsed.success) throw new ApiError("The weather service sent data we could not read. Try again.", 502);

  const { current, daily } = parsed.data;
  return {
    temperature: current.temperature_2m,
    weatherCode: current.weather_code,
    windSpeed: current.wind_speed_10m,
    isDay: current.is_day === 1,
    high: daily.temperature_2m_max[0],
    low: daily.temperature_2m_min[0],
  };
}
