import { describe, expect, it } from "vitest";
import { formatLocalTime, localHour, localMonth, timeOfDay } from "@/lib/time";

// Friday 30 October 2026, 12:00 UTC
const noonUtc = new Date("2026-10-30T12:00:00Z");

describe("local time", () => {
  it("formats the time in the place's timezone, with AM and PM", () => {
    // Intl puts a narrow no-break space before AM/PM; compare with plain spaces.
    const time = (timezone: string) => formatLocalTime(timezone, noonUtc).replace(/\s/g, " ");
    expect(time("Europe/Bucharest")).toBe("Fri 2:00 PM");
    expect(time("Asia/Tokyo")).toBe("Fri 9:00 PM");
    expect(time("America/Chicago")).toBe("Fri 7:00 AM");
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
