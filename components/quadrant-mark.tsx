// The filled cell of the 2x2 mark, per panel.
const CELLS = [
  [1.7, 1.7],
  [10.7, 1.7],
  [1.7, 10.7],
  [10.7, 10.7],
] as const;

/** A small 2x2 mark with this place's panel of the painting filled in, in the card's colour. Decorative. */
export function QuadrantMark({ index, color }: { index: number; color?: string }) {
  const [x, y] = CELLS[index];
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" style={{ color }}>
      <use href="#quad" />
      <rect x={x} y={y} width="7.6" height="7.6" fill="currentColor" />
    </svg>
  );
}
