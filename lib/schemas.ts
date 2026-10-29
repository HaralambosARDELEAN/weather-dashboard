import { z } from "zod";

/** A place picked by the user. Comes from Open-Meteo geocoding. */
export const placeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  region: z.string().nullable(),
  country: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().min(1),
});

export type Place = z.infer<typeof placeSchema>;

/** Current weather for one place. Temperatures in °C, wind in km/h. */
export type Weather = {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  isDay: boolean;
  high: number;
  low: number;
};
