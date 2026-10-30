import { describe, expect, it } from "vitest";
import { clockTime, longDate, miniLabel, postmarkDate, postmarkName, stampCountry } from "@/lib/postal";
import { PLACE_SETS } from "@/lib/presets";

describe("stampCountry", () => {
  it("uses the native name, the plain name or a short code", () => {
    expect(stampCountry("Romania")).toBe("ROMÂNIA");
    expect(stampCountry("Iceland")).toBe("ÍSLAND");
    expect(stampCountry("Singapore")).toBe("SINGAPORE");
    expect(stampCountry("United States")).toBe("USA");
    expect(stampCountry("Central African Republic")).toBe("CAR");
  });
});

describe("miniLabel", () => {
  it("tells same-name places apart by region and shows the country otherwise", () => {
    const [clock, paris, climates] = PLACE_SETS;
    expect(paris.places.map((place) => miniLabel(place, paris.places))).toEqual(["France", "Texas", "Ontario", "Kentucky"]);
    expect(clock.places.map((place) => miniLabel(place, clock.places))).toEqual(["Japan", "Romania", "USA", "Australia"]);
    expect(miniLabel(climates.places[1], climates.places)).toBe("UAE");
  });
});

describe("postmarkName", () => {
  it("gets smaller as the name gets longer and cuts very long names at a word", () => {
    expect(postmarkName("Timișoara")).toEqual({ text: "TIMIȘOARA", size: 8.6, spacing: 1.4 });
    expect(postmarkName("Rio de Janeiro").size).toBe(7.4);
    expect(postmarkName("Llanfairpwllgwyngyllgogery").text).toBe("LLANFAIRPWLLGWYNGY…");
    expect(postmarkName("Saint-Jean-de-Luz sur Mer extra").text).toBe("SAINT-JEAN-DE-LUZ…");
  });
});

describe("dates and times", () => {
  const at = Date.UTC(2026, 9, 30, 22, 31);

  it("formats a place's own clock and date", () => {
    expect(clockTime("Europe/Bucharest", at)).toBe("12:31 AM");
    expect(postmarkDate("Europe/Bucharest", at)).toBe("SAT 31 OCT");
    expect(postmarkDate("America/Anchorage", at)).toBe("FRI 30 OCT");
  });

  it("writes the viewer's date in full", () => {
    expect(longDate(new Date(2026, 9, 30, 12))).toBe("Friday 30 October");
  });
});
