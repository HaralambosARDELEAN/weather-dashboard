"use client";

import { placeDetails } from "@/lib/format";
import type { Place } from "@/lib/schemas";
import { QuadrantMark } from "./quadrant-mark";

type Props = {
  index: number;
  place: Place;
  onReplace: () => void;
  onRemove: () => void;
};

export function WeatherCard({ index, place, onReplace, onRemove }: Props) {
  return (
    <article aria-label={place.name} className="flex min-h-72 flex-col rounded-sm border border-mist bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-extrabold uppercase leading-none">{place.name}</h2>
          <p className="mt-1 text-sm opacity-80">{placeDetails(place)}</p>
        </div>
        <QuadrantMark index={index} />
      </div>
      <div className="mt-auto flex justify-end gap-4 border-t border-current/20 pt-3 text-sm">
        <button type="button" onClick={onReplace} className="underline-offset-4 hover:underline">
          Replace
        </button>
        <button type="button" onClick={onRemove} className="underline-offset-4 hover:underline">
          Remove
        </button>
      </div>
    </article>
  );
}
