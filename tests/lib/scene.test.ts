import { describe, expect, it } from "vitest";
import type { SunDay } from "@/lib/daylight";
import { dayPart, duration, skyKind, skyPhase, stampGlyph, sunRows } from "@/lib/scene";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
// A normal autumn day: light from 7:00 to 17:00 (UTC), for yesterday, today and tomorrow.
const today = Date.UTC(2026, 9, 30);
const normal: SunDay[] = [-1, 0, 1].map((d) => ({ rise: today + d * DAY + 7 * HOUR, set: today + d * DAY + 17 * HOUR }));
const polarDay: SunDay[] = [-1, 0, 1].map((d) => ({ rise: today + d * DAY, set: today + (d + 1) * DAY }));
const polarNight: SunDay[] = [-1, 0, 1].map((d) => ({ rise: today + d * DAY, set: today + d * DAY }));
const at = (hours: number, minutes = 0) => today + hours * HOUR + minutes * MIN;

describe("skyKind", () => {
  it("tells drizzle, rain, showers and partly cloudy apart", () => {
    expect([0, 1, 2, 3, 45, 53, 63, 81, 73, 86, 95].map(skyKind)).toEqual([
      "clear",
      "clear",
      "partly",
      "overcast",
      "fog",
      "drizzle",
      "rain",
      "rain",
      "snow",
      "snow",
      "storm",
    ]);
  });
});

describe("skyPhase", () => {
  it("names the low sun around sunrise and sunset, and the blue hour beyond it", () => {
    expect(skyPhase(normal, true, at(7, 20))).toBe("dawn");
    expect(skyPhase(normal, false, at(6, 50))).toBe("dawn");
    expect(skyPhase(normal, false, at(6, 30))).toBe("twilight");
    expect(skyPhase(normal, true, at(16, 30))).toBe("dusk");
    expect(skyPhase(normal, false, at(17, 40))).toBe("twilight");
    expect(skyPhase(normal, true, at(12))).toBe("day");
    expect(skyPhase(normal, false, at(23))).toBe("night");
  });

  it("has no dawn or dusk in a polar day or night", () => {
    expect(skyPhase(polarDay, true, at(0, 10))).toBe("day");
    expect(skyPhase(polarNight, false, at(0, 10))).toBe("night");
  });
});

describe("stampGlyph", () => {
  it("draws sun or moon by day and night, and the low sun only when nothing falls", () => {
    expect(stampGlyph(0, true)).toBe("sun");
    expect(stampGlyph(0, false)).toBe("moon-clear");
    expect(stampGlyph(3, false)).toBe("moon");
    expect(stampGlyph(53, true)).toBe("drizzle-day");
    expect(stampGlyph(3, true, true)).toBe("dawn");
    expect(stampGlyph(63, true, true)).toBe("rain");
  });
});

describe("dayPart", () => {
  it("says day or night in words, with the hour around sunrise and sunset", () => {
    expect(dayPart(normal, true, at(12))).toBe("Daytime");
    expect(dayPart(normal, true, at(7, 30))).toBe("Day, early morning");
    expect(dayPart(normal, true, at(16, 30))).toBe("Day, near sunset");
    expect(dayPart(normal, false, at(6, 20))).toBe("Night, before sunrise");
    expect(dayPart(normal, false, at(23))).toBe("Night");
  });
});

describe("sunRows", () => {
  it("gives the next sunset by day and the next sunrise at night", () => {
    expect(sunRows(normal, at(10, 7))).toEqual([{ label: "Sunset", at: at(17), relative: "in 6 h 53 min" }]);
    expect(sunRows(normal, at(23))).toEqual([{ label: "Sunrise", at: today + DAY + 7 * HOUR, relative: "in 8 h 0 min" }]);
  });

  it("also says when the sun came up, for half an hour after sunrise", () => {
    expect(sunRows(normal, at(7, 10))).toEqual([
      { label: "Sunrise was", at: at(7), relative: "10 min ago" },
      { label: "Sunset", at: at(17), relative: null },
    ]);
  });

  it("has no times in a polar day or night", () => {
    expect(sunRows(polarDay, at(12))).toEqual([{ label: "Sun up all day", at: null, relative: null }]);
    expect(sunRows(polarNight, at(12))[0].label).toBe("No sunrise today");
  });
});

describe("duration", () => {
  it("writes hours and minutes, never less than a minute", () => {
    expect(duration(33 * MIN)).toBe("33 min");
    expect(duration(2 * HOUR + 5 * MIN)).toBe("2 h 5 min");
    expect(duration(10_000)).toBe("1 min");
  });
});
