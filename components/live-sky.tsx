import { useId, type CSSProperties } from "react";
import type { Weather } from "@/lib/schemas";
import { skyKind, skyPhase, type SkyKind, type SkyPhase } from "@/lib/scene";
import { temperatureEffect } from "@/lib/sky";
import { FrostEdge } from "./frost-edge";
import { WeatherAmbience } from "./weather-ambience";

/** [offset, colour, opacity] */
type Stop = readonly [number, string, number?];

type Palette = {
  sky: readonly Stop[];
  /** Fills of the cloud lid, in shape order. */
  lid: readonly string[];
  far: string;
  farOpacity?: number;
  hillLight?: string;
  near: string;
  nearOpacity?: number;
  ground: string;
  /** How dark the scrim under the name is: lighter skies need less. */
  scrim: number;
  /** Lit windows in the roofline. */
  lights: boolean;
  /** Colour of the rain and snow drawn over the sky. */
  precip: string;
  /** The low sun's glow, for dawn and dusk. */
  glow?: { x: number; y: number };
  undersides?: readonly string[];
  /** The pale band over the horizon in the blue hour. */
  band?: readonly string[];
};

// Day under cloud and night under cloud are the model's checked colours; the others were tuned on screen.
const DAY_GREY: Palette = {
  sky: [[0, "#97A1B8"], [0.5, "#C2C7D2"], [0.82, "#DCDAD7"], [1, "#E8E1D6"]],
  lid: ["#848DA5", "#8B93A9", "#828BA3", "#9CA2B3", "#989EB0", "#BEC1CA", "#C4C6CE"],
  far: "#999A90",
  near: "#6C7285",
  ground: "#8C8679",
  scrim: 0.5,
  lights: false,
  precip: "#3E4766",
};
const NIGHT_GREY: Palette = {
  sky: [[0, "#090D26"], [0.5, "#151A3F"], [0.76, "#2B2850"], [0.86, "#47344F"]],
  lid: ["#060920", "#0A0E28", "#060920", "#1B1F46", "#262857", "#38335E", "#38335E"],
  far: "#1B1F47",
  hillLight: "#3A4178",
  near: "#060918",
  ground: "#0A0D24",
  scrim: 0.6,
  lights: true,
  precip: "#B9C3EA",
};
const DAWN: Palette = {
  sky: [[0, "#3D3B5C"], [0.38, "#6A5E82"], [0.66, "#B68196"], [0.84, "#E8A58E"], [1, "#F6C69A"]],
  lid: ["#34324F", "#3C395A", "#34324F", "#5A5174", "#665A7C", "#5A5174", "#665A7C"],
  undersides: ["#C98E95", "#E2A497", "#9E6F88"],
  glow: { x: 74, y: 178 },
  far: "#8E6E86",
  farOpacity: 0.85,
  near: "#2E2440",
  ground: "#271E35",
  scrim: 0.6,
  lights: true,
  precip: "#F4E3EA",
};
const DUSK: Palette = {
  sky: [[0, "#2C2F5E"], [0.4, "#6B4F86"], [0.68, "#D9767A"], [0.86, "#F5A26B"], [1, "#FBC879"]],
  lid: DAWN.lid,
  undersides: ["#E99A7E", "#E99A7E", "#B9707A"],
  glow: { x: 226, y: 182 },
  far: "#8A637A",
  near: "#2A2140",
  ground: "#231B33",
  scrim: 0.6,
  lights: true,
  precip: "#F7E4DA",
};
const TWILIGHT: Palette = {
  sky: [[0, "#151E4C"], [0.42, "#2B3B78"], [0.66, "#5568A2"], [0.8, "#93A2C8"]],
  lid: ["#0F1640", "#141C4A", "#0F1640", "#202B5E", "#26336A", "#33427A", "#33427A"],
  band: ["#8E9CC0", "#9AA7C7"],
  far: "#33427C",
  near: "#0E1538",
  ground: "#0B112E",
  scrim: 0.6,
  lights: true,
  precip: "#CDD6F4",
};
const DAY_CLEAR: Palette = {
  sky: [[0, "#2F63D0"], [0.55, "#6F9BE6"], [0.85, "#BFD6F2"], [1, "#EDE4CF"]],
  lid: ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#F4F6FB", "#FFFFFF", "#F4F6FB"],
  far: "#7C8FB0",
  near: "#3F4D73",
  ground: "#59617A",
  scrim: 0.55,
  lights: false,
  precip: "#3F4D73",
};
const NIGHT_CLEAR: Palette = {
  sky: [[0, "#060A22"], [0.55, "#10183F"], [0.85, "#1F2B5C"], [1, "#2D3A6C"]],
  lid: NIGHT_GREY.lid,
  far: "#1E2550",
  near: "#070A1C",
  ground: "#0A0D24",
  scrim: 0.6,
  lights: true,
  precip: "#B9C3EA",
};
const FOG_DAY: Palette = {
  ...DAY_GREY,
  sky: [[0, "#B8BEC9"], [0.6, "#CDD1D8"], [1, "#DADBDD"]],
  farOpacity: 0.35,
  nearOpacity: 0.45,
};
const FOG_NIGHT: Palette = {
  ...NIGHT_GREY,
  sky: [[0, "#2A3050"], [1, "#4A5170"]],
  farOpacity: 0.35,
  nearOpacity: 0.45,
};
const STORM: Palette = {
  sky: [[0, "#23243C"], [0.5, "#3A3B57"], [0.85, "#5A5872"], [1, "#6E6A80"]],
  lid: ["#1A1B30", "#23243C", "#1A1B30", "#2E2F4A", "#3A3A56", "#3A3A56", "#2E2F4A"],
  far: "#2E2F4A",
  near: "#14152A",
  ground: "#10111F",
  scrim: 0.6,
  lights: true,
  precip: "#C9CEE6",
};

