import { describe, expect, it } from "vitest";
import { skyFor, skyStyle } from "@/lib/sky";

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

describe("skyStyle", () => {
  it("paints the sky from top to horizon", () => {
    expect(skyStyle(skyFor("clear", true, 14))).toEqual({
      backgroundColor: "#bfe0f6",
      backgroundImage: "linear-gradient(to bottom, #78b8e9, #bfe0f6)",
      color: "#16202a",
    });
  });
});
