import { describe, expect, it } from "vitest";
import { parseSlots } from "@/lib/storage";

const place = {
  id: 1,
  name: "Timișoara",
  region: "Timiș",
  country: "Romania",
  latitude: 45.75,
  longitude: 21.23,
  timezone: "Europe/Bucharest",
};

describe("parseSlots", () => {
  it("starts with four empty slots", () => {
    expect(parseSlots(null)).toEqual([null, null, null, null]);
  });

  it("reads saved places", () => {
    const saved = JSON.stringify([place, null, null, place]);
    expect(parseSlots(saved)).toEqual([place, null, null, place]);
  });

  it("ignores broken or old data", () => {
    expect(parseSlots("{not json")).toEqual([null, null, null, null]);
    expect(parseSlots(JSON.stringify([place]))).toEqual([null, null, null, null]);
    expect(parseSlots(JSON.stringify([{ id: "x" }, null, null, null]))).toEqual([null, null, null, null]);
  });
});
