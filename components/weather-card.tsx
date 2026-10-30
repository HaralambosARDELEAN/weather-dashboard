"use client";

import { useEffect, useState } from "react";
import { callApi } from "@/lib/api-client";
import { nameSize, placeDetails } from "@/lib/format";
import type { Place, Weather } from "@/lib/schemas";
import { skyForWeather, skyStyle, temperatureEffect } from "@/lib/sky";
import { formatLocalTime } from "@/lib/time";
import { describeWeather } from "@/lib/weather-codes";
import { QuadrantMark } from "./quadrant-mark";
import { FrostEdge } from "./frost-edge";
import { useNow } from "./use-now";
import { WeatherAmbience } from "./weather-ambience";
import { WeatherIcon } from "./weather-icon";

const CARD_NAME = { large: "text-3xl", medium: "text-2xl", small: "text-xl" } as const;

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
  const effect = weather ? temperatureEffect(weather.temperature) : null;

  return (
    <article
      aria-label={place.name}
      style={{
        animationDelay: `${index * 80}ms`,
        ...(sky ? skyStyle(sky) : {}),
      }}
      className="animate-rise relative flex min-h-[27.5rem] flex-col overflow-hidden rounded-2xl border border-ink/5 bg-white p-5 shadow-lg shadow-ink/10"
    >
      {weather && <WeatherAmbience code={weather.weatherCode} isDay={weather.isDay} />}
      {effect?.kind === "frost" && <FrostEdge level={effect.level} />}
      {effect?.kind === "heat" && (
        <div aria-hidden="true" className="ambience ambience-heat" style={{ opacity: 0.45 + 0.55 * effect.level }} />
      )}

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className={`font-display font-extrabold uppercase leading-none break-words ${CARD_NAME[nameSize(place.name)]}`}>{place.name}</h2>
          <p className="mt-1 text-sm opacity-80">{placeDetails(place)}</p>
        </div>
        <QuadrantMark index={index} />
      </div>

      <div className="relative mt-auto pt-6" aria-live="polite">
        {load.status === "loading" && (
          // The card's own shape while the weather loads; the text is for screen readers.
          <div className="animate-pulse">
            <span className="sr-only">Loading the weather…</span>
            <div className="h-16 w-28 rounded-lg bg-current/10" />
            <div className="mt-3 h-5 w-36 rounded bg-current/10" />
            <div className="mt-5 space-y-2.5">
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="h-4 rounded bg-current/10" />
              ))}
            </div>
          </div>
        )}
        {load.status === "error" && (
          <div role="alert">
            <p className="text-sm font-bold">{load.message}</p>
            <p className="mt-2 font-mono text-sm opacity-80">Local time {formatLocalTime(timezone, now)}</p>
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
              <WeatherIcon code={weather.weatherCode} isDay={weather.isDay} className="-mr-2 size-20 shrink-0" />
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

      <div className="relative mt-4 flex items-center justify-end gap-3 border-t border-current/20 pt-3 text-sm">
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
