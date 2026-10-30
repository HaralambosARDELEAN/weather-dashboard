"use client";

import { useEffect } from "react";
import { callApi } from "@/lib/api-client";
import type { Place, Weather } from "@/lib/schemas";

export type WeatherLoad = { status: "loading" } | { status: "error"; message: string } | { status: "done"; weather: Weather };

type Props = {
  place: Place;
  /** Changes when every place should load again (Refresh, or the 10-minute timer). */
  refreshKey: number;
  /** Changes when this place should load again (Try again). */
  attempt: number;
  onLoad: (placeId: number, load: WeatherLoad) => void;
};

/**
 * Loads one place's weather and reports it. Renders nothing: each place loads on its own,
 * so one failing place never blocks the others.
 */
export function WeatherFeed({ place, refreshKey, attempt, onLoad }: Props) {
  const { id, latitude, longitude, timezone } = place;

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude), tz: timezone });
    callApi<Weather>(`/api/weather?${params}`, { signal: controller.signal }).then((result) => {
      if (controller.signal.aborted) return;
      onLoad(id, result.ok ? { status: "done", weather: result.data } : { status: "error", message: result.error });
    });
    return () => controller.abort();
  }, [id, latitude, longitude, timezone, refreshKey, attempt, onLoad]);

  return null;
}

/** What the desk keeps per place. After a failed refresh the last weather stays, marked with the failure. */
export type PlaceLoad =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; weather: Weather; at: number; failed: string | null };
