import type { Weather } from "./schemas";
import { localHour } from "./time";
import { describeWeather, type WeatherKind } from "./weather-codes";

export type Sky = { background: string; text: string };

const INK = "#16202a";
const LIGHT = "#eef3f8";

// Every pair keeps text contrast at 4.5:1 or more, also for the 70% faded labels.
const DAY: Record<WeatherKind, Sky> = {
  clear: { background: "#8fc8ee", text: INK },
  cloudy: { background: "#c3ced6", text: INK },
  fog: { background: "#dcdfdb", text: INK },
  rain: { background: "#3f5063", text: LIGHT },
  snow: { background: "#e6edf2", text: INK },
  storm: { background: "#33354a", text: LIGHT },
};

const NIGHT: Record<WeatherKind, Sky> = {
  clear: { background: "#13213b", text: LIGHT },
  cloudy: { background: "#272e39", text: LIGHT },
  fog: { background: "#30353b", text: LIGHT },
  rain: { background: "#1d2531", text: LIGHT },
  snow: { background: "#3a4657", text: LIGHT },
  storm: { background: "#191b26", text: LIGHT },
};

const LOW_SUN: Sky = { background: "#f0b487", text: INK };

/** The card colour: roughly what the sky looks like there right now. */
export function skyFor(kind: WeatherKind, isDay: boolean, hour: number): Sky {
  if (!isDay) return NIGHT[kind];
  const sunIsLow = hour < 8 || hour >= 18;
  if (sunIsLow && (kind === "clear" || kind === "cloudy")) return LOW_SUN;
  return DAY[kind];
}

/** The sky for a place's current weather, at its local time. */
export function skyForWeather(weather: Weather, timezone: string, now: Date): Sky {
  return skyFor(describeWeather(weather.weatherCode).kind, weather.isDay, localHour(timezone, now));
}
