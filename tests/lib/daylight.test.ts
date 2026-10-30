import { describe, expect, it } from "vitest";
import { daylightSegments, sunIsLow, sunState, type SunDay } from "@/lib/daylight";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
// Midnight at the start of "today", and a normal autumn day: light from 7:00 to 17:00.
const today = Date.UTC(2026, 9, 30);
const normal: SunDay[] = [-1, 0, 1].map((d) => ({ rise: today + d * DAY + 7 * HOUR, set: today + d * DAY + 17 * HOUR }));
// Polar night: Open-Meteo gives sunrise and sunset at the same midnight.
const polarNight: SunDay[] = [-1, 0, 1].map((d) => ({ rise: today + d * DAY, set: today + d * DAY }));
// Polar day: sunrise at midnight, sunset at the next midnight.
const polarDay: SunDay[] = [-1, 0, 1].map((d) => ({ rise: today + d * DAY, set: today + (d + 1) * DAY }));

describe("daylightSegments", () => {
  it("places each day's light in the window, as fractions of it", () => {
    const now = today + 12 * HOUR;
    const segments = daylightSegments(normal, now - 12 * HOUR, now + 12 * HOUR);
    expect(segments).toEqual([{ start: 7 / 24, end: 17 / 24 }]);
  });

  it("cuts light at the window's edges", () => {
    const now = today + 20 * HOUR; // window: 8:00 today to 8:00 tomorrow
    expect(daylightSegments(normal, now - 12 * HOUR, now + 12 * HOUR)).toEqual([
      { start: 0, end: 9 / 24 },
      { start: 23 / 24, end: 1 },
    ]);
  });

  it("has no light in a polar night and only light in a polar day", () => {
    const now = today + 12 * HOUR;
    expect(daylightSegments(polarNight, now - 12 * HOUR, now + 12 * HOUR)).toEqual([]);
    expect(daylightSegments(polarDay, now - 12 * HOUR, now + 12 * HOUR)).toEqual([{ start: 0, end: 1 }]);
  });
});

describe("sunState", () => {
  it("is day until sunset and night until the next sunrise", () => {
    expect(sunState(normal, today + 12 * HOUR)).toEqual({ kind: "day", until: today + 17 * HOUR });
    expect(sunState(normal, today + 20 * HOUR)).toEqual({ kind: "night", until: today + DAY + 7 * HOUR });
  });

  it("has no change to show in a polar night or a polar day", () => {
    expect(sunState(polarNight, today + 12 * HOUR)).toEqual({ kind: "night", until: null });
    expect(sunState(polarDay, today + 12 * HOUR)).toEqual({ kind: "day", until: null });
  });
});

describe("sunIsLow", () => {
  it("is true in the hour after sunrise and the hour before sunset", () => {
    expect(sunIsLow(normal, today + 7.5 * HOUR)).toBe(true);
    expect(sunIsLow(normal, today + 16.5 * HOUR)).toBe(true);
  });

  it("is false at noon, at night and in a polar day", () => {
    expect(sunIsLow(normal, today + 12 * HOUR)).toBe(false);
    expect(sunIsLow(normal, today + 22 * HOUR)).toBe(false);
    expect(sunIsLow(polarDay, today + 30 * 60_000)).toBe(false);
  });
});
