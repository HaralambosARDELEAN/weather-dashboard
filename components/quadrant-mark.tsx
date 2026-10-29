const LABELS = ["Top left", "Top right", "Bottom left", "Bottom right"];

/** A small 2x2 mark showing which panel of the picture this place becomes. */
export function QuadrantMark({ index }: { index: number }) {
  const label = `${LABELS[index]} panel of the picture`;
  return (
    <span role="img" aria-label={label} title={label} className="inline-grid shrink-0 grid-cols-2 gap-0.5">
      {LABELS.map((position, i) => (
        <span key={position} className={`size-2 bg-current ${i === index ? "" : "opacity-25"}`} />
      ))}
    </span>
  );
}
