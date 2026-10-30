"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import type { Place, Weather } from "@/lib/schemas";
import { SLOT_COUNT, getServerSnapshot, getSnapshot, subscribe, updateSlots } from "@/lib/storage";
import { ImagePanel } from "./image-panel";
import { PlaceSlot } from "./place-slot";

export function Dashboard() {
  const slots = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [replacing, setReplacing] = useState<number | null>(null);
  // After a place is added, the keyboard focus moves on to the next empty search box.
  const [focusSlot, setFocusSlot] = useState<number | null>(null);
  // Weather loaded by the cards, by place id, so the picture preview can use the same skies.
  const [weather, setWeather] = useState<Readonly<Record<number, Weather>>>({});
  const shareWeather = useCallback((placeId: number, next: Weather) => {
    setWeather((all) => ({ ...all, [placeId]: next }));
  }, []);

  // On the server and during the first render in the browser the saved places are not known yet.
  if (!slots) {
    return (
      <div aria-busy="true" className="grid gap-4 sm:grid-cols-2 xl:w-1/2">
        {Array.from({ length: SLOT_COUNT }, (_, i) => (
          <div key={i} className="min-h-[27.5rem] rounded-2xl border-2 border-dashed border-slate/30" />
        ))}
      </div>
    );
  }
  const current = slots;

  function pick(index: number, place: Place): string | null {
    if (current.some((other, i) => other?.id === place.id && i !== index)) {
      return `${place.name} is already on the dashboard.`;
    }
    const next = current.map((other, i) => (i === index ? place : other));
    updateSlots(next);
    setReplacing(null);
    const nextEmpty = next.findIndex((other) => other === null);
    setFocusSlot(nextEmpty === -1 ? null : nextEmpty);
    return null;
  }

  function remove(index: number) {
    updateSlots(current.map((other, i) => (i === index ? null : other)));
    if (replacing === index) setReplacing(null);
  }

  return (
    <div className="grid gap-10 xl:grid-cols-2">
      <div className="grid content-start gap-4 sm:grid-cols-2">
        {current.map((place, index) => (
          <PlaceSlot
            key={index}
            index={index}
            place={place}
            replacing={replacing === index}
            first={index === 0 && current.every((other) => other === null)}
            focus={focusSlot === index}
            onPick={(next) => pick(index, next)}
            onWeather={shareWeather}
            onReplace={() => setReplacing(index)}
            onCancel={() => setReplacing(null)}
            onRemove={() => remove(index)}
          />
        ))}
      </div>
      <ImagePanel slots={current} weather={weather} />
    </div>
  );
}
