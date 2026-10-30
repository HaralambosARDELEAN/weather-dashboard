import type { CSSProperties } from "react";
import type { Glyph } from "@/lib/scene";

type Props = {
  /** The slot colour, as a CSS colour. */
  color: string;
  /** "12°" */
  value: string;
  glyph: Glyph;
  country: string;
};

/** A perforated stamp: temperature, weather glyph and country. Decorative: the card's text carries the data. */
export function Stamp({ color, value, glyph, country }: Props) {
  return (
    <span className="stamp" style={{ "--sc": color } as CSSProperties} aria-hidden="true">
      <span>
        <b>{value}</b>
        <svg>
          <use href={`#g-${glyph}`} />
        </svg>
        <i>{country}</i>
      </span>
    </span>
  );
}

/** "12°", "-4°". */
export function degrees(celsius: number): string {
  return `${Math.round(celsius)}°`;
}
