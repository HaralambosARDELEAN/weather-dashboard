"use client";

import { useEffect, useState } from "react";
import { callApi } from "@/lib/api-client";
import { placeDetails } from "@/lib/format";
import type { Place, Weather } from "@/lib/schemas";
import { skyForWeather, skyStyle } from "@/lib/sky";
import { formatLocalTime } from "@/lib/time";
import { describeWeather } from "@/lib/weather-codes";
import { QuadrantMark } from "./quadrant-mark";
import { useNow } from "./use-now";
import { WeatherAmbience } from "./weather-ambience";
import { WeatherSymbol } from "./weather-symbol";

const ACTION =
  "rounded-full border border-current/30 bg-current/5 px-4 py-1.5 font-bold transition-colors hover:bg-current/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";

type Props = {
  index: number;
  place: Place;
  /** Shares the loaded weather with the picture preview. */
  onWeather: (placeId: number, weather: Weather) => void;
  onReplace: () => void;
  onRemove: () => void;
};

type Load = { status: "loading" } | { status: "error"; message: string } | { status: "done"; weather: Weather };

export function WeatherCard({ index, place, onWeather, onReplace, onRemove }: Props) {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const now = useNow(15_000);
  const { id, latitude, longitude, timezone } = place;

  // Each card loads its own weather, so one failing place never blocks the others.
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude), tz: timezone });
    callApi<Weather>(`/api/weather?${params}`, { signal: controller.signal }).then((result) => {
      if (controller.signal.aborted) return;
      if (result.ok) onWeather(id, result.data);
      setLoad(result.ok ? { status: "done", weather: result.data } : { status: "error", message: result.error });
    });
    return () => controller.abort();
  }, [id, latitude, longitude, timezone, attempt, onWeather]);

  function retry() {
    setLoad({ status: "loading" });
    setAttempt((n) => n + 1);
  }

  const weather = load.status === "done" ? load.weather : null;
  const sky = weather ? skyForWeather(weather, timezone, now) : null;

  return (
    <article
      aria-label={place.name}
      style={{
        animationDelay: `${index * 80}ms`,
        ...(sky ? skyStyle(sky) : {}),
      }}
      className="animate-rise relative flex min-h-72 flex-col overflow-hidden rounded-2xl border border-ink/5 bg-white p-5 shadow-lg shadow-ink/10"
    >
      {weather && <WeatherAmbience code={weather.weatherCode} isDay={weather.isDay} />}

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-extrabold uppercase leading-none">{place.name}</h2>
          <p className="mt-1 text-sm opacity-80">{placeDetails(place)}</p>
        </div>
        <QuadrantMark index={index} />
      </div>

      <div className="relative mt-auto pt-6" aria-live="polite">
        {load.status === "loading" && <p className="text-sm opacity-80">Loading the weather…</p>}
        {load.status === "error" && (
          <div role="alert">
            <p className="text-sm font-bold">{load.message}</p>
            <button type="button" onClick={retry} className={`mt-3 text-sm ${ACTION}`}>
              Try again
            </button>
          </div>
        )}
        {weather && (
          <>
            <div className="flex items-end justify-between gap-3">
              <p className="font-display text-7xl font-extrabold leading-none">
                {Math.round(weather.temperature)}
                <span className="ml-0.5 align-top text-3xl font-bold">°C</span>
              </p>
              <WeatherSymbol code={weather.weatherCode} className="mb-1 size-14 shrink-0" />
            </div>
            <p className="mt-2 text-lg">
              {describeWeather(weather.weatherCode).label}
              {/* Day or night in words too, not only through the card colour. */}
              <span className="opacity-80"> · {weather.isDay ? "Day" : "Night"}</span>
            </p>
            <dl className="mt-4 font-mono text-sm">
              {[
                ["Local time", formatLocalTime(timezone, now)],
                ["Wind", `${Math.round(weather.windSpeed)} km/h`],
                ["Today's high", `${Math.round(weather.high)}°C`],
                ["Today's low", `${Math.round(weather.low)}°C`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 border-b border-current/15 py-1 last:border-b-0">
                  <dt className="opacity-80">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-current/20 pt-3 text-sm">
        {/* While the weather loads or fails, the local time still shows here. */}
        <p className="font-mono">
          {!weather && (
            <>
              <span className="opacity-80">Local time </span>
              {formatLocalTime(timezone, now)}
            </>
          )}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onReplace} className={ACTION} aria-label={`Replace ${place.name}`}>
            Replace
          </button>
          <button type="button" onClick={onRemove} className={ACTION} aria-label={`Remove ${place.name}`}>
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
