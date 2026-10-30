import { describe, expect, it } from "vitest";
import type { Weather } from "@/lib/schemas";
import { skyFor, skyForWeather, skyStyle, temperatureEffect } from "@/lib/sky";

describe("skyFor", () => {
  it("is light blue on a clear afternoon", () => {
    expect(skyFor("clear", true, false)).toEqual({ top: "#78b8e9", bottom: "#bfe0f6", text: "#16202a" });
  });

  it("is dark with light text at night", () => {
    expect(skyFor("clear", false, false)).toMatchObject({ top: "#07112a", text: "#eef3f8" });
  });

  it("is warm when the sun is low", () => {
    expect(skyFor("cloudy", true, true).top).toBe("#f09b70");
    expect(skyFor("clear", true, true).top).toBe("#f09b70");
  });

  it("keeps rain grey even at sunset", () => {
    expect(skyFor("rain", true, true)).toMatchObject({ top: "#2c3a4a", text: "#eef3f8" });
  });
});

describe("skyForWeather", () => {
  const rise = Date.UTC(2026, 9, 30, 5, 10);
  const set = Date.UTC(2026, 9, 30, 15, 24);
  const clear: Weather = { temperature: 9, weatherCode: 0, windSpeed: 5, isDay: true, high: 14, low: 8, sun: [{ rise, set }] };

  it("turns warm in the hour after the real sunrise, not at a fixed clock time", () => {
    expect(skyForWeather(clear, new Date(rise + 20 * 60_000)).top).toBe("#f09b70");
    expect(skyForWeather(clear, new Date(rise + 3 * 3_600_000)).top).toBe("#78b8e9");
  });
});

describe("temperatureEffect", () => {
  it("is nothing between 0 and 30 °C", () => {
    expect(temperatureEffect(0.1)).toBeNull();
    expect(temperatureEffect(29.9)).toBeNull();
  });

  it("starts the frost at freezing and grows it with the cold", () => {
    expect(temperatureEffect(0)).toEqual({ kind: "frost", level: 0 });
    expect(temperatureEffect(-15)).toEqual({ kind: "frost", level: 0.5 });
    expect(temperatureEffect(-43)).toEqual({ kind: "frost", level: 1 });
  });

  it("starts the heat at 30 °C and grows it to 45 °C", () => {
    expect(temperatureEffect(30)).toEqual({ kind: "heat", level: 0 });
    expect(temperatureEffect(45)).toEqual({ kind: "heat", level: 1 });
    expect(temperatureEffect(50)).toEqual({ kind: "heat", level: 1 });
  });
});

describe("skyStyle", () => {
  it("paints the sky from top to horizon", () => {
    expect(skyStyle(skyFor("clear", true, false))).toEqual({
      backgroundColor: "#bfe0f6",
      backgroundImage: "linear-gradient(to bottom, #78b8e9, #bfe0f6)",
      color: "#16202a",
    });
  });
});
