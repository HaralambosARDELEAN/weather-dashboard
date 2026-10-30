import { describe, expect, it } from "vitest";
import { PLACE_SETS } from "@/lib/presets";
import { placeSchema } from "@/lib/schemas";

describe("PLACE_SETS", () => {
  it("has sets with distinct ids", () => {
    const ids = PLACE_SETS.map((set) => set.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(PLACE_SETS.map((set) => [set.title, set] as const))("%s has four valid, different places", (_, set) => {
    expect(set.places).toHaveLength(4);
    for (const place of set.places) expect(placeSchema.safeParse(place).success).toBe(true);
    expect(new Set(set.places.map((place) => place.id)).size).toBe(4);
  });
});
