// Frost on the card, like a frozen window pane: fine rime that is thick at the edges
// and clear in the middle, and a few six-armed ice crystals that glint.

// One arm of an ice crystal pointing up from the centre (12, 12), with two pairs of side twigs.
const ARM = "M12 12V2.5M12 5.5 9.6 3.6M12 5.5l2.4-1.9M12 8.6l-1.9-1.5M12 8.6l1.9-1.5";

function Crystal({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="white" strokeWidth={1.3} strokeLinecap="round">
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <path key={angle} d={ARM} transform={`rotate(${angle} 12 12)`} />
      ))}
    </svg>
  );
}

// Where the crystals sit, near the edges; the colder it is, the more of them show.
const CRYSTALS = [
  { left: "5%", top: "6%", size: 18, delay: 0 },
  { left: "86%", top: "44%", size: 20, delay: 1.2 },
  { left: "8%", top: "86%", size: 18, delay: 2.1 },
  { left: "80%", top: "88%", size: 14, delay: 0.6 },
  { left: "3%", top: "47%", size: 12, delay: 1.7 },
  { left: "46%", top: "3%", size: 12, delay: 2.6 },
  { left: "90%", top: "68%", size: 12, delay: 0.3 },
  { left: "52%", top: "93%", size: 14, delay: 1.9 },
  { left: "22%", top: "2%", size: 10, delay: 2.9 },
  { left: "2%", top: "26%", size: 10, delay: 1 },
];

/** level: 0 (at freezing point) to 1 (-30 °C and colder). */
export function FrostEdge({ level }: { level: number }) {
  const count = 4 + Math.round(6 * level);
  return (
    <div aria-hidden="true" className="ambience" style={{ opacity: 0.55 + 0.45 * level }}>
      <div className="ambience ambience-frost" />
      <div
        className="ambience frost-rime"
        style={{ "--clear": `${60 - 18 * level}%`, opacity: 0.7 } as React.CSSProperties}
      />
      {CRYSTALS.slice(0, count).map(({ left, top, size, delay }) => (
        <span key={`${left}-${top}`} className="frost-crystal absolute" style={{ left, top, animationDelay: `${delay}s` }}>
          <Crystal size={size} />
        </span>
      ))}
    </div>
  );
}
