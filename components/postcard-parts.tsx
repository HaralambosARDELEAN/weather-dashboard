import { clockTime, postmarkDate, shortDate, stampCountry } from "@/lib/postal";
import type { Place, Weather } from "@/lib/schemas";
import { stampGlyph, sunRows } from "@/lib/scene";
import { LiveSky, type Scene } from "./live-sky";
import { Postmark } from "./postmark";
import { SLOT_COLORS } from "./slots";
import { degrees, Stamp } from "./stamp";

/** "Local time Fri 10:31 AM"; the date is said only when it differs from the viewer's, across the date line. */
export function localTimeSentence(place: Place, now: Date): string {
  const time = clockTime(place.timezone, now);
  const localDate = shortDate(place.timezone, now);
  return localDate === shortDate(undefined, now) ? `Local time ${localDate.split(" ")[0]} ${time}` : `Local time ${localDate}, ${time}`;
}

type SkyProps = {
  place: Place;
  weather: Weather | null;
  scene: Scene | null;
  /** "12:15 AM" when the card shows its quadrant of the painting; null shows the live sky. */
  paintedAt: string | null;
};

/** The picture side's layers: the live sky (or its quadrant of the painting) and a tag that says which one it is. */
export function SkyLayers({ place, weather, scene, paintedAt }: SkyProps) {
  return (
    <>
      {weather && scene ? <LiveSky scene={scene} weather={weather} seed={place.id} /> : <div className="pic-wait" />}
      {paintedAt && (
        <div className="pic-painted">
          <i />
        </div>
      )}
      {paintedAt ? (
        <span className="pic-tag">Painted {paintedAt}</span>
      ) : (
        weather && (
          <span className="pic-tag is-live">
            <i aria-hidden="true" />
            Live sky
          </span>
        )
      )}
    </>
  );
}

type FrankProps = { index: number; place: Place; weather: Weather | null; scene: Scene | null; now: Date };

/** The stamp, the postmark with the local time (the card's signature), and the time in words for screen readers. */
export function Frank({ index, place, weather, scene, now }: FrankProps) {
  const lowSun = scene?.phase === "dawn" || scene?.phase === "dusk";
  return (
    <div className="frank">
      <span className="stampw">
        <Stamp
          color={SLOT_COLORS[index]}
          value={weather ? degrees(weather.temperature) : "–"}
          glyph={weather ? stampGlyph(weather.weatherCode, weather.isDay, lowSun) : "cloud"}
          country={stampCountry(place.country)}
        />
      </span>
      <Postmark top={place.name} bottom="LOCAL TIME" date={postmarkDate(place.timezone, now)} time={clockTime(place.timezone, now)} />
      <p className="sr-only">{localTimeSentence(place, now)}</p>
    </div>
  );
}

/** Wind, today's high and low, and the next sunrise or sunset, with dotted leaders. */
export function Facts({ place, weather, now }: { place: Place; weather: Weather; now: Date }) {
  return (
    <dl className="facts">
      <div>
        <dt>Wind</dt>
        <dd>{Math.round(weather.windSpeed)} km/h</dd>
      </div>
      <div>
        <dt>High / low</dt>
        <dd>
          {Math.round(weather.high)}°C / {Math.round(weather.low)}°C
        </dd>
      </div>
      {sunRows(weather.sun, now.getTime()).map((row) =>
        row.at === null ? (
          <div key={row.label}>
            <dt>Sun</dt>
            <dd>{row.label === "Sun up all day" ? "Up all day" : row.label}</dd>
          </div>
        ) : (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>
              {clockTime(place.timezone, row.at)}
              {row.relative && <small>{row.relative}</small>}
            </dd>
          </div>
        ),
      )}
    </dl>
  );
}
