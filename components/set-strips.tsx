import { useId } from "react";
import { miniLabel } from "@/lib/postal";
import { PLACE_SETS, type PlaceSet } from "@/lib/presets";

// Each set's strip of stamps has its own colour.
const SET_CLASS: Record<string, string> = { clock: "c1", paris: "c2", climates: "c3" };

/** The ready-made sets of four: a strip of perforated stamps each, one per place. Picking one replaces all four places. */
export function SetStrips({ onPick }: { onPick: (set: PlaceSet) => void }) {
  const titleId = useId();
  return (
    <div className="sets" role="group" aria-labelledby={titleId}>
      <h2 id={titleId} className="sets-title">
        Ready-made sets of four
      </h2>
      {PLACE_SETS.map((set) => (
        <button
          key={set.id}
          type="button"
          className={`set ${SET_CLASS[set.id] ?? "c1"}`}
          onClick={() => onPick(set)}
          aria-label={`Load the set ${set.title}: ${set.description}`}
        >
          <span className="set-name" aria-hidden="true">
            {set.title}
            <i>Load set</i>
          </span>
          <span className="strip" aria-hidden="true">
            {set.places.map((place) => (
              <span key={place.id} className="mini">
                <span>
                  <b>{place.name}</b>
                  <small>{miniLabel(place, set.places)}</small>
                </span>
              </span>
            ))}
          </span>
        </button>
      ))}
    </div>
  );
}
