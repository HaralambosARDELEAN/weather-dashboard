import type { SunDay } from "./daylight";
import { sunState } from "./daylight";

/** What the sky shows, from the WMO code. Finer than WeatherKind: drizzle and partly cloudy look different. */
export type SkyKind = "clear" | "partly" | "overcast" | "fog" | "drizzle" | "rain" | "snow" | "storm";

/** The light: dawn and dusk are the low sun, twilight the hour of blue light around them. */
export type SkyPhase = "day" | "night" | "dawn" | "dusk" | "twilight";

export function skyKind(code: number): SkyKind {
  if (code <= 1) return "clear";
  if (code === 2) return "partly";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95 && code <= 99) return "storm";
  return "overcast";
}

const MIN = 60_000;
// Open-Meteo marks a polar day as sunrise at midnight and sunset at the next midnight: no real sunrise.
const POLAR_DAY_MS = 86_400_000 - MIN;

function realDays(sun: SunDay[]): SunDay[] {
  return sun.filter((day) => day.set > day.rise && day.set - day.rise < POLAR_DAY_MS);
}

const within = (now: number, at: number, fromMin: number, toMin: number) => now >= at + fromMin * MIN && now <= at + toMin * MIN;

export function skyPhase(sun: SunDay[], isDay: boolean, now: number): SkyPhase {
  const days = realDays(sun);
  if (days.some((day) => within(now, day.rise, -15, 40))) return "dawn";
  if (days.some((day) => within(now, day.set, -40, 15))) return "dusk";
  if (days.some((day) => within(now, day.rise, -60, -15) || within(now, day.set, 15, 60))) return "twilight";
  return isDay ? "day" : "night";
}

/** The weather glyph on a stamp. */
export type Glyph =
  | "sun"
  | "moon-clear"
  | "partly-day"
  | "moon"
  | "cloud"
  | "fog"
  | "drizzle"
  | "drizzle-day"
  | "rain"
  | "snow"
  | "storm"
  | "dawn";

export function stampGlyph(code: number, isDay: boolean, lowSun = false): Glyph {
  const kind = skyKind(code);
  if (lowSun && (kind === "clear" || kind === "partly" || kind === "overcast")) return "dawn";
  switch (kind) {
    case "clear":
      return isDay ? "sun" : "moon-clear";
    case "partly":
      return isDay ? "partly-day" : "moon";
    case "overcast":
      return isDay ? "cloud" : "moon";
    case "fog":
      return "fog";
    case "drizzle":
      return isDay ? "drizzle-day" : "drizzle";
    case "rain":
      return "rain";
    case "snow":
      return "snow";
    case "storm":
      return "storm";
  }
}

/** Day or night in words, with the hour around sunrise and sunset named. Day and night follow the API's is_day. */
export function dayPart(sun: SunDay[], isDay: boolean, now: number): string {
  const days = realDays(sun);
  if (isDay) {
    if (days.some((day) => within(now, day.rise, 0, 60))) return "Day, early morning";
    if (days.some((day) => within(now, day.set, -60, 0))) return "Day, near sunset";
    return "Daytime";
  }
  if (days.some((day) => within(now, day.rise, -60, 0))) return "Night, before sunrise";
  return "Night";
}

/** "6 h 53 min", "33 min". */
export function duration(ms: number): string {
  const minutes = Math.max(1, Math.round(Math.abs(ms) / MIN));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours} h ${minutes % 60} min` : `${minutes} min`;
}

/** One line of the sun facts on a card. `at` is null for a polar day or night. */
export type SunRow = { label: string; at: number | null; relative: string | null };

/** The next sunrise or sunset; just after sunrise, also when the sun came up. */
export function sunRows(sun: SunDay[], now: number): SunRow[] {
  const state = sunState(sun, now);
  if (state.until === null) return [{ label: state.kind === "day" ? "Sun up all day" : "No sunrise today", at: null, relative: null }];
  const next: SunRow = {
    label: state.kind === "day" ? "Sunset" : "Sunrise",
    at: state.until,
    relative: `in ${duration(state.until - now)}`,
  };
  const risen = realDays(sun).find((day) => now >= day.rise && now - day.rise <= 30 * MIN);
  if (risen && state.kind === "day") {
    return [{ label: "Sunrise was", at: risen.rise, relative: `${duration(now - risen.rise)} ago` }, { ...next, relative: null }];
  }
  return [next];
}
