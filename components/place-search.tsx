"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { callApi } from "@/lib/api-client";
import { placeDetails } from "@/lib/format";
import { clockTime } from "@/lib/postal";
import type { Place } from "@/lib/schemas";

type Props = {
  /** Returns an error message when the place cannot be used. */
  onPick: (place: Place) => string | null;
  onCancel?: () => void;
  /** Changes when the box should take the keyboard focus (Replace or an empty card's button was clicked). */
  focusKey?: number;
  label: string;
  placeholder: string;
  /** What picking a result does: "Add", "Replace…". */
  action: string;
  /** Places already on the desk, shown but not selectable. */
  taken: readonly number[];
  hint: ReactNode;
  replacing: boolean;
  now: Date;
};

type Search =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; query: string; results: Place[] }
  | { status: "error"; message: string };

const SearchIcon = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="8.5" cy="8.5" r="6" />
    <path d="m13 13 5 5" strokeLinecap="round" />
  </svg>
);

/** The search in the header: an accessible combobox over Open-Meteo's place search. */
export function PlaceSearch({ onPick, onCancel, focusKey, label, placeholder, action, taken, hint, replacing, now }: Props) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<Search>({ status: "idle" });
  const [active, setActive] = useState(0);
  const [pickError, setPickError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [retry, setRetry] = useState(0);
  const id = useId();
  const input = useRef<HTMLInputElement>(null);

  // Moves the focus here when a card asks for a place.
  useEffect(() => {
    if (focusKey) input.current?.focus();
  }, [focusKey]);

  // Search 250 ms after the last keystroke; an older search still running is cancelled.
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
        result.ok
          ? { status: "done", query: q, results: result.data.results }
          : { status: "error", message: "Search isn't responding. Try again in a moment." },
      );
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, retry]);

  const results = search.status === "done" ? search.results : [];
  const isTaken = (place: Place) => taken.includes(place.id);

  function change(value: string) {
    setQuery(value);
    setPickError(null);
    setOpen(true);
    setSearch(value.trim().length < 2 ? { status: "idle" } : { status: "loading" });
  }

  function pick(place: Place) {
    if (isTaken(place)) return;
    const error = onPick(place);
    setPickError(error);
    if (!error) {
      change("");
      setOpen(false);
    }
  }

  function keyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      // First Esc closes the list, the next one clears the box, then it cancels a replace.
      if (open && search.status !== "idle") setOpen(false);
      else if (query) change("");
      else onCancel?.();
      return;
    }
    if (event.key === "Enter" && search.status === "error") {
      event.preventDefault();
      setRetry((n) => n + 1);
      return;
    }
    if (!open || results.length === 0) {
      if (event.key === "ArrowDown" && results.length > 0) setOpen(true);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = (active + step + results.length) % results.length;
      setActive(next);
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
    message = `No city or town called “${search.query}”. Check the spelling, or try a nearby larger town.`;
  }
  const showList = open && (results.length > 0 || message !== null);
  // Read out by screen readers: how many results, or what went wrong.
  const status = message ?? (search.status === "done" ? `${results.length} ${results.length === 1 ? "place" : "places"} found.` : "");

  return (
    <div className={`search ${replacing ? "is-replacing" : ""}`} role="search">
      <label htmlFor={`${id}-input`} className="sr-only">
        {label}
      </label>
      <div className="field">
        {SearchIcon}
        <input
          ref={input}
          id={`${id}-input`}
          type="search"
          role="combobox"
          aria-expanded={showList && results.length > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={showList && results.length > 0 ? `${id}-option-${active}` : undefined}
          aria-describedby={`${id}-hint`}
          autoComplete="off"
          enterKeyHint="search"
          value={query}
          placeholder={placeholder}
          onChange={(event) => change(event.target.value)}
          onKeyDown={keyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        />
      </div>
      <p className="hint" id={`${id}-hint`}>
        {hint}
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </p>
      {showList && (
        // Clicks inside the list must not blur the box first, or the list would close before the click lands.
        <div className="results" onMouseDown={(event) => event.preventDefault()}>
          <ul id={`${id}-list`} role="listbox" aria-label="Matching places">
            {results.map((place, i) => {
              const onDesk = isTaken(place);
              return (
                <li
                  key={place.id}
                  id={`${id}-option-${i}`}
                  role="option"
                  aria-selected={i === active}
                  aria-disabled={onDesk || undefined}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(place)}
                >
                  <span>
                    <b>{place.name}</b>
                    {placeDetails(place) && <span className="where">, {placeDetails(place)}</span>}
                  </span>
                  <small>
                    <span>{clockTime(place.timezone, now)} there</span>
                    {onDesk ? "Already on the desk" : action}
                  </small>
                </li>
              );
            })}
          </ul>
          {message && (results.length === 0 || pickError) && (
            <p className="results-msg">
              {message}
              {search.status === "error" && (
                <button type="button" className="btn-ink" onClick={() => setRetry((n) => n + 1)}>
                  Try again
                </button>
              )}
            </p>
          )}
        </div>
      )}
      <p aria-live="polite" className="sr-only">
        {status}
      </p>
    </div>
  );
}
