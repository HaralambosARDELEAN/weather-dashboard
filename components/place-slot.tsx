"use client";

import type { Place } from "@/lib/schemas";
import { PlaceSearch } from "./place-search";
import { QuadrantMark } from "./quadrant-mark";
import { WeatherCard } from "./weather-card";

type Props = {
  index: number;
  place: Place | null;
  replacing: boolean;
  onPick: (place: Place) => string | null;
  onReplace: () => void;
  onCancel: () => void;
  onRemove: () => void;
};

export function PlaceSlot({ index, place, replacing, onPick, onReplace, onCancel, onRemove }: Props) {
  if (place && !replacing) {
    return <WeatherCard key={place.id} index={index} place={place} onReplace={onReplace} onRemove={onRemove} />;
  }
  return (
    <section
      aria-label={`Place ${index + 1}`}
      className="flex min-h-72 flex-col gap-4 rounded-sm border border-dashed border-slate/50 p-5"
    >
      <div className="flex justify-end text-slate">
        <QuadrantMark index={index} />
      </div>
      <PlaceSearch onPick={onPick} onCancel={place ? onCancel : undefined} autoFocus={replacing} />
    </section>
  );
}
