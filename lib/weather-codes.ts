export type WeatherKind = "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";

type Description = {
  /** Shown on the card. */
  label: string;
  /** Used in the image prompt. */
  scene: string;
  /** Picks the card colour. */
  kind: WeatherKind;
};

// WMO weather interpretation codes, as returned by Open-Meteo.
const CODES: Record<number, Description> = {
  0: { label: "Clear sky", scene: "a clear sky", kind: "clear" },
  1: { label: "Mainly clear", scene: "a mostly clear sky", kind: "clear" },
  2: { label: "Partly cloudy", scene: "scattered clouds", kind: "cloudy" },
  3: { label: "Overcast", scene: "a low grey overcast sky", kind: "cloudy" },
  45: { label: "Fog", scene: "thick fog", kind: "fog" },
  48: { label: "Freezing fog", scene: "freezing fog with frost on every surface", kind: "fog" },
  51: { label: "Light drizzle", scene: "light drizzle", kind: "rain" },
  53: { label: "Drizzle", scene: "steady drizzle", kind: "rain" },
  55: { label: "Heavy drizzle", scene: "heavy drizzle", kind: "rain" },
  56: { label: "Light freezing drizzle", scene: "light freezing drizzle", kind: "rain" },
  57: { label: "Freezing drizzle", scene: "heavy freezing drizzle", kind: "rain" },
  61: { label: "Light rain", scene: "light rain", kind: "rain" },
  63: { label: "Rain", scene: "steady rain", kind: "rain" },
  65: { label: "Heavy rain", scene: "heavy rain", kind: "rain" },
  66: { label: "Light freezing rain", scene: "light freezing rain", kind: "rain" },
  67: { label: "Freezing rain", scene: "heavy freezing rain", kind: "rain" },
  71: { label: "Light snow", scene: "light snowfall", kind: "snow" },
  73: { label: "Snow", scene: "steady snowfall", kind: "snow" },
  75: { label: "Heavy snow", scene: "heavy snowfall", kind: "snow" },
  77: { label: "Snow grains", scene: "fine snow grains", kind: "snow" },
  80: { label: "Light showers", scene: "light rain showers", kind: "rain" },
  81: { label: "Showers", scene: "rain showers", kind: "rain" },
  82: { label: "Heavy showers", scene: "violent rain showers", kind: "rain" },
  85: { label: "Light snow showers", scene: "light snow showers", kind: "snow" },
  86: { label: "Snow showers", scene: "heavy snow showers", kind: "snow" },
  95: { label: "Thunderstorm", scene: "a thunderstorm with lightning", kind: "storm" },
  96: { label: "Thunderstorm with hail", scene: "a thunderstorm with light hail", kind: "storm" },
  99: { label: "Thunderstorm with heavy hail", scene: "a thunderstorm with heavy hail", kind: "storm" },
};

const UNKNOWN: Description = { label: "Unknown conditions", scene: "changeable weather", kind: "cloudy" };

export function describeWeather(code: number): Description {
  return CODES[code] ?? UNKNOWN;
}
