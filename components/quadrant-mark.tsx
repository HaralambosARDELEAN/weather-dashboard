import { PANEL_POSITIONS } from "@/lib/prompt";

/** A small 2x2 mark showing which panel of the picture this place becomes. */
export function QuadrantMark({ index }: { index: number }) {
  const label = `${PANEL_POSITIONS[index]} panel of the picture`;
  return (
    <span role="img" aria-label={label} title={label} className="inline-grid shrink-0 grid-cols-2 gap-0.5">
      {PANEL_POSITIONS.map((position, i) => (
        <span key={position} className={`size-2 bg-current ${i === index ? "" : "opacity-25"}`} />
      ))}
    </span>
  );
}
