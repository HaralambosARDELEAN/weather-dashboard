import { longDate } from "@/lib/postal";
import { SLOT_KEYS } from "./slots";

type Props = {
  /** Places on the desk, loaded or not. */
  placeCount: number;
  /** Places whose weather has arrived. */
  loadedCount: number;
  now: Date;
};

/** The page's headline, told like the post: where the postcards should come from, on their way, arrived. */
export function Summary({ placeCount, loadedCount, now }: Props) {
  const one = placeCount === 1;
  const headline =
    placeCount === 0
      ? "Where should your postcards come from?"
      : loadedCount === 0
        ? one
          ? "Your postcard is on its way…"
          : "Your postcards are on their way…"
        : one
          ? "Your postcard has arrived."
          : "Your postcards have arrived.";
  const sub =
    placeCount === 0
      ? "Search for any city or town, or start with a ready-made set."
      : placeCount < SLOT_KEYS.length
        ? "Live weather and local time on every postcard. Add more places to paint them all as one picture."
        : "Live weather and local time on every postcard. Pick one up to read it, or paint them all as one picture.";

  return (
    <div className="summary">
      <p className="kicker">{longDate(now)}, right now</p>
      <h1 className="headline">{headline}</h1>
      <p className="sub">{sub}</p>
    </div>
  );
}
