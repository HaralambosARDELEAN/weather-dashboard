"use client";

import { useEffect, useId, useRef, useState } from "react";
import { callApi } from "@/lib/api-client";
import { placeDetails } from "@/lib/format";
import type { Place } from "@/lib/schemas";

type Props = {
  /** Returns an error message when the place cannot be added. */
  onPick: (place: Place) => string | null;
  onCancel?: () => void;
  autoFocus?: boolean;
  /** A short suggestion shown under the empty box, for someone who has not started yet. */
  hint?: string;
};

type Search =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; query: string; results: Place[] }
  | { status: "error"; message: string };

export function PlaceSearch({ onPick, onCancel, autoFocus, hint }: Props) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<Search>({ status: "idle" });
  const [active, setActive] = useState(0);
  const [pickError, setPickError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const id = useId();
  const input = useRef<HTMLInputElement>(null);

  // autoFocus only works when the box first appears; this also moves the focus to a box already on screen.
  useEffect(() => {
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);

  // Search 300 ms after the last keystroke; an older search still running is cancelled.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const result = await callApi<{ results: Place[] }>(`/api/geocode?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setActive(0);
      setSearch(
        result.ok ? { status: "done", query: q, results: result.data.results } : { status: "error", message: result.error },
      );
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const results = search.status === "done" ? search.results : [];
  const open = focused && results.length > 0;

  function change(value: string) {
    setQuery(value);
    setPickError(null);
    setSearch(value.trim().length < 2 ? { status: "idle" } : { status: "loading" });
  }

  function pick(place: Place) {
    setPickError(onPick(place));
  }

  function keyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (onCancel) onCancel();
      else change("");
      return;
    }
    if (!open) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = (active + step + results.length) % results.length;
      setActive(next);
      // Keep the highlighted option in view in a long list (only for the keyboard, not on hover).
      document.getElementById(`${id}-option-${next}`)?.scrollIntoView({ block: "nearest" });
    }
    if (event.key === "Enter") {
      event.preventDefault();
      pick(results[active]);
    }
  }

  let message: string | null = pickError;
  if (!message && search.status === "loading") message = "Searching…";
  if (!message && search.status === "error") message = search.message;
  if (!message && search.status === "done" && results.length === 0) {
    message = `No places match “${search.query}”. Check the spelling or try a nearby town.`;
  }
  if (!message && search.status === "idle" && query === "" && hint) message = hint;
  const isError = pickError !== null || search.status === "error";

  return (
    <div className="relative">
      <label htmlFor={`${id}-input`} className="text-sm font-bold">
        Add a place
      </label>
      <input
        ref={input}
        id={`${id}-input`}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        value={query}
        onChange={(event) => change(event.target.value)}
        onKeyDown={keyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search for a city or town"
        className="mt-1 w-full rounded-xl border border-slate/50 bg-white px-3 py-2.5 text-base outline-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/25"
      />
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label="Matching places"
          className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-xl border-2 border-ink bg-white py-1 shadow-2xl shadow-ink/30"
        >
          {results.map((place, i) => (
            <li
              key={place.id}
              id={`${id}-option-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(place)}
              className={`cursor-pointer border-b border-mist/70 px-3 py-2.5 last:border-b-0 ${
                i === active ? "bg-ink text-haze" : "text-ink"
              }`}
            >
              <span className="font-bold">{place.name}</span>
              <span className={`block text-sm ${i === active ? "text-haze/80" : "text-slate"}`}>{placeDetails(place)}</span>
            </li>
          ))}
        </ul>
      )}
      <p aria-live="polite" className={`mt-2 min-h-5 text-sm ${isError ? "text-alert" : "text-slate"}`}>
        {message}
      </p>
      {onCancel && (
        <button type="button" onClick={onCancel} className="text-sm underline underline-offset-4">
          Cancel
        </button>
      )}
    </div>
  );
}
