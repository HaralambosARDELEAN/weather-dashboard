"use client";

import { useState, useSyncExternalStore } from "react";
import type { Place } from "@/lib/schemas";
import { SLOT_COUNT, getServerSnapshot, getSnapshot, subscribe, updateSlots } from "@/lib/storage";
import { PlaceSlot } from "./place-slot";

export function Dashboard() {
  const slots = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [replacing, setReplacing] = useState<number | null>(null);

  // On the server and during the first render in the browser the saved places are not known yet.
  if (!slots) {
    return (
      <div aria-busy="true" className="grid gap-4 sm:grid-cols-2 lg:w-1/2">
        {Array.from({ length: SLOT_COUNT }, (_, i) => (
          <div key={i} className="min-h-72 rounded-sm border border-dashed border-slate/50" />
        ))}
      </div>
    );
  }
  const current = slots;

  function pick(index: number, place: Place): string | null {
    if (current.some((other, i) => other?.id === place.id && i !== index)) {
      return `${place.name} is already on the dashboard.`;
    }
    updateSlots(current.map((other, i) => (i === index ? place : other)));
    setReplacing(null);
    return null;
  }

  function remove(index: number) {
    updateSlots(current.map((other, i) => (i === index ? null : other)));
    if (replacing === index) setReplacing(null);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="grid content-start gap-4 sm:grid-cols-2">
        {current.map((place, index) => (
          <PlaceSlot
            key={index}
            index={index}
            place={place}
            replacing={replacing === index}
            onPick={(next) => pick(index, next)}
            onReplace={() => setReplacing(index)}
            onCancel={() => setReplacing(null)}
            onRemove={() => remove(index)}
          />
        ))}
      </div>
    </div>
  );
}
