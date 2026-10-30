// Frost on the card, like a frozen window pane: a band of ice along the edges, thicker the colder it is,
// with fine rime that is thick at the edges and clear in the middle. It shows by day as well as at night.

/** level: 0 (at freezing point) to 1 (-30 °C and colder). */
export function FrostEdge({ level }: { level: number }) {
  return (
    <div aria-hidden="true" className="ambience" style={{ opacity: 0.7 + 0.3 * level }}>
      <div className="ambience ambience-frost" style={{ "--frost": level } as React.CSSProperties} />
      <div className="ambience frost-rime" style={{ "--clear": `${60 - 18 * level}%`, opacity: 0.7 } as React.CSSProperties} />
    </div>
  );
}