function paletteFor(kind: SkyKind, phase: SkyPhase): Palette {
  if (phase === "dawn") return DAWN;
  if (phase === "dusk") return DUSK;
  if (phase === "twilight") return TWILIGHT;
  const day = phase === "day";
  if (kind === "storm") return STORM;
  if (kind === "fog") return day ? FOG_DAY : FOG_NIGHT;
  if (kind === "clear" || kind === "partly") return day ? DAY_CLEAR : NIGHT_CLEAR;
  return day ? DAY_GREY : NIGHT_GREY;
}

/** Mixes a #RRGGBB colour with white. */
function lighten(hex: string, amount: number): string {
  const channel = (i: number) => {
    const value = parseInt(hex.slice(i, i + 2), 16);
    return Math.round(value + (255 - value) * amount)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(1)}${channel(3)}${channel(5)}`;
}

// Codes that leave ice on everything: freezing fog, freezing drizzle and freezing rain.
const ICY = new Set([48, 56, 57, 66, 67]);

export type Scene = {
  kind: SkyKind;
  phase: SkyPhase;
  palette: Palette;
  frost: boolean;
  heat: boolean;
};

/** Everything the live sky needs, worked out from the weather and the time. */
export function sceneFor(weather: Weather, now: number): Scene {
  const kind = skyKind(weather.weatherCode);
  const phase = skyPhase(weather.sun, weather.isDay, now);
  const frost = weather.temperature <= 0 || ICY.has(weather.weatherCode);
  let palette = paletteFor(kind, phase);
  if (kind === "snow" || frost) {
    const day = phase === "day";
    palette = {
      ...palette,
      sky: kind === "snow" ? palette.sky.map(([offset, color, opacity]) => [offset, lighten(color, 0.12), opacity] as const) : palette.sky,
      ground: day ? "#E9ECF2" : "#8C93B3",
      // White snow on the ground under a white name needs a darker scrim.
      scrim: day ? 0.66 : palette.scrim,
      precip: kind === "snow" ? "#FFFFFF" : palette.precip,
    };
  }
  return { kind, phase, palette, frost, heat: weather.temperature >= 30 };
}

/** The model's seeded random numbers, so a place always gets the same roofline. */
function park(seed: number) {
  let s = seed % 2147483647 || 7;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const GROUND = 212;

type Building = { x: number; w: number; h: number; gable: boolean };

// A low, generic roofline, so no particular city is suggested.
function roofline(seed: number): Building[] {
  const rnd = park(seed);
  const buildings: Building[] = [];
  for (let x = -4; x < 304; ) {
    const w = 8 + rnd() * 16;
    const h = 6 + rnd() * 18;
    buildings.push({ x, w, h, gable: rnd() < 0.25 });
    x += w + (rnd() < 0.3 ? rnd() * 10 : 0);
  }
  return buildings;
}

type Light = { x: number; y: number; opacity: number };

function windows(buildings: Building[], seed: number): Light[] {
  const rnd = park(seed + 101);
  const lights: Light[] = [];
  for (const { x, w, h } of buildings) {
    for (let wy = GROUND - h + 3; wy < GROUND - 3; wy += 6) {
      for (let wx = x + 2; wx < x + w - 2.5; wx += 4.5) {
        if (rnd() < 0.16) lights.push({ x: wx, y: wy, opacity: 0.55 + rnd() * 0.45 });
      }
    }
  }
  return lights;
}

function stars(seed: number, count: number, maxY: number) {
  const rnd = park(seed + 7);
  return Array.from({ length: count }, (_, i) => ({
    x: rnd() * 300,
    y: 4 + rnd() * maxY,
    r: 0.4 + rnd() * 0.6,
    opacity: 0.4 + rnd() * 0.5,
    twinkle: i % 7 === 0,
  }));
}

// The cloud lid: wide soft ellipses, darkest at the top. Partly cloudy keeps only shapes 4, 5 and 7.
const LID = [
  [20, 18, 95, 26],
  [165, 10, 100, 22],
  [285, 26, 80, 24],
  [85, 60, 85, 15],
  [235, 70, 90, 15],
  [150, 100, 95, 10],
  [10, 112, 60, 8],
] as const;
const PARTLY = [3, 4, 6];

const HILLS = "M0 186C24 176 52 168 86 171S146 160 182 165 246 156 300 170V212H0Z";
const HILL_TOP = "M0 186C24 176 52 168 86 171S146 160 182 165 246 156 300 170";

function gradientStops(stops: readonly Stop[]) {
  return stops.map(([offset, color, opacity]) => <stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity ?? 1} />);
}

type Props = {
  scene: Scene;
  weather: Weather;
  /** Picks the roofline; the place id, so each place keeps its own. */
  seed: number;
};

/**
 * The picture side of a postcard before painting: a sky drawn from the live weather and local light,
 * over a generic horizon. Rain, snow, fog and drifting cloud come from WeatherAmbience; frost and heat from their edges.
 */
export function LiveSky({ scene, weather, seed }: Props) {
  const id = useId().replace(/[^\w-]/g, "");
  const { kind, phase, palette } = scene;
  const clearish = kind === "clear" || kind === "partly";
  const covered = kind === "overcast" || kind === "drizzle" || kind === "rain" || kind === "snow" || kind === "storm";
  const wet = kind === "drizzle" || kind === "rain" || kind === "storm";
  const lamp = palette.lights && phase !== "day" && (wet || kind === "snow");
  const lid = covered ? LID.map((_, i) => i) : kind === "partly" ? PARTLY : [];
  const lidOpacity = kind === "partly" && phase === "day" ? 0.85 : kind === "partly" ? 0.75 : 1;
  const buildings = roofline(seed);
  const lights = palette.lights ? windows(buildings, seed) : [];
  const starField = clearish && phase === "night" ? stars(seed, 40, 136) : clearish && phase === "twilight" ? stars(seed, 14, 70) : [];
  const effect = temperatureEffect(weather.temperature);
  const fogColor = phase === "day" ? "#E6E7EA" : phase === "dawn" || phase === "dusk" ? "#E8C8C0" : "#6A7090";

  return (
    <>
      <svg className="sky" viewBox="0 0 300 236" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            {gradientStops(palette.sky)}
          </linearGradient>
          {palette.glow && (
            <radialGradient id={`${id}-glow`} cx={palette.glow.x} cy={palette.glow.y} r="120" gradientUnits="userSpaceOnUse">
              {gradientStops([[0, "#FFE6B8", 0.95], [0.3, "#FFC792", 0.5], [1, "#FFB080", 0]])}
            </radialGradient>
          )}
          <radialGradient id={`${id}-sun`} cx="248" cy="44" r="60" gradientUnits="userSpaceOnUse">
            {gradientStops(phase === "day" ? [[0, "#FFE8A8", 0.6], [1, "#FFE8A8", 0]] : [[0, "#DCE4FF", 0.28], [1, "#DCE4FF", 0]])}
          </radialGradient>
          {lamp && (
            <radialGradient id={`${id}-lamp`} cx="252" cy="128" r="74" gradientUnits="userSpaceOnUse">
              {gradientStops([[0, "#FFC271", 0.7], [0.35, "#FFA552", 0.22], [1, "#FF9A4A", 0]])}
            </radialGradient>
          )}
          {scene.heat && (
            <radialGradient id={`${id}-heat`} cx="150" cy="236" r="142" gradientUnits="userSpaceOnUse">
              {gradientStops([[0, "#FFBE6E", 0.35], [1, "#FFBE6E", 0]])}
            </radialGradient>
          )}
        </defs>

        <rect width="300" height="236" fill={`url(#${id}-sky)`} />
        {palette.glow && <rect width="300" height="236" fill={`url(#${id}-glow)`} />}

        {starField.map((star, i) => (
          <circle key={i} className={star.twinkle ? "twinkle" : undefined} cx={star.x} cy={star.y} r={star.r} fill="#fff" opacity={star.opacity} />
        ))}
        {/* Sun or moon in a clear or partly cloudy sky; a low sun on the horizon at dawn and dusk. */}
        {clearish && (phase === "day" || phase === "night") && (
          <>
            <rect width="300" height="236" fill={`url(#${id}-sun)`} />
            <circle cx="248" cy="44" r={phase === "day" ? 14 : 8} fill={phase === "day" ? "#FFF6DA" : "#F2EEDC"} />
          </>
        )}
        {clearish && palette.glow && <circle cx={palette.glow.x} cy="182" r="11" fill="#FFE9C4" />}

        {lid.length > 0 && (
          <g filter="url(#b10)" opacity={lidOpacity}>
            {lid.map((i) => {
              const [cx, cy, rx, ry] = LID[i];
              return <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={palette.lid[i]} />;
            })}
          </g>
        )}
        {lid.length > 0 && palette.undersides && (
          <g filter="url(#b6)">
            <ellipse cx="85" cy="68" rx="72" ry="7" fill={palette.undersides[0]} opacity=".85" />
            <ellipse cx="235" cy="78" rx="76" ry="7" fill={palette.undersides[1]} opacity=".75" />
            <ellipse cx="150" cy="106" rx="82" ry="5" fill={palette.undersides[2]} opacity=".7" />
          </g>
        )}
        {palette.band && (
          <g filter="url(#b6)">
            <ellipse cx="150" cy="158" rx="190" ry="11" fill={palette.band[0]} opacity=".55" />
            <ellipse cx="70" cy="168" rx="120" ry="6" fill={palette.band[1]} opacity=".45" />
          </g>
        )}

        <path d={HILLS} fill={palette.far} opacity={palette.farOpacity ?? 1} />
        {palette.hillLight && <path d={HILL_TOP} fill="none" stroke={palette.hillLight} strokeWidth="1.2" opacity=".8" />}
        {scene.frost && <path d={HILL_TOP} fill="none" stroke="#fff" strokeWidth="1.6" opacity=".55" />}

        <g fill={palette.near} opacity={palette.nearOpacity ?? 1}>
          {buildings.map(({ x, w, h, gable }) => (
            <g key={x}>
              <rect x={x} y={GROUND - h} width={w + 0.3} height={h} />
              {gable && <path d={`M${x} ${GROUND - h}L${x + w / 2} ${GROUND - h - w * 0.45}L${x + w} ${GROUND - h}Z`} />}
            </g>
          ))}
        </g>
        <rect y={GROUND} width="300" height={236 - GROUND} fill={palette.ground} />

        {lights.length > 0 && (
          <g fill="#FFC978">
            {lights.map((light, i) => (
              <rect key={i} className={i === 3 ? "twinkle" : undefined} x={light.x} y={light.y} width="1.8" height="2.4" opacity={light.opacity} />
            ))}
          </g>
        )}
        {/* Lit windows reflected on a wet street. */}
        {wet && lights.length > 0 && (
          <g fill="#FFC56A" opacity=".4" filter="url(#b1)">
            {lights
              .filter((_, i) => i % 3 === 0)
              .slice(0, 14)
              .map((light, i) => (
                <rect key={i} x={light.x} y={GROUND + 2} width="1.6" height={10 + (i % 3) * 5} />
              ))}
          </g>
        )}
        {lamp && (
          <>
            <rect width="300" height="236" fill={`url(#${id}-lamp)`} />
            <g fill="#05081A">
              <rect x="236" y="122" width="2.4" height="104" />
              <path d="M237 124q8-6 15-2" stroke="#05081A" strokeWidth="2" fill="none" />
            </g>
            <ellipse cx="252" cy="124" rx="5.5" ry="2.2" fill="#FFE3AA" />
            {wet && <rect x="246" y="222" width="12" height="14" fill="#FFB867" opacity=".45" filter="url(#b3)" />}
          </>
        )}

        {kind === "fog" && (
          <g filter="url(#b6)" fill={fogColor} opacity={phase === "day" ? 0.5 : 0.4}>
            <ellipse cx="90" cy="122" rx="170" ry="10" />
            <ellipse cx="220" cy="150" rx="160" ry="11" />
            <ellipse cx="120" cy="176" rx="190" ry="9" />
            <ellipse cx="200" cy="200" rx="170" ry="10" />
          </g>
        )}
        {scene.frost && <rect width="300" height="236" fill="rgba(205,222,255,.12)" />}
        {scene.heat && (
          <>
            <rect width="300" height="236" fill={`url(#${id}-heat)`} />
            <rect width="300" height="236" fill="#fff" opacity=".1" />
          </>
        )}
      </svg>

      <div className="ambience" style={{ color: palette.precip } as CSSProperties}>
        <WeatherAmbience code={weather.weatherCode} isDay={weather.isDay} windSpeed={weather.windSpeed} />
      </div>
      {effect?.kind === "frost" && <FrostEdge level={effect.level} />}
      {effect?.kind === "heat" && <div aria-hidden="true" className="ambience ambience-heat" style={{ opacity: 0.35 + 0.5 * effect.level }} />}
    </>
  );
}
