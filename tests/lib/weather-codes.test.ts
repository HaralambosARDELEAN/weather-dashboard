import { describe, expect, it } from "vitest";
import { describeWeather } from "@/lib/weather-codes";

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
