import { describe, expect, it } from "vitest";
import { listNames, nameSize, placeDetails, placeLabel } from "@/lib/format";

describe("place formatting", () => {
  it("shows region and country", () => {
    const place = { name: "Springfield", region: "Illinois", country: "United States" };
    expect(placeDetails(place)).toBe("Illinois, United States");
    expect(placeLabel(place)).toBe("Springfield, Illinois, United States");
  });

  it("drops a region that repeats the name", () => {
    expect(placeLabel({ name: "Tokyo", region: "Tokyo", country: "Japan" })).toBe("Tokyo, Japan");
  });

  it("copes with a missing region", () => {
    expect(placeLabel({ name: "Oslo", region: null, country: "Norway" })).toBe("Oslo, Norway");
    expect(placeLabel({ name: "Monaco", region: null, country: "Monaco" })).toBe("Monaco");
  });
});

describe("nameSize", () => {
  it("shrinks long names", () => {
    expect(nameSize("Tokyo")).toBe("large");
    expect(nameSize("Ho Chi Minh City")).toBe("medium");
    expect(nameSize("Llanfairpwllgwyngyll")).toBe("small");
  });
});

describe("listNames", () => {
  it("joins names in plain English", () => {
    expect(listNames(["A", "B", "C", "D"])).toBe("A, B, C and D");
    expect(listNames(["A"])).toBe("A");
  });
});
