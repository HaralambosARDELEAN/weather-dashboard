import type { CSSProperties, RefObject } from "react";
import type { Slots } from "@/lib/storage";
import { SLOT_COLORS } from "./slots";

type Props = {
  slots: Slots;
  /** The postcard in view. */
  shown: number;
  cards: RefObject<HTMLDivElement | null>;
};

/** On a phone, where the postcards are swiped: which one is in view, and a tap to go to another. Hidden on wider screens. */
export function CardDots({ slots, shown, cards }: Props) {
  return (
    <div className="card-dots" role="group" aria-label="Postcards">
      {slots.map((place, i) => (
        <button
          key={i}
          type="button"
          style={{ "--c": SLOT_COLORS[i] } as CSSProperties}
          aria-label={place ? `Show the ${place.name} postcard` : `Show empty postcard ${i + 1}`}
          aria-current={i === shown || undefined}
          onClick={() => cards.current?.children[i]?.scrollIntoView({ block: "nearest", inline: "center" })}
        />
      ))}
    </div>
  );
}
