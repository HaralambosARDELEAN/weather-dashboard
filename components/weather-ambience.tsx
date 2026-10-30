import type { CSSProperties } from "react";
import { describeWeather, precipitation, type Precipitation } from "@/lib/weather-codes";

function Layer({ name }: { name: string }) {
  return <div aria-hidden="true" className={`ambience ambience-${name}`} />;
}

// Light rain shows only the far layer; moderate adds the middle one; heavy adds the near one too.
const RAIN_LAYERS = ["rain-far", "rain-mid", "rain-near"] as const;

/** Rain at different depths. Drizzle is finer, denser and slower than rain; more layers when it falls harder. */
function Rain({ fall }: { fall: Precipitation }) {
  return (
    <div aria-hidden="true" className={`ambience overflow-hidden ${fall.type === "drizzle" ? "rain-drizzle" : ""}`}>
      {RAIN_LAYERS.slice(0, fall.level).map((layer) => (
        <div key={layer} className={`rain-layer ${layer}`} />
      ))}
      {/* A downpour adds a dense, fast sheet of rain in front, so it reads as heavy at a glance. */}
      {fall.level === 3 && <div className="rain-layer rain-near rain-sheet" />}
    </div>
  );
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * A quiet moving sky behind a pane: sun or moon light, drifting clouds, rain, snow, fog. Decorative only.
 * The wind tilts the rain and snow and speeds up the clouds, so a gale looks different from still air.
 */
export function WeatherAmbience({ code, isDay, windSpeed = 10 }: { code: number; isDay: boolean; windSpeed?: number }) {
  const fall = precipitation(code);
  const wind = {
    "--slant": `${clamp(4 + windSpeed * 0.55, 4, 32)}deg`,
    "--drift": `${clamp(60 - windSpeed, 14, 60)}s`,
    "--snow-level": fall?.type === "snow" ? fall.level : 2,
  } as CSSProperties;

  return (
    <div aria-hidden="true" className="ambience" style={wind}>
      {(() => {
        switch (describeWeather(code).kind) {
          case "clear":
            return isDay ? (
              <Layer name="sun" />
            ) : (
              <>
                <Layer name="stars" />
                <Layer name="moon" />
              </>
            );
          case "cloudy":
            return <Layer name={isDay ? "clouds" : "clouds-night"} />;
          case "fog":
            return <Layer name="fog" />;
          case "rain":
            return <Rain fall={fall ?? { type: "rain", level: 2 }} />;
          case "snow":
            // Light snow: one layer of small flakes; moderate adds bigger near flakes; heavy adds a dense curtain.
            return (
              <>
                <Layer name="snow" />
                {(fall?.level ?? 2) >= 2 && <Layer name="snow-near" />}
                {fall?.level === 3 && <Layer name="snow-dense" />}
              </>
            );
          case "storm":
            return (
              <>
                <Rain fall={fall ?? { type: "rain", level: 3 }} />
                <Layer name="flash" />
              </>
            );
        }
      })()}
    </div>
  );
}
