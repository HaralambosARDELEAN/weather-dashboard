import { describe, expect, it } from "vitest";
import { buildPrompt, seasonAt, temperatureFeel, windFeel, type PromptEntry } from "@/lib/prompt";

// 12:00 UTC on 30 October: 14:00 in Timișoara and Cairo, 21:00 in Tokyo, 13:00 in Oslo
const noonUtc = new Date("2026-10-30T12:00:00Z");

function entry(
  name: string,
  region: string | null,
  country: string,
  timezone: string,
  latitude: number,
  weather: Partial<PromptEntry["weather"]>,
): PromptEntry {
  return {
    place: { id: 1, name, region, country, latitude, longitude: 0, timezone },
    weather: { temperature: 12, weatherCode: 0, windSpeed: 10, isDay: true, high: 15, low: 8, ...weather },
  };
}

const entries = [
  entry("Timișoara", "Timiș", "Romania", "Europe/Bucharest", 45.75, { weatherCode: 61, temperature: 11.7 }),
  entry("Tokyo", "Tokyo", "Japan", "Asia/Tokyo", 35.69, { isDay: false, temperature: 8.4 }),
  entry("Cairo", "Cairo", "Egypt", "Africa/Cairo", 30.06, { temperature: 31.2, windSpeed: 3 }),
  entry("Sydney", "New South Wales", "Australia", "Australia/Sydney", -33.87, { weatherCode: 73, temperature: -3, windSpeed: 45, isDay: false }),
];

describe("buildPrompt", () => {
  const prompt = buildPrompt(entries, noonUtc);

  it("describes the four panels in reading order, with each place's own season", () => {
    const lines = prompt.split("\n").filter((line) => /^(Top|Bottom) (left|right):/.test(line));
    expect(lines).toEqual([
      "Top left: Timișoara, Timiș, Romania, in the afternoon in autumn. Weather: light rain, cool at 12°C, a light breeze.",
      "Top right: Tokyo, Japan, at night in autumn. Weather: a clear sky, cold at 8°C, a light breeze.",
      "Bottom left: Cairo, Egypt, in the afternoon in autumn. Weather: a clear sky, warm at 31°C, still air.",
      "Bottom right: Sydney, New South Wales, Australia, at night in spring. Weather: steady snowfall, freezing at -3°C, strong wind.",
    ]);
  });

  it("asks for a 2x2 grid with labelled panels that match their season", () => {
    expect(prompt).toContain("2x2 grid");
    expect(prompt).toContain("Write each place name");
    expect(prompt).toContain("season");
  });

  it("leaves the season out near the equator", () => {
    const tropical = [...entries.slice(0, 3), entry("Singapore", null, "Singapore", "Asia/Singapore", 1.35, { isDay: false })];
    const line = buildPrompt(tropical, noonUtc).split("\n").find((l) => l.startsWith("Bottom right:"));
    expect(line).toBe("Bottom right: Singapore, at night. Weather: a clear sky, cool at 12°C, a light breeze.");
  });

  it("needs exactly four places", () => {
    expect(() => buildPrompt(entries.slice(0, 3), noonUtc)).toThrow("exactly 4");
  });
});

describe("seasonAt", () => {
  it("follows the hemisphere", () => {
    expect(seasonAt(45, 10)).toBe("autumn");
    expect(seasonAt(-34, 10)).toBe("spring");
    expect(seasonAt(52, 1)).toBe("winter");
    expect(seasonAt(-41, 1)).toBe("summer");
  });

  it("has no season in the tropics", () => {
    expect(seasonAt(1.35, 7)).toBeNull();
    expect(seasonAt(-20, 7)).toBeNull();
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
