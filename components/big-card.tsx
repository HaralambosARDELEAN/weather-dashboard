"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { listNames, placeLabel } from "@/lib/format";
import type { Picture } from "@/lib/picture";
import { clockTime, postmarkDate, shortDate, stampCountry } from "@/lib/postal";
import { PANEL_POSITIONS } from "@/lib/prompt";
import { paintingAlt, splitPrompt } from "@/lib/prompt-lines";
import type { Weather } from "@/lib/schemas";
import { stampGlyph } from "@/lib/scene";
import type { Slots } from "@/lib/storage";
import { LiveSky, sceneFor } from "./live-sky";
import { Postmark } from "./postmark";
import { PromptText } from "./prompt-text";
import { QuadrantMark } from "./quadrant-mark";
import { SLOT_COLORS, SLOT_KEYS } from "./slots";
import { degrees, Stamp } from "./stamp";

type Props = {
  slots: Slots;
  weatherFor: (placeId: number) => Weather | null;
  now: Date;
  picture: Picture | null;
  /** The desk shows other places than the painting. */
  outdated: boolean;
  /** When the current painting started; null when nothing is being painted. */
  startedAt: number | null;
  error: string | null;
  /** The postcard under the pointer or focus: its quadrant lights up. */
  hovered: number | null;
  /** The airmail paint button, on the message side. */
  paint: ReactNode;
  onOpen: () => void;
};

const Icons = {
  open: <path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9" />,
  download: <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M2.5 13.5h11" />,
};

function Icon({ name }: { name: keyof typeof Icons }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {Icons[name]}
    </svg>
  );
}

/** Over the picture while it is painted: what is being painted. */
function Developing({ names }: { names: string[] }) {
  return (
    <div className="developing">
      <b>Painting {listNames(names)}</b>
    </div>
  );
}

/** Before the first painting: the four live skies, tiled in the order they will be painted. */
function Preview({ slots, weatherFor, now }: Pick<Props, "slots" | "weatherFor" | "now">) {
  return (
    <div className="preview" aria-hidden="true">
      {slots.map((place, i) => {
        const weather = place ? weatherFor(place.id) : null;
        if (!place) {
          return (
            <div key={i} className="empty">
              <span className="tile-name">{PANEL_POSITIONS[i]}</span>
            </div>
          );
        }
        return (
          <div key={i}>
            {weather ? <LiveSky scene={sceneFor(weather, now.getTime())} weather={weather} seed={place.id} /> : <div className="pic-wait" />}
            <span className="tile-name">{place.name}</span>
          </div>
        );
      })}
    </div>
  );
}

/** The big card "from all four": the painting on the picture side, the prompt it was made from as the message. */
export function BigCard({ slots, weatherFor, now, picture, outdated, startedAt, error, hovered, paint, onOpen }: Props) {
  const painting = startedAt !== null;
  const { panels, rules } = picture ? splitPrompt(picture.prompt) : { panels: [], rules: [] };
  const names = slots.flatMap((place) => (place ? [place.name] : []));

  return (
    <article
      className={`big ${picture ? "" : "big-gap"}`}
      aria-labelledby="big-title"
      aria-busy={painting || undefined}
      data-hover={hovered === null ? undefined : SLOT_KEYS[hovered]}
    >
      <figure className="big-pic">
        {picture ? (
          <Image key={picture.id} className="develop" src={picture.image} alt={paintingAlt(panels)} width={1024} height={1024} unoptimized />
        ) : (
          <>
            <Preview slots={slots} weatherFor={weatherFor} now={now} />
            {!painting && names.length > 0 && <span className="pic-tag">Live skies, not painted yet</span>}
          </>
        )}
        <span className="dim" />
        {SLOT_KEYS.map((key) => (
          <span key={key} className={`q q-${key}`} />
        ))}
        {painting && <Developing names={names} />}
      </figure>

      <div className="big-msg">
        {error && !painting && (
          <div className="big-alert" role="alert">
            <span>{error}</span>
          </div>
        )}
        {picture && outdated && !painting && (
          <div className="big-banner">
            <span>Painted for a different set of places. Paint again to match.</span>
          </div>
        )}
        <div className="big-head">
          <h2 id="big-title">
            <span>{picture ? `Painted at ${clockTime(undefined, picture.createdAt)}, your time` : "Not painted yet"}</span>
            Greetings <span className="four">from</span>
            {/* Like a real postcard: "Greetings from" and the places, which follow the four cards. */}
            <span className="big-places">{(picture ? picture.names : names).join(" · ") || "your four places"}</span>
          </h2>
          <div className="block4" aria-hidden="true">
            <div className="grid4">
              {picture
                ? panels.map((panel) => (
                    <Stamp
                      key={panel.index}
                      color={SLOT_COLORS[panel.index]}
                      value={panel.temperature === null ? "–" : degrees(panel.temperature)}
                      glyph={panel.code === null ? "cloud" : stampGlyph(panel.code, !panel.night)}
                      country={stampCountry(panel.country)}
                    />
                  ))
                : slots.map((place, i) => {
                    const weather = place ? weatherFor(place.id) : null;
                    return place && weather ? (
                      <Stamp
                        key={i}
                        color={SLOT_COLORS[i]}
                        value={degrees(weather.temperature)}
                        glyph={stampGlyph(weather.weatherCode, weather.isDay)}
                        country={stampCountry(place.country)}
                      />
                    ) : (
                      <span key={i} className="blank-stamp">
                        °
                      </span>
                    );
                  })}
            </div>
            {/* Posted when painted: the postmark arrives with the painting. */}
            {picture && (
              <Postmark
                key={picture.id}
                top="YOUR TIME"
                bottom="PAINTED"
                date={postmarkDate(undefined, picture.createdAt)}
                time={clockTime(undefined, picture.createdAt)}
              />
            )}
          </div>
        </div>

        {paint}

        {picture ? (
          <>
            <p className="note">
              The message is the prompt the painting was made from. It used the weather at that hour, so its numbers can differ from the
              postcards above.
            </p>
            <PromptText prompt={picture.prompt} panels={panels} rules={rules} />
          </>
        ) : (
          <>
            <p className="note">
              A 2×2 painting with a panel for each place, lit by its own weather and local time. When it is painted, the message becomes the
              prompt it was made from, one line per panel.
            </p>
            <ul className="lines">
              {slots.map((place, i) => (
                <li key={i} data-q={SLOT_KEYS[i]}>
                  <QuadrantMark index={i} color={SLOT_COLORS[i]} />
                  <div>
                    <b>
                      {PANEL_POSITIONS[i]}
                      <span className="sr-only">: </span>
                    </b>
                    {place ? placeLabel(place) : "Empty. Add a place to fill this panel."}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {picture && (
        <div className="big-foot">
          <dl className="addr">
            <div>
              <dt>Painted</dt>
              <dd>
                {shortDate(undefined, picture.createdAt).split(" ")[0]} {clockTime(undefined, picture.createdAt)}, your time
              </dd>
            </div>
            <div>
              <dt>Took</dt>
              <dd>{picture.seconds} s</dd>
            </div>
          </dl>
          <div className="big-acts">
            <button type="button" className="btn-ink" onClick={onOpen}>
              <Icon name="open" />
              Open large
            </button>
            <a className="btn-ink" href={picture.image} download={`skypost-${new Date(picture.createdAt).toISOString().slice(0, 10)}.webp`}>
              <Icon name="download" />
              Download
            </a>
          </div>
        </div>
      )}
    </article>
  );
}
