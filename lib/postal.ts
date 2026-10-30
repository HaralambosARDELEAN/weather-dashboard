import type { Place } from "./schemas";

// Stamps print the country the way it names itself, where that name is short and well known.
const NATIVE: Record<string, string> = {
  Austria: "ÖSTERREICH",
  Brazil: "BRASIL",
  Croatia: "HRVATSKA",
  Czechia: "ČESKO",
  Denmark: "DANMARK",
  Finland: "SUOMI",
  France: "FRANCE",
  Germany: "DEUTSCHLAND",
  Greece: "HELLAS",
  Hungary: "MAGYAR",
  Iceland: "ÍSLAND",
  Italy: "ITALIA",
  Japan: "NIPPON",
  Mexico: "MÉXICO",
  Netherlands: "NEDERLAND",
  Norway: "NORGE",
  Poland: "POLSKA",
  Romania: "ROMÂNIA",
  Spain: "ESPAÑA",
  Sweden: "SVERIGE",
  Switzerland: "HELVETIA",
  Turkey: "TÜRKIYE",
  Türkiye: "TÜRKIYE",
};

// Long English names that do not fit on a stamp: their three-letter codes, as people know them.
const CODES: Record<string, string> = {
  "United States": "USA",
  "United Kingdom": "GBR",
  "United Arab Emirates": "UAE",
  "South Africa": "RSA",
  "New Zealand": "NZL",
  "South Korea": "KOR",
  "North Korea": "PRK",
  "Saudi Arabia": "KSA",
  "Czech Republic": "CZE",
  "Dominican Republic": "DOM",
  "Bosnia and Herzegovina": "BIH",
  "Papua New Guinea": "PNG",
  "Philippines": "PHL",
  "Afghanistan": "AFG",
  "Kazakhstan": "KAZ",
  "Bangladesh": "BGD",
  "Madagascar": "MDG",
  "Mozambique": "MOZ",
  "Luxembourg": "LUX",
  "Montenegro": "MNE",
  "Azerbaijan": "AZE",
  "Uzbekistan": "UZB",
};

const STAMP_MAX = 9;

/** The country line on a stamp: native name, the plain name, or a short code when it is too long. */
export function stampCountry(country: string): string {
  if (NATIVE[country]) return NATIVE[country];
  if (CODES[country]) return CODES[country];
  const upper = country.toUpperCase();
  if (upper.length <= STAMP_MAX) return upper;
  const words = country.split(/\s+/).filter((word) => /^\p{Lu}/u.test(word));
  return words.length > 1 ? words.map((word) => word[0]).join("").toUpperCase() : upper.slice(0, 3);
}

const SHORT_COUNTRY: Record<string, string> = {
  "United States": "USA",
  "United Kingdom": "UK",
  "United Arab Emirates": "UAE",
};

/**
 * The small line under a place on a set's mini stamp. Places that share a name are told apart
 * by a short region (Paris: France, Texas, Ontario, Kentucky); others show their country.
 */
export function miniLabel(place: Place, set: readonly Place[]): string {
  const shared = set.filter((other) => other.name === place.name).length > 1;
  const region = place.region?.replace(/ (Region|County|Province|State|Oblast)$/, "");
  if (shared && region && region.length <= 10) return region;
  return SHORT_COUNTRY[place.country] ?? place.country;
}

/** The place name on the postmark's top arc: smaller and tighter as it gets longer, cut at a word when very long. */
export function postmarkName(name: string): { text: string; size: number; spacing: number } {
  const text = name.toUpperCase();
  if (text.length <= 10) return { text, size: 8.6, spacing: 1.4 };
  if (text.length <= 14) return { text, size: 7.4, spacing: 0.8 };
  if (text.length <= 19) return { text, size: 6.4, spacing: 0.3 };
  const cut = text.slice(0, 18);
  const space = cut.lastIndexOf(" ");
  return { text: `${(space > 8 ? cut.slice(0, space) : cut).trimEnd()}…`, size: 6.4, spacing: 0.3 };
}

const formats = new Map<string, Intl.DateTimeFormat>();

// One formatter per time zone and style; undefined is the viewer's own time zone.
function format(timeZone: string | undefined, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${timeZone ?? ""}|${JSON.stringify(options)}`;
  let formatter = formats.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", { timeZone, ...options });
    formats.set(key, formatter);
  }
  return formatter;
}

function parts(timeZone: string | undefined, at: number | Date, options: Intl.DateTimeFormatOptions) {
  const all = format(timeZone, options).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) => all.find((part) => part.type === type)?.value ?? "";
  return { weekday: get("weekday"), day: get("day"), month: get("month") };
}

/** "10:31 AM" in that time zone (the viewer's when undefined). */
export function clockTime(timeZone: string | undefined, at: number | Date): string {
  return format(timeZone, { hour: "numeric", minute: "2-digit", hour12: true }).format(at);
}

/** "FRI 30 OCT", for a postmark. */
export function postmarkDate(timeZone: string | undefined, at: number | Date): string {
  const { weekday, day, month } = parts(timeZone, at, { weekday: "short", day: "numeric", month: "short" });
  return `${weekday} ${day} ${month}`.toUpperCase();
}

/** "Fri 30 Oct". */
export function shortDate(timeZone: string | undefined, at: number | Date): string {
  const { weekday, day, month } = parts(timeZone, at, { weekday: "short", day: "numeric", month: "short" });
  return `${weekday} ${day} ${month}`;
}

/** "Friday 30 October", in the viewer's time zone. */
export function longDate(at: number | Date): string {
  const { weekday, day, month } = parts(undefined, at, { weekday: "long", day: "numeric", month: "long" });
  return `${weekday} ${day} ${month}`;
}
