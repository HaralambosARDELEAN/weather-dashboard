"use client";

import type { Place, Weather } from "@/lib/schemas";
import { PlaceSearch } from "./place-search";
import { QuadrantMark } from "./quadrant-mark";
import { WeatherCard } from "./weather-card";

type Props = {
  index: number;
  place: Place | null;
  replacing: boolean;
  onPick: (place: Place) => string | null;
  onWeather: (placeId: number, weather: Weather) => void;
  onReplace: () => void;
  onCancel: () => void;
  onRemove: () => void;
};

export function PlaceSlot({ index, place, replacing, onPick, onWeather, onReplace, onCancel, onRemove }: Props) {
  if (place && !replacing) {
    return (
      <WeatherCard
        key={place.id}
        index={index}
        place={place}
        onWeather={onWeather}
        onReplace={onReplace}
        onRemove={onRemove}
      />
    );
  }
  return (
    <section
      aria-label={`Place ${index + 1}`}
      style={{ animationDelay: `${index * 80}ms` }}
      className="animate-rise flex min-h-72 flex-col gap-4 rounded-2xl border-2 border-dashed border-slate/30 bg-white/40 p-5"
    >
      <div className="flex justify-end text-slate">
        <QuadrantMark index={index} />
      </div>
      <PlaceSearch onPick={onPick} onCancel={place ? onCancel : undefined} autoFocus={replacing} />
    </section>
  );
}
