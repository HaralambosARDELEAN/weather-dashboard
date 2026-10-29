import { placeLabel } from "./format";
import type { Place, Weather } from "./schemas";
import { localHour, localMonth, timeOfDay } from "./time";
import { describeWeather } from "./weather-codes";

export const PANEL_POSITIONS = ["Top left", "Top right", "Bottom left", "Bottom right"] as const;

export type PromptEntry = { place: Place; weather: Weather };

export function temperatureFeel(celsius: number): string {
  if (celsius < -10) return "bitterly cold";
  if (celsius < 0) return "freezing";
  if (celsius < 10) return "cold";
  if (celsius < 18) return "cool";
  if (celsius < 25) return "mild";
  if (celsius < 32) return "warm";
  return "hot";
}

export function windFeel(kmh: number): string {
  if (kmh < 6) return "still air";
  if (kmh < 20) return "a light breeze";
  if (kmh < 39) return "a fresh breeze";
  if (kmh < 62) return "strong wind";
  return "a gale";
}

const NORTHERN_SEASONS = ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"];

/**
 * The season at a latitude in a given month (1 to 12). Without it the image model guesses,
 * for example cherry blossom in Tokyo in October. Near the equator there are no four seasons.
 */
export function seasonAt(latitude: number, month: number): string | null {
  if (Math.abs(latitude) < 23.5) return null;
  const northernMonth = latitude >= 0 ? month : ((month + 5) % 12) + 1; // the south is six months apart
  return NORTHERN_SEASONS[northernMonth - 1];
}

/**
 * The image prompt, built only from API data: one line per panel, in reading order.
 * The same text is shown to the user next to the picture.
 */
export function buildPrompt(entries: PromptEntry[], now: Date = new Date()): string {
  if (entries.length !== PANEL_POSITIONS.length) {
    throw new Error(`buildPrompt needs exactly ${PANEL_POSITIONS.length} places, got ${entries.length}.`);
  }
  const panels = entries.map(({ place, weather }, i) => {
    const season = seasonAt(place.latitude, localMonth(place.timezone, now));
    const when = timeOfDay(localHour(place.timezone, now), weather.isDay) + (season ? ` in ${season}` : "");
    const { scene } = describeWeather(weather.weatherCode);
    const temperature = `${temperatureFeel(weather.temperature)} at ${Math.round(weather.temperature)}°C`;
    return `${PANEL_POSITIONS[i]}: ${placeLabel(place)}, ${when}. Weather: ${scene}, ${temperature}, ${windFeel(weather.windSpeed)}.`;
  });
  return [
    "A square illustration split into a 2x2 grid of four equal panels, separated by thin white borders.",
    "Style: flat gouache travel-poster painting with soft paper grain. Keep the style the same in every panel, but let each panel's light and colour follow its own weather and time of day.",
    "Each panel shows a recognisable street or landscape from the named place. Trees, flowers and light must match the season given for that panel:",
    ...panels,
    "Write each place name in small, plain capital letters along the bottom edge of its panel. No other text or numbers.",
  ].join("\n");
}
