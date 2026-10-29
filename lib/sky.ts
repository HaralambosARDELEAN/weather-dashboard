import type { CSSProperties } from "react";
import type { Weather } from "./schemas";
import { localHour } from "./time";
import { describeWeather, type WeatherKind } from "./weather-codes";

/** A sky as a vertical gradient (top of the sky to the horizon) and the text colour that reads on it. */
export type Sky = { top: string; bottom: string; text: string };

const INK = "#16202a";
const LIGHT = "#eef3f8";

// Text keeps a contrast of 4.5:1 or more at both ends, also for the labels faded to 80%.
const DAY: Record<WeatherKind, Sky> = {
  clear: { top: "#78b8e9", bottom: "#bfe0f6", text: INK },
  cloudy: { top: "#a7b7c4", bottom: "#d3dce3", text: INK },
  fog: { top: "#c6cbc8", bottom: "#e5e8e4", text: INK },
  rain: { top: "#2c3a4a", bottom: "#3f5164", text: LIGHT },
  snow: { top: "#c9d7e2", bottom: "#eef3f7", text: INK },
  storm: { top: "#1e1f2d", bottom: "#3a3d55", text: LIGHT },
};

const NIGHT: Record<WeatherKind, Sky> = {
  clear: { top: "#07112a", bottom: "#1c315f", text: LIGHT },
  cloudy: { top: "#181e27", bottom: "#333c4a", text: LIGHT },
  fog: { top: "#24282e", bottom: "#3e444c", text: LIGHT },
  rain: { top: "#121821", bottom: "#283241", text: LIGHT },
  snow: { top: "#2a3444", bottom: "#3e4a5b", text: LIGHT },
  storm: { top: "#0e0f17", bottom: "#252737", text: LIGHT },
};

const LOW_SUN: Sky = { top: "#f09b70", bottom: "#f6caa0", text: INK };

/** The card colours: roughly what the sky looks like there right now. */
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

export function skyStyle(sky: Sky): CSSProperties {
  return {
    backgroundColor: sky.bottom,
    backgroundImage: `linear-gradient(to bottom, ${sky.top}, ${sky.bottom})`,
    color: sky.text,
  };
}
