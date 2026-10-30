import { useId, type CSSProperties } from "react";
import { postmarkName } from "@/lib/postal";

type Props = {
  /** Along the top of the ring: the place name. */
  top: string;
  /** Along the bottom of the ring: "LOCAL TIME", "PAINTED". */
  bottom: string;
  /** "FRI 30 OCT" */
  date: string;
  /** "10:31 AM" */
  time: string;
  style?: CSSProperties;
};

/**
 * A postmark in ink: a ring with the place and date, the time in the middle, and four cancel waves
 * that run across the stamp. The time sits left of the stamp, never over it. Decorative: aria-hidden.
 */
export function Postmark({ top, bottom, date, time, style }: Props) {
  // The arcs are drawn per postmark, so the curved text does not rely on a reference into another SVG.
  const id = useId().replace(/[^\w-]/g, "");
  const name = postmarkName(top);
  return (
    <svg className="pm" viewBox="0 0 146 96" aria-hidden="true" style={style}>
      <defs>
        <path id={`${id}-top`} d="M14 50 A34 34 0 0 1 82 50" />
        <path id={`${id}-bottom`} d="M8 50 A40 40 0 0 0 88 50" />
      </defs>
      <g fill="none" stroke="currentColor" filter="url(#ink)">
        <circle cx="48" cy="50" r="44" strokeWidth="2.2" />
        <circle cx="48" cy="50" r="27" strokeWidth="1.1" />
        <path d="M96 30q8-5 16 0t16 0t16 0M96 42q8-5 16 0t16 0t16 0M96 54q8-5 16 0t16 0t16 0M96 66q8-5 16 0t16 0t16 0" strokeWidth="2" />
      </g>
      {/* SVG font-family attributes cannot read CSS variables, so the face comes from the font-mono class. */}
      <g fill="currentColor" className="font-mono" filter="url(#inkT)">
        <text fontSize={name.size} fontWeight={600} letterSpacing={name.spacing}>
          <textPath href={`#${id}-top`} startOffset="50%" textAnchor="middle">
            {name.text}
          </textPath>
        </text>
        <text fontSize="7.4" fontWeight={600} letterSpacing="1.6">
          <textPath href={`#${id}-bottom`} startOffset="50%" textAnchor="middle">
            {bottom}
          </textPath>
        </text>
      </g>
      {/* The date and time are the point of the postmark, so they stay crisp: no ink texture over them. */}
      <g fill="currentColor" className="font-mono">
        <text x="48" y="44" fontSize="8.4" fontWeight={600} textAnchor="middle" letterSpacing=".4">
          {date}
        </text>
        <text x="48" y="60" fontSize="14.6" fontWeight={800} textAnchor="middle" letterSpacing="-.6">
          {time}
        </text>
      </g>
    </svg>
  );
}
