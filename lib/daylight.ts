/** One day's sunrise and sunset, in epoch milliseconds. */
export type SunDay = { rise: number; set: number };

const DAY_MS = 86_400_000;
// Open-Meteo marks a polar day as sunrise at midnight and sunset at the next midnight.
const POLAR_DAY_MS = DAY_MS - 60_000;
const LOW_SUN_MS = 60 * 60_000;

/** Daylight as [start, end], joined where one day's light runs into the next (polar day). */
function intervals(days: SunDay[]): [number, number][] {
  // A polar night has sunrise and sunset at the same moment: no light at all.
  const lit = days.filter((day) => day.set > day.rise).sort((a, b) => a.rise - b.rise);
  const merged: [number, number][] = [];
  for (const { rise, set } of lit) {
    const last = merged.at(-1);
    if (last && rise <= last[1] + 60_000) last[1] = Math.max(last[1], set);
    else merged.push([rise, set]);
  }
  return merged;
}

/** The parts of the window [from, to] that are daylight, as fractions of the window. */
export function daylightSegments(days: SunDay[], from: number, to: number): { start: number; end: number }[] {
  const span = to - from;
  return intervals(days)
    .map(([start, end]) => [Math.max(start, from), Math.min(end, to)] as const)
    .filter(([start, end]) => end > start)
    .map(([start, end]) => ({ start: (start - from) / span, end: (end - from) / span }));
}

/** Day or night now, and when that changes; `until` is null when the change is past the days we have. */
export type SunState = { kind: "day" | "night"; until: number | null };

export function sunState(days: SunDay[], now: number): SunState {
  const light = intervals(days);
  const current = light.find(([start, end]) => now >= start && now < end);
  if (current) {
    const last = days.at(-1);
    const runsOn = last !== undefined && last.set - last.rise >= POLAR_DAY_MS && current[1] === last.set;
    return { kind: "day", until: runsOn ? null : current[1] };
  }
  const next = light.find(([start]) => start > now);
  return { kind: "night", until: next ? next[0] : null };
}

/** The hour after sunrise and the hour before sunset, when the light turns warm. Never in a polar day. */
export function sunIsLow(days: SunDay[], now: number): boolean {
  return days.some(({ rise, set }) => {
    if (set <= rise || set - rise >= POLAR_DAY_MS) return false;
    return (now >= rise && now < rise + LOW_SUN_MS) || (now <= set && now > set - LOW_SUN_MS);
  });
}
