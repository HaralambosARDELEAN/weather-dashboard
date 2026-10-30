"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { nameSize, placeDetails } from "@/lib/format";
import type { Place } from "@/lib/schemas";
import { dayPart } from "@/lib/scene";
import type { Slots } from "@/lib/storage";
import { describeWeather } from "@/lib/weather-codes";
import { sceneFor } from "./live-sky";
import { NAME_CLASS } from "./postcard";
import { Facts, Frank, localTimeSentence, SkyLayers } from "./postcard-parts";
import { POSTMARK_TILT, SLOT_COLORS, SLOT_KEYS } from "./slots";
import type { PlaceLoad } from "./weather-feed";

type Props = {
  slots: Slots;
  loads: Readonly<Record<number, PlaceLoad>>;
  now: Date;
  /** The card held up; null puts it back. */
  index: number | null;
  /** Per slot: when its quadrant of the painting was painted, or null for the live sky. */
  paintedAt: readonly (string | null)[];
  /** The painting as a CSS url(), for the painted quadrants. */
  painting: string | null;
  onIndex: (index: number | null) => void;
};

// The desk's tilt per slot, so the card straightens as it is picked up.
const DESK_TILT = ["-2.3deg", "1.5deg", "-1deg", "2.1deg"];

function coordinates(place: Place): string {
  const lat = `${Math.abs(place.latitude).toFixed(2)}° ${place.latitude >= 0 ? "N" : "S"}`;
  const lon = `${Math.abs(place.longitude).toFixed(2)}° ${place.longitude >= 0 ? "E" : "W"}`;
  return `${lat} · ${lon}`;
}

/**
 * A postcard picked up off the desk: large and straight, in a native modal dialog.
 * The front is the picture; "Turn over" shows the back with the weather written large.
 */
export function PostcardDialog({ slots, loads, now, index, paintedAt, painting, onIndex }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const turn = useRef<HTMLButtonElement>(null);
  const [side, setSide] = useState<"front" | "back">("front");

  // A native modal dialog traps the focus and closes on Escape.
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (index !== null && !element.open) {
      element.showModal();
      turn.current?.focus();
    }
    if (index === null && element.open) element.close();
  }, [index]);

  const filled = slots.flatMap((place, i) => (place ? [i] : []));
  const place = index === null ? null : slots[index];
  const load = place ? loads[place.id] : undefined;
  const weather = load?.status === "done" ? load.weather : null;
  const scene = weather ? sceneFor(weather, now.getTime()) : null;
  const step = (by: number) => {
    if (index === null || filled.length === 0) return;
    const at = filled.indexOf(index);
    onIndex(filled[(at + by + filled.length) % filled.length]);
  };
  const previous = index === null ? null : slots[filled[(filled.indexOf(index) - 1 + filled.length) % filled.length]];
  const next = index === null ? null : slots[filled[(filled.indexOf(index) + 1) % filled.length]];

  function closed() {
    // Back on the desk: the focus returns to the card that was held last, front side up next time.
    const last = index;
    setSide("front");
    onIndex(null);
    if (last !== null) document.querySelector<HTMLElement>(`[data-pickup="${last}"]`)?.focus();
  }

  function keyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowRight") step(1);
    if (event.key === "ArrowLeft") step(-1);
  }

  return (
    <dialog
      ref={dialog}
      className="held-dialog"
      aria-label={place ? `The ${place.name} postcard` : "A postcard"}
      onClose={closed}
      onKeyDown={keyDown}
      onClick={(event) => event.target === event.currentTarget && dialog.current?.close()}
    >
      {place && index !== null && (
        <div
          key={index}
          className="held"
          data-side={side}
          data-slot={SLOT_KEYS[index]}
          style={
            {
              "--i": index,
              "--c": SLOT_COLORS[index],
              "--pmr": POSTMARK_TILT[index],
              "--rot": DESK_TILT[index],
              "--painting": painting ?? undefined,
            } as CSSProperties
          }
        >
          <div className="flip">
            <section className="face front" aria-label="Picture side" inert={side === "back"}>
              <div className="pic pic-large" style={{ "--scrim": scene?.palette.scrim ?? 0.6 } as CSSProperties}>
                <SkyLayers place={place} weather={weather} scene={scene} paintedAt={paintedAt[index]} />
                <div className="caption">
                  <h2 className={`name ${NAME_CLASS[nameSize(place.name)]}`}>{place.name}</h2>
                  {placeDetails(place) && <p className="region">{placeDetails(place)}</p>}
                </div>
              </div>
            </section>

            <section className="face back" aria-label="Message side" inert={side === "front"}>
              <div className="back-msg">
                {weather ? (
                  <>
                    <p className="temp">
                      {Math.round(weather.temperature)}
                      <sup>°C</sup>
                    </p>
                    <p className="cond">
                      {describeWeather(weather.weatherCode).label}
                      {/* The sky shows day or night; screen readers still hear it in words. */}
                      <span className="sr-only">, {dayPart(weather.sun, weather.isDay, now.getTime())}</span>
                    </p>
                    <Facts place={place} weather={weather} now={now} />
                  </>
                ) : (
                  <p className="cond">
                    {load?.status === "error" ? "No weather yet" : "Getting the weather…"}
                    {load?.status === "error" && <span>{load.message}</span>}
                  </p>
                )}
                <p className="back-time" aria-hidden="true">
                  {localTimeSentence(place, now)}
                </p>
              </div>
              <div className="back-side">
                <Frank index={index} place={place} weather={weather} scene={scene} now={now} />
                <address className="address">
                  <p>{place.name}</p>
                  {place.region && place.region !== place.name && <p>{place.region}</p>}
                  {place.country && place.country !== place.name && <p>{place.country}</p>}
                  <p className="coords">{coordinates(place)}</p>
                </address>
              </div>
            </section>
          </div>
        </div>
      )}

      <div className="held-bar">
        {filled.length > 1 && (
          <button type="button" className="btn-line" onClick={() => step(-1)}>
            ← <span className="sr-only">Previous: </span>
            {previous?.name}
          </button>
        )}
        <button ref={turn} type="button" className="btn-yellow" onClick={() => setSide((shown) => (shown === "front" ? "back" : "front"))}>
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2.5 8a5.5 5.5 0 0 1 9.6-3.6M13.5 8a5.5 5.5 0 0 1-9.6 3.6" />
            <path d="M12.5 1.8v2.8H9.7M3.5 14.2v-2.8h2.8" />
          </svg>
          Turn over
        </button>
        {filled.length > 1 && (
          <button type="button" className="btn-line" onClick={() => step(1)}>
            <span className="sr-only">Next: </span>
            {next?.name} →
          </button>
        )}
        <button type="button" className="btn-line" onClick={() => dialog.current?.close()}>
          Close
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {place ? (side === "front" ? `${place.name}, picture side.` : `${place.name}, message side.`) : ""}
      </p>
    </dialog>
  );
}
