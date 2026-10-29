"use client";

import { useEffect, useState } from "react";
import { callApi } from "@/lib/api-client";
import { placeDetails } from "@/lib/format";
import type { Place, Weather } from "@/lib/schemas";
import { skyFor } from "@/lib/sky";
import { formatLocalTime, localHour } from "@/lib/time";
import { describeWeather } from "@/lib/weather-codes";
import { QuadrantMark } from "./quadrant-mark";
import { useNow } from "./use-now";

type Props = {
  index: number;
  place: Place;
  onReplace: () => void;
  onRemove: () => void;
};

type Load = { status: "loading" } | { status: "error"; message: string } | { status: "done"; weather: Weather };

export function WeatherCard({ index, place, onReplace, onRemove }: Props) {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const now = useNow(15_000);
  const { latitude, longitude, timezone } = place;

  // Each card loads its own weather, so one failing place never blocks the others.
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude), tz: timezone });
    callApi<Weather>(`/api/weather?${params}`, { signal: controller.signal }).then((result) => {
      if (controller.signal.aborted) return;
      setLoad(result.ok ? { status: "done", weather: result.data } : { status: "error", message: result.error });
    });
    return () => controller.abort();
  }, [latitude, longitude, timezone, attempt]);

  function retry() {
    setLoad({ status: "loading" });
    setAttempt((n) => n + 1);
  }

  const weather = load.status === "done" ? load.weather : null;
  const description = weather ? describeWeather(weather.weatherCode) : null;
  const sky = weather && description ? skyFor(description.kind, weather.isDay, localHour(timezone, now)) : null;

  return (
    <article
      aria-label={place.name}
      style={sky ? { backgroundColor: sky.background, color: sky.text } : undefined}
      className="flex min-h-72 flex-col rounded-sm border border-mist bg-white p-5 transition-colors duration-700"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-extrabold uppercase leading-none">{place.name}</h2>
          <p className="mt-1 text-sm opacity-80">{placeDetails(place)}</p>
        </div>
        <QuadrantMark index={index} />
      </div>

      <div className="mt-auto pt-6" aria-live="polite">
        {load.status === "loading" && <p className="text-sm opacity-80">Loading the weather…</p>}
        {load.status === "error" && (
          <div role="alert">
            <p className="text-sm font-bold">{load.message}</p>
            <button type="button" onClick={retry} className="mt-2 text-sm underline underline-offset-4">
              Try again
            </button>
          </div>
        )}
        {weather && description && (
          <>
            <p className="font-display text-7xl font-extrabold leading-none">
              {Math.round(weather.temperature)}
              <span className="text-4xl">°C</span>
            </p>
            <p className="mt-1 text-lg">{description.label}</p>
            <dl className="mt-4 font-mono text-sm">
              {[
                ["Wind", `${Math.round(weather.windSpeed)} km/h`],
                ["Today's high", `${Math.round(weather.high)}°C`],
                ["Today's low", `${Math.round(weather.low)}°C`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 border-b border-current/15 py-1 last:border-b-0">
                  <dt className="opacity-70">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-current/20 pt-3 text-sm">
        <p className="font-mono">
          <span className="block opacity-70">Local time</span>
          <time>{formatLocalTime(place.timezone, now)}</time>
        </p>
        <div className="flex gap-4">
          <button type="button" onClick={onReplace} className="underline-offset-4 hover:underline">
            Replace
          </button>
          <button type="button" onClick={onRemove} className="underline-offset-4 hover:underline">
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
