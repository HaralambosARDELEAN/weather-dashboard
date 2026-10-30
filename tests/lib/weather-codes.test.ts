import { describe, expect, it } from "vitest";
import { describeWeather, precipitation } from "@/lib/weather-codes";

describe("precipitation", () => {
  it("tells drizzle from rain and light from heavy", () => {
    expect(precipitation(51)).toEqual({ type: "drizzle", level: 1 });
    expect(precipitation(53)).toEqual({ type: "drizzle", level: 2 });
    expect(precipitation(61)).toEqual({ type: "rain", level: 1 });
    expect(precipitation(65)).toEqual({ type: "rain", level: 3 });
    expect(precipitation(82)).toEqual({ type: "rain", level: 3 });
    expect(precipitation(95)).toEqual({ type: "rain", level: 3 });
  });

  it("grades snow the same way", () => {
    expect(precipitation(71)).toEqual({ type: "snow", level: 1 });
    expect(precipitation(86)).toEqual({ type: "snow", level: 3 });
  });

  it("is nothing for dry weather", () => {
    expect(precipitation(0)).toBeNull();
    expect(precipitation(45)).toBeNull();
  });
});

describe("describeWeather", () => {
  it("describes known WMO codes", () => {
    expect(describeWeather(0)).toEqual({ label: "Clear sky", scene: "a clear sky", kind: "clear" });
    expect(describeWeather(61)).toMatchObject({ label: "Light rain", kind: "rain" });
    expect(describeWeather(75)).toMatchObject({ label: "Heavy snow", kind: "snow" });
    expect(describeWeather(95)).toMatchObject({ kind: "storm" });
  });

  it("falls back for unknown codes", () => {
    expect(describeWeather(42)).toEqual({ label: "Unknown conditions", scene: "changeable weather", kind: "cloudy" });
  });
});
