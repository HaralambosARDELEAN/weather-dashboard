import { describe, expect, it } from "vitest";
import { skyFor, skyStyle, temperatureEffect } from "@/lib/sky";

describe("skyFor", () => {
  it("is light blue on a clear afternoon", () => {
    expect(skyFor("clear", true, 14)).toEqual({ top: "#78b8e9", bottom: "#bfe0f6", text: "#16202a" });
  });

  it("is dark with light text at night", () => {
    expect(skyFor("clear", false, 23)).toMatchObject({ top: "#07112a", text: "#eef3f8" });
  });

  it("is warm when the sun is low", () => {
    expect(skyFor("cloudy", true, 7).top).toBe("#f09b70");
    expect(skyFor("clear", true, 19).top).toBe("#f09b70");
  });

  it("keeps rain grey even at sunset", () => {
    expect(skyFor("rain", true, 19)).toMatchObject({ top: "#2c3a4a", text: "#eef3f8" });
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
    expect(skyStyle(skyFor("clear", true, 14))).toEqual({
      backgroundColor: "#bfe0f6",
      backgroundImage: "linear-gradient(to bottom, #78b8e9, #bfe0f6)",
      color: "#16202a",
    });
  });
});
