// Symbols in the style of weather-map station plots: a circle filled by cloud cover,
// dots for rain, commas for drizzle, stars for snow, lines for fog and a bolt for storms.

function dot(x: number, y: number) {
  return <circle cx={x} cy={y} r={3} fill="currentColor" stroke="none" />;
}

function comma(x: number, y: number) {
  return (
    <g>
      <circle cx={x} cy={y} r={2.6} fill="currentColor" stroke="none" />
      <path d={`M${x + 2.4} ${y + 0.5}q0 4.5-3.6 6.5`} />
    </g>
  );
}

function star(x: number, y: number, r: number) {
  const dx = (r * Math.sqrt(3)) / 2;
  const d = `M${x} ${y - r}V${y + r}M${x - dx} ${y - r / 2}L${x + dx} ${y + r / 2}M${x - dx} ${y + r / 2}L${x + dx} ${y - r / 2}`;
  return <path d={d} />;
}

// 0 = clear, 1 = mainly clear, 2 = partly cloudy, 3 = overcast
function cover(code: number) {
  return (
    <>
      <circle cx={16} cy={16} r={10} />
      {code === 1 && <path d="M16 16V6a10 10 0 0 1 10 10z" fill="currentColor" />}
      {code === 2 && <path d="M16 6a10 10 0 0 1 0 20z" fill="currentColor" />}
      {code === 3 && <circle cx={16} cy={16} r={10} fill="currentColor" />}
    </>
  );
}

const LIGHT = new Set([51, 56, 61, 66, 71, 80, 85]);

function symbolFor(code: number) {
  if (code === 45 || code === 48) return <path d="M5 10h22M5 16h22M5 22h22" />;
  if (code >= 51 && code <= 57) return LIGHT.has(code) ? comma(16, 12) : <>{comma(10, 12)}{comma(22, 12)}</>;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return LIGHT.has(code) ? <>{dot(10, 16)}{dot(22, 16)}</> : <>{dot(16, 9)}{dot(9, 21)}{dot(23, 21)}</>;
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return LIGHT.has(code) ? star(16, 16, 9) : <>{star(9.5, 16, 5.5)}{star(22.5, 16, 5.5)}</>;
  }
  if (code >= 95) return <path d="M18 3 9 18h7l-3 11 11-16h-7z" />;
  return cover(code);
}

export function WeatherSymbol({ code, className }: { code: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {symbolFor(code)}
    </svg>
  );
}
