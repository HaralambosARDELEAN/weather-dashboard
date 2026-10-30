"use client";

import { useEffect, useId, useRef, type CSSProperties, type RefObject } from "react";
import { nameSize, placeDetails } from "@/lib/format";
import { clockTime } from "@/lib/postal";
import { PANEL_POSITIONS } from "@/lib/prompt";
import type { Place } from "@/lib/schemas";
import { dayPart } from "@/lib/scene";
import { describeWeather } from "@/lib/weather-codes";
import { sceneFor } from "./live-sky";
import { Facts, Frank, SkyLayers } from "./postcard-parts";
import { QuadrantMark } from "./quadrant-mark";
import { POSTMARK_TILT, SLOT_COLORS, SLOT_KEYS } from "./slots";
import type { PlaceLoad } from "./weather-feed";

type Props = {
  index: number;
  place: Place;
  /** undefined while the first load is on its way. */
  load: PlaceLoad | undefined;
  now: Date;
  /** "12:15 AM" when the card shows its quadrant of the painting; null shows the live sky. */
  paintedAt: string | null;
  painting: boolean;
  /** A search will replace this card. */
  target: boolean;
  /** A place waiting for the card it replaces (the desk was full). */
  pending: Place | null;
  /** Changes when the focus should move to this card's name. */
  focusKey: number;
  onHover: (index: number | null) => void;
  onPickUp: () => void;
  onReplace: () => void;
  onRemove: () => void;
  onRetry: () => void;
  onPut: () => void;
};

export const NAME_CLASS = { large: "", medium: "is-medium", small: "is-small" } as const;

// The last focus request a card has acted on (requests only count up).
let usedFocusKey = 0;

/** Pauses the sky's motion while the card is off screen. Sets an attribute, so nothing re-renders. */
export function usePauseOffscreen(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => element.toggleAttribute("data-offscreen", !entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
}

const ReplaceIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 5.5h10l-3-3M13.5 10.5h-10l3 3" />
  </svg>
);
const RemoveIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);

