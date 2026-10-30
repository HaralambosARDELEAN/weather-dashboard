import type { Place } from "./schemas";

type Named = Pick<Place, "name" | "region" | "country">;

/** "Illinois, United States": region and country, without repeating the place name. */
export function placeDetails(place: Named): string {
  const parts = [place.region, place.country].filter((part): part is string => Boolean(part) && part !== place.name);
  return [...new Set(parts)].join(", ");
}

export function placeLabel(place: Named): string {
  const details = placeDetails(place);
  return details ? `${place.name}, ${details}` : place.name;
}

/** Long place names get a smaller size so they fit on one line of a card. */
export function nameSize(name: string): "large" | "medium" | "small" {
  if (name.length <= 12) return "large";
  if (name.length <= 17) return "medium";
  return "small";
}

export function listNames(names: string[]): string {
  if (names.length < 2) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}
