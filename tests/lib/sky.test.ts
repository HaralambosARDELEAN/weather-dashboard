import { describe, expect, it } from "vitest";
import { skyFor } from "@/lib/sky";

describe("skyFor", () => {
  it("is light blue on a clear afternoon", () => {
    expect(skyFor("clear", true, 14)).toEqual({ background: "#8fc8ee", text: "#16202a" });
  });

  it("is dark with light text at night", () => {
    expect(skyFor("clear", false, 23)).toEqual({ background: "#13213b", text: "#eef3f8" });
  });

  it("is warm when the sun is low", () => {
    expect(skyFor("cloudy", true, 7).background).toBe("#f0b487");
    expect(skyFor("clear", true, 19).background).toBe("#f0b487");
  });

  it("keeps rain grey even at sunset", () => {
    expect(skyFor("rain", true, 19)).toEqual({ background: "#3f5063", text: "#eef3f8" });
  });
});