/** One place as a postcard: the sky on the picture side, the weather written on the message side. */
export function Postcard(props: Props) {
  const { index, place, load, now, paintedAt, painting, target, pending, focusKey } = props;
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const pic = useRef<HTMLDivElement>(null);
  const weather = load?.status === "done" ? load.weather : null;
  const scene = weather ? sceneFor(weather, now.getTime()) : null;
  const stale = load?.status === "done" && load.failed !== null ? load : null;

  usePauseOffscreen(pic);
  useEffect(() => {
    // Each request is used once, so a card that mounts later with the same key does not take the focus.
    if (focusKey <= usedFocusKey) return;
    usedFocusKey = focusKey;
    heading.current?.focus();
  }, [focusKey]);
  // A removed card gets no mouseleave, so it lets go of the highlight on the big card itself.
  const { onHover } = props;
  useEffect(() => () => onHover(null), [onHover]);

  const style = {
    "--i": index,
    "--c": SLOT_COLORS[index],
    "--pmr": POSTMARK_TILT[index],
  } as CSSProperties;

  return (
    <article
      className={`pc ${target ? "is-target" : ""} ${stale ? "is-stale" : ""}`}
      data-slot={SLOT_KEYS[index]}
      style={style}
      aria-labelledby={`${id}-name`}
      onMouseEnter={() => props.onHover(index)}
      onMouseLeave={() => props.onHover(null)}
      onFocus={() => props.onHover(index)}
      onBlur={() => props.onHover(null)}
    >
      {/* The whole card picks it up; the buttons on it sit above this one and keep their own actions. */}
      {!pending && (
        <button type="button" className="pickup" data-pickup={index} onClick={props.onPickUp}>
          <span className="sr-only">Pick up the {place.name} postcard</span>
        </button>
      )}
      <div ref={pic} className="pic" style={{ "--scrim": scene?.palette.scrim ?? 0.6 } as CSSProperties}>
        <SkyLayers place={place} weather={weather} scene={scene} paintedAt={paintedAt} />
        {painting && <div className="pic-sheen" aria-hidden="true" />}
        <div className="caption">
          <h3 ref={heading} id={`${id}-name`} tabIndex={-1} className={`name ${NAME_CLASS[nameSize(place.name)]}`}>
            {place.name}
          </h3>
          {placeDetails(place) && <p className="region">{placeDetails(place)}</p>}
        </div>
        {pending && (
          <div className="pick">
            <button type="button" className="btn-yellow" onClick={props.onPut}>
              Put {pending.name} here<span className="sr-only"> instead of {place.name}</span>
            </button>
          </div>
        )}
      </div>

      <div className="msg">
        {weather && load?.status === "done" ? (
          <>
            <div className="msg-top msg-data">
              <div>
                <p className="temp">
                  {Math.round(weather.temperature)}
                  <sup>°C</sup>
                </p>
                <p className="cond">
                  {describeWeather(weather.weatherCode).label}
                  {/* The sky shows day or night; screen readers still hear it in words. */}
                  <span className="sr-only">, {dayPart(weather.sun, weather.isDay, now.getTime())}</span>
                </p>
              </div>
              <Frank index={index} place={place} weather={weather} scene={scene} now={now} />
            </div>
            {stale && (
              <div className="stale" role="status">
                <span>
                  Couldn&apos;t update {place.name}. Showing {clockTime(undefined, stale.at)} data.
                </span>
                <button type="button" onClick={props.onRetry}>
                  Try again
                </button>
              </div>
            )}
            <div className="msg-data">
              <Facts place={place} weather={weather} now={now} />
            </div>
          </>
        ) : load?.status === "error" ? (
          <>
            <div className="msg-top">
              <div>
                <p className="cond">No weather yet</p>
              </div>
              <Frank index={index} place={place} weather={null} scene={null} now={now} />
            </div>
            <div className="msg-alert" role="status">
              <span>
                Couldn&apos;t get the weather for {place.name}. {load.message}
              </span>
              <button type="button" onClick={props.onRetry}>
                Try again
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="msg-top">
              <div aria-hidden="true">
                <span className="skel" style={{ width: 84, height: 46 }} />
                <span className="skel" style={{ width: 96, height: 12, marginTop: 14 }} />
                <span className="skel" style={{ width: 64, height: 10, marginTop: 8 }} />
              </div>
              <Frank index={index} place={place} weather={null} scene={null} now={now} />
            </div>
            <p className="sr-only" role="status">
              Getting the weather for {place.name}…
            </p>
            <div className="facts" aria-hidden="true">
              {[0, 1, 2].map((row) => (
                <span key={row} className="skel" style={{ height: 11, margin: "6px 0 9px" }} />
              ))}
            </div>
          </>
        )}

        <div className="acts">
          <button type="button" onClick={props.onReplace}>
            {ReplaceIcon}
            Replace<span className="sr-only"> {place.name}</span>
          </button>
          <button type="button" onClick={props.onRemove}>
            {RemoveIcon}
            Remove<span className="sr-only"> {place.name}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

const SearchIcon = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="8.5" cy="8.5" r="6" />
    <path d="m13 13 5 5" strokeLinecap="round" />
  </svg>
);

type BlankProps = {
  index: number;
  /** The next place added goes here. */
  next?: boolean;
  /** Without it the card is a still outline (before the saved places are known). */
  onSearch?: () => void;
};

/** A blank postcard in an empty slot: it says which panel of the painting it becomes. */
export function BlankCard({ index, next = false, onSearch }: BlankProps) {
  const position = PANEL_POSITIONS[index];
  const style = { "--i": index } as CSSProperties;
  if (!onSearch) {
    return (
      <div className="pc blank" style={style} aria-hidden="true">
        <div className="blank-pic" />
        <div className="msg">
          <div className="msg-top">
            <div />
            <span className="blank-stamp">°</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <article className={`pc blank ${next ? "is-next" : ""}`} style={style} aria-label={`Empty card, ${position.toLowerCase()} panel`}>
      <div className="blank-pic">
        <QuadrantMark index={index} color={SLOT_COLORS[index]} />
        <span>{position} panel</span>
      </div>
      <div className="msg">
        <div className="msg-top">
          <div>
            <p className="blank-title">Add a place</p>
            <p className="blank-note">It becomes the {position.toLowerCase()} panel of the painting.</p>
          </div>
          <span className="blank-stamp" aria-hidden="true">
            °
          </span>
        </div>
        <div className="acts">
          <button type="button" className="btn-ink" onClick={onSearch}>
            {SearchIcon}
            Search for a place<span className="sr-only"> for the {position.toLowerCase()} card</span>
          </button>
        </div>
      </div>
    </article>
  );
}
