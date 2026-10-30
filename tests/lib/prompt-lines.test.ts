import { describe, expect, it } from "vitest";
import { buildPrompt, type PromptEntry } from "@/lib/prompt";
import { paintingAlt, splitPrompt } from "@/lib/prompt-lines";

function entry(name: string, region: string | null, country: string, timezone: string, weather: Partial<PromptEntry["weather"]>): PromptEntry {
  return {
    place: { id: 1, name, region, country, latitude: 45, longitude: 0, timezone },
    weather: { temperature: 12, weatherCode: 0, windSpeed: 10, isDay: true, high: 15, low: 8, sun: [], ...weather },
  };
}

// 12:00 UTC: afternoon in Timișoara, night in Tokyo, early morning in Paris (Texas).
const prompt = buildPrompt(
  [
    entry("Timișoara", "Timiș County", "Romania", "Europe/Bucharest", { weatherCode: 3, temperature: 10.4 }),
    entry("Tokyo", "Tokyo", "Japan", "Asia/Tokyo", { weatherCode: 53, temperature: 8.4, isDay: false }),
    entry("Paris", "Texas", "United States", "America/Chicago", { weatherCode: 0, temperature: -3.2 }),
    entry("Singapore", null, "Singapore", "Asia/Singapore", { weatherCode: 95, temperature: 31, isDay: false }),
  ],
  new Date("2026-10-30T12:00:00Z"),
);

describe("splitPrompt", () => {
  const { panels, rules } = splitPrompt(prompt);

  it("separates the four panel lines from the style and rule lines", () => {
    expect(panels.map((panel) => panel.position)).toEqual(["Top left", "Top right", "Bottom left", "Bottom right"]);
    expect(rules).toHaveLength(6);
    expect(panels[0].text.startsWith("Timișoara, Timiș County, Romania, in the afternoon")).toBe(true);
  });

  it("reads back each panel's place, time of day, temperature and weather code", () => {
    expect(panels.map(({ name, country, night, temperature, code }) => ({ name, country, night, temperature, code }))).toEqual([
      { name: "Timișoara", country: "Romania", night: false, temperature: 10, code: 3 },
      { name: "Tokyo", country: "Japan", night: true, temperature: 8, code: 53 },
      { name: "Paris", country: "United States", night: false, temperature: -3, code: 0 },
      { name: "Singapore", country: "Singapore", night: true, temperature: 31, code: 95 },
    ]);
  });

  it("writes alt text from the panel lines", () => {
    expect(paintingAlt(panels)).toBe(
      "2×2 painting. Top left: Timișoara in the afternoon, overcast. Top right: Tokyo at night, drizzle. " +
        "Bottom left: Paris in the early morning, clear sky. Bottom right: Singapore at night, thunderstorm.",
    );
  });
});
