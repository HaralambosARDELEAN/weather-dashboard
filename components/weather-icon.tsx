// Weather icons drawn for this app: sun, moon, clouds, rain, snow, fog and storm.

const SUN = "#ffc94a";
const MOON = "#f4efdc";
const CLOUD = "#ffffff";
const CLOUD_BACK = "#c3cfd9";
const STORM_CLOUD = "#5d6675";
const DROP = "#3f9be6";
const FLAKE = "#6fb4ea";
const FOG = "#8a97a4";

function Sun({ x, y, r }: { x: number; y: number; r: number }) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4;
    const [inner, outer] = [r + 4, r + 9];
    return (
      <line
        key={i}
        x1={(x + inner * Math.cos(angle)).toFixed(2)}
        y1={(y + inner * Math.sin(angle)).toFixed(2)}
        x2={(x + outer * Math.cos(angle)).toFixed(2)}
        y2={(y + outer * Math.sin(angle)).toFixed(2)}
      />
    );
  });
  return (
    <g>
      <g className="icon-spin" style={{ transformOrigin: `${x}px ${y}px` }} stroke={SUN} strokeWidth={3} strokeLinecap="round">
        {rays}
      </g>
      <circle cx={x} cy={y} r={r} fill={SUN} />
    </g>
  );
}

function Moon({ x, y, size }: { x: number; y: number; size: number }) {
  // A crescent: a disc with a second disc taken out of its upper right.
  const s = size / 24;
  return (
    <path
      transform={`translate(${x - size / 2} ${y - size / 2}) scale(${s})`}
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      fill={MOON}
    />
  );
}

/** A cloud 40 wide and 28 tall at scale 1, its top left near (13, 17). */
function Cloud({ x = 0, y = 0, scale = 1, fill = CLOUD }: { x?: number; y?: number; scale?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill={fill}>
      <circle cx={22} cy={36} r={9} />
      <circle cx={33} cy={29} r={12} />
      <circle cx={44} cy={36} r={9} />
      <rect x={13} y={34} width={40} height={11} rx={5.5} />
    </g>
  );
}

function Drops({ xs }: { xs: number[] }) {
  return (
    <g stroke={DROP} strokeWidth={3.5} strokeLinecap="round">
      {xs.map((x, i) => (
        <line key={x} className="icon-drop" style={{ animationDelay: `${i * 0.35}s` }} x1={x} y1={45} x2={x - 2.5} y2={54} />
      ))}
    </g>
  );
}

function Flakes({ xs }: { xs: number[] }) {
  return (
    <g stroke={FLAKE} strokeWidth={2.5} strokeLinecap="round">
      {xs.map((x, i) => (
        <g key={x} className="icon-flake" style={{ animationDelay: `${i * 0.6}s` }}>
          <path d={`M${x} 44v10M${x - 4.3} 46.5l8.6 5M${x - 4.3} 51.5l8.6-5`} />
        </g>
      ))}
    </g>
  );
}

const LIGHT = new Set([51, 56, 61, 66, 71, 77, 80, 85]);

function iconFor(code: number, isDay: boolean) {
  const sky = (x: number, y: number, r: number) =>
    isDay ? <Sun x={x} y={y} r={r} /> : <Moon x={x} y={y} size={r * 3} />;

  if (code === 0) return sky(32, 32, 12);
  if (code === 1) {
    return (
      <>
        {sky(26, 26, 11)}
        <Cloud x={20} y={18} scale={0.72} />
      </>
    );
  }
  if (code === 2) {
    return (
      <>
        {sky(22, 22, 10)}
        <Cloud x={6} y={6} />
      </>
    );
  }
  if (code === 45 || code === 48) {
    return (
      <>
        <Cloud y={-8} />
        <path d="M14 46h36M18 52h28M22 58h20" stroke={FOG} strokeWidth={3} strokeLinecap="round" />
      </>
    );
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return (
      <>
        <g className="icon-float">
          <Cloud y={-8} />
        </g>
        <Drops xs={LIGHT.has(code) ? [26, 40] : [21, 33, 45]} />
      </>
    );
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return (
      <>
        <g className="icon-float">
          <Cloud y={-8} />
        </g>
        <Flakes xs={LIGHT.has(code) ? [26, 40] : [20, 32, 44]} />
      </>
    );
  }
  if (code >= 95) {
    return (
      <>
        <Cloud y={-8} fill={STORM_CLOUD} />
        <path className="icon-bolt" d="M35 34 27 47h6l-3 12 11-16h-6l3-9z" fill={SUN} />
      </>
    );
  }
  // 3 (overcast) and anything unknown: two clouds.
  return (
    <g className="icon-float">
      <Cloud x={-6} y={-8} scale={0.9} fill={CLOUD_BACK} />
      <Cloud x={2} y={4} />
    </g>
  );
}

export function WeatherIcon({ code, isDay, className }: { code: number; isDay: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={`weather-icon ${className ?? ""}`}>
      {iconFor(code, isDay)}
    </svg>
  );
}
