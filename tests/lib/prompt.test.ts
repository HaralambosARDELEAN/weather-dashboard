import { describe, expect, it } from "vitest";
import { buildPrompt, temperatureFeel, windFeel, type PromptEntry } from "@/lib/prompt";

// 12:00 UTC: 14:00 in Timișoara and Cairo, 21:00 in Tokyo, 13:00 in Oslo
const noonUtc = new Date("2026-10-30T12:00:00Z");

function entry(
  name: string,
  region: string | null,
  country: string,
  timezone: string,
  weather: Partial<PromptEntry["weather"]>,
): PromptEntry {
  return {
    place: { id: 1, name, region, country, latitude: 0, longitude: 0, timezone },
    weather: { temperature: 12, weatherCode: 0, windSpeed: 10, isDay: true, high: 15, low: 8, ...weather },
  };
}

const entries = [
  entry("Timișoara", "Timiș", "Romania", "Europe/Bucharest", { weatherCode: 61, temperature: 11.7 }),
  entry("Tokyo", "Tokyo", "Japan", "Asia/Tokyo", { isDay: false, temperature: 8.4 }),
  entry("Cairo", "Cairo", "Egypt", "Africa/Cairo", { temperature: 31.2, windSpeed: 3 }),
  entry("Oslo", null, "Norway", "Europe/Oslo", { weatherCode: 73, temperature: -3, windSpeed: 45 }),
];

describe("buildPrompt", () => {
  const prompt = buildPrompt(entries, noonUtc);

  it("describes the four panels in reading order", () => {
    const lines = prompt.split("\n").filter((line) => /^(Top|Bottom) (left|right):/.test(line));
    expect(lines).toEqual([
      "Top left: Timișoara, Timiș, Romania, in the afternoon. Weather: light rain, cool at 12°C, a light breeze.",
      "Top right: Tokyo, Japan, at night. Weather: a clear sky, cold at 8°C, a light breeze.",
      "Bottom left: Cairo, Egypt, in the afternoon. Weather: a clear sky, warm at 31°C, still air.",
      "Bottom right: Oslo, Norway, in the afternoon. Weather: steady snowfall, freezing at -3°C, strong wind.",
    ]);
  });

  it("asks for a 2x2 grid with labelled panels", () => {
    expect(prompt).toContain("2x2 grid");
    expect(prompt).toContain("Write each place name");
  });

  it("needs exactly four places", () => {
    expect(() => buildPrompt(entries.slice(0, 3), noonUtc)).toThrow("exactly 4");
  });
});

describe("feels", () => {
  it("bands temperature and wind", () => {
    expect(temperatureFeel(-12)).toBe("bitterly cold");
    expect(temperatureFeel(0)).toBe("cold");
    expect(temperatureFeel(24.9)).toBe("mild");
    expect(temperatureFeel(35)).toBe("hot");
    expect(windFeel(2)).toBe("still air");
    expect(windFeel(70)).toBe("a gale");
  });
});
