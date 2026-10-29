import { describe, expect, it } from "vitest";
import { formatLocalTime, localHour, localMonth, timeOfDay } from "@/lib/time";

// Friday 30 October 2026, 12:00 UTC
const noonUtc = new Date("2026-10-30T12:00:00Z");

describe("local time", () => {
  it("formats the time in the place's timezone", () => {
    expect(formatLocalTime("Europe/Bucharest", noonUtc)).toBe("Fri 14:00");
    expect(formatLocalTime("Asia/Tokyo", noonUtc)).toBe("Fri 21:00");
    expect(formatLocalTime("America/Chicago", noonUtc)).toBe("Fri 07:00");
  });

  it("returns the local hour", () => {
    expect(localHour("Asia/Tokyo", noonUtc)).toBe(21);
    expect(localHour("Pacific/Auckland", noonUtc)).toBe(1);
  });

  it("returns the local month", () => {
    const newYearUtc = new Date("2026-12-31T23:30:00Z");
    expect(localMonth("Europe/London", newYearUtc)).toBe(12);
    expect(localMonth("Asia/Tokyo", newYearUtc)).toBe(1);
  });
});

describe("timeOfDay", () => {
  it("uses daylight first, then the hour", () => {
    expect(timeOfDay(21, false)).toBe("at night");
    expect(timeOfDay(7, true)).toBe("in the early morning");
    expect(timeOfDay(10, true)).toBe("in the late morning");
    expect(timeOfDay(14, true)).toBe("in the afternoon");
    expect(timeOfDay(19, true)).toBe("in the evening");
  });
});
