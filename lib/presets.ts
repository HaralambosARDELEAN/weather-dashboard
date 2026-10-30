import type { Place } from "./schemas";

/** Four places that fill the window in one click, to try the app without typing. */
export type PlaceSet = {
  id: string;
  title: string;
  description: string;
  /** The colours of the set's small window icon. */
  colors: readonly [string, string, string, string];
  places: readonly [Place, Place, Place, Place];
};

// Exactly as Open-Meteo's geocoding returns them (checked on 30 October 2026), so no lookup is needed.
function place(id: number, name: string, region: string | null, country: string, latitude: number, longitude: number, timezone: string): Place {
  return { id, name, region, country, latitude, longitude, timezone };
}

export const PLACE_SETS: readonly PlaceSet[] = [
  {
    id: "clock",
    title: "Around the clock",
    description: "Tokyo, Timișoara, New York and Sydney",
    colors: ["#2b3a52", "#7fb3e0", "#f0b046", "#a7b3bf"],
    places: [
      place(1850147, "Tokyo", "Tokyo", "Japan", 35.6895, 139.69171, "Asia/Tokyo"),
      place(665087, "Timișoara", "Timiș County", "Romania", 45.75372, 21.22571, "Europe/Bucharest"),
      place(5128581, "New York", "New York", "United States", 40.71427, -74.00597, "America/New_York"),
      place(2147714, "Sydney", "New South Wales", "Australia", -33.86785, 151.20732, "Australia/Sydney"),
    ],
  },
  {
    id: "paris",
    title: "Same name, four places",
    description: "Paris in France, Texas, Ontario and Kentucky",
    colors: ["#7fb3e0", "#a7b3bf", "#f0b046", "#2b3a52"],
    places: [
      place(2988507, "Paris", "Île-de-France Region", "France", 48.85341, 2.3488, "Europe/Paris"),
      place(4717560, "Paris", "Texas", "United States", 33.66094, -95.55551, "America/Chicago"),
      place(6942553, "Paris", "Ontario", "Canada", 43.2, -80.38333, "America/Toronto"),
      place(4303602, "Paris", "Kentucky", "United States", 38.2098, -84.25299, "America/New_York"),
    ],
  },
  {
    id: "climates",
    title: "Four climates",
    description: "Yakutsk, Dubai, Reykjavik and Singapore",
    colors: ["#d6e7f5", "#ee8f43", "#a7b3bf", "#f0b046"],
    places: [
      place(2013159, "Yakutsk", "Sakha", "Russia", 62.03114, 129.72289, "Asia/Yakutsk"),
      place(292223, "Dubai", "Dubai", "United Arab Emirates", 25.07725, 55.30927, "Asia/Dubai"),
      place(3413829, "Reykjavik", "Capital Region", "Iceland", 64.13548, -21.89541, "Atlantic/Reykjavik"),
      place(1880252, "Singapore", null, "Singapore", 1.28967, 103.85007, "Asia/Singapore"),
    ],
  },
];
