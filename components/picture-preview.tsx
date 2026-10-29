"use client";

import type { Weather } from "@/lib/schemas";
import { skyForWeather, skyStyle } from "@/lib/sky";
import type { Slots } from "@/lib/storage";
import { useNow } from "./use-now";
import { WeatherAmbience } from "./weather-ambience";
import { WeatherSymbol } from "./weather-symbol";

type Props = {
  slots: Slots;
  weather: Readonly<Record<number, Weather>>;
  /** While the image model works, the panels pulse one after another. */
  painting: boolean;
};

/** The 2x2 layout of the picture before it is painted: each place in its panel, in its sky. */
export function PicturePreview({ slots, weather, painting }: Props) {
  const now = useNow(60_000);
  return (
    <div className="grid aspect-square grid-cols-2 gap-1.5 rounded-2xl border border-ink/5 bg-white p-1.5 shadow-lg shadow-ink/10">
      {slots.map((place, i) => {
        if (!place) {
          return (
            <div
              key={i}
              className="grid place-items-center rounded-xl border-2 border-dashed border-slate/30 text-sm text-slate"
            >
              Empty panel
            </div>
          );
        }
        const current = weather[place.id];
        const sky = current ? skyForWeather(current, place.timezone, now) : null;
        return (
          <div
            key={i}
            style={{
              animationDelay: `${i * 250}ms`,
              ...(sky ? skyStyle(sky) : {}),
            }}
            className={`relative flex flex-col justify-end overflow-hidden rounded-xl bg-haze p-4 ${
              painting ? "animate-paint-pulse" : ""
            }`}
          >
            {current && <WeatherAmbience code={current.weatherCode} isDay={current.isDay} />}
            {current && <WeatherSymbol code={current.weatherCode} className="relative mb-auto size-8" />}
            <p className="relative font-display text-2xl font-extrabold uppercase leading-none sm:text-3xl">{place.name}</p>
            {current && <p className="relative mt-1 font-mono text-sm">{Math.round(current.temperature)}°C</p>}
          </div>
        );
      })}
    </div>
  );
}
