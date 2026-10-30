"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { callApi } from "@/lib/api-client";
import { placeLabel } from "@/lib/format";
import type { Picture } from "@/lib/picture";
import { clockTime, shortDate } from "@/lib/postal";
import type { PlaceSet } from "@/lib/presets";
import { PANEL_POSITIONS } from "@/lib/prompt";
import type { Place, Weather } from "@/lib/schemas";
import { SLOT_COUNT, getServerSnapshot, getSnapshot, subscribe, updateSlots, type Slots } from "@/lib/storage";
import { AppHeader, SearchShell } from "./app-header";
import { BigCard } from "./big-card";
import { CardDots } from "./card-dots";
import { PaintButton } from "./paint-button";
import { PictureLightbox, WHOLE, type View } from "./picture-lightbox";
import { PostcardDialog } from "./postcard-dialog";
import { PlaceSearch } from "./place-search";
import { BlankCard, Postcard } from "./postcard";
import { SetStrips } from "./set-strips";
import { Summary } from "./summary";
import { Toast } from "./toast";
import { useNow } from "./use-now";
import { WeatherFeed, type PlaceLoad, type WeatherLoad } from "./weather-feed";

type Run = { status: "idle" } | { status: "painting"; startedAt: number } | { status: "error"; message: string };

/** A note at the bottom of the screen; `undo` holds the places to put back. */
type Note = { id: number; text: string; undo: Slots | null; focusSlot: number | null; focus: boolean };

// The weather is fetched again after 15 minutes, while the tab is visible.
const REFRESH_MS = 15 * 60_000;

/** The time of a click or an answer. Only called from event handlers and effects, never while rendering. */
function timestamp(): number {
  return Date.now();
}

export function Dashboard() {
  const slots = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // On the server and during the first render in the browser the saved places are not known yet.
  // The live desk starts only then, so the clock is never read while the page is prerendered.
  return slots ? <Desk current={slots} /> : <Placeholder />;
}

function Desk({ current }: { current: Slots }) {
  const [replacing, setReplacing] = useState<number | null>(null);
  // The empty card whose "Search for a place" was clicked last.
  const [chosen, setChosen] = useState<number | null>(null);
  // A place picked while the desk was full, waiting for the card it replaces.
  const [pending, setPending] = useState<Place | null>(null);
  const [focusKey, setFocusKey] = useState(0);
  const [focusCard, setFocusCard] = useState<{ index: number; key: number } | null>(null);
  // On a phone the postcards are swiped; which one is in view.
  const cardsRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0);
  const [loads, setLoads] = useState<Readonly<Record<number, PlaceLoad>>>({});
  const [attempts, setAttempts] = useState<Readonly<Record<number, number>>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [run, setRun] = useState<Run>({ status: "idle" });
  const [picture, setPicture] = useState<Picture | null>(null);
  const [view, setView] = useState<View>(null);
  const [note, setNote] = useState<Note | null>(null);
  // The postcard picked up off the desk, by slot.
  const [held, setHeld] = useState<number | null>(null);
  // Whether the big card's paint button is on screen; the phone's sticky bar shows when it is not.
  const [paintInView, setPaintInView] = useState(true);
  const paintButton = useRef<HTMLButtonElement>(null);
  const [message, setMessage] = useState("");
  const controller = useRef<AbortController | null>(null);
  const now = useNow(15_000);

  const onLoad = useCallback((placeId: number, load: WeatherLoad) => {
    const at = timestamp();
    setLoads((all) => {
      const last = all[placeId];
      // A failed refresh keeps the last weather that arrived, marked with the failure.
      if (load.status === "error" && last?.status === "done") return { ...all, [placeId]: { ...last, failed: load.message } };
      return { ...all, [placeId]: load.status === "done" ? { status: "done", weather: load.weather, at, failed: null } : load };
    });
    if (load.status === "done") setUpdatedAt(at);
  }, []);

  const places = current.filter((place): place is Place => place !== null);
  const missing = SLOT_COUNT - places.length;
  const placeIds = current.map((place) => place?.id ?? "-").join(",");
  const paintedIds = picture?.placeIds.split(",") ?? [];
  const outdated = picture !== null && picture.placeIds !== placeIds;
  const firstEmpty = current.indexOf(null);
  const target = replacing ?? (chosen !== null && current[chosen] === null ? chosen : firstEmpty === -1 ? null : firstEmpty);
  const painting = run.status === "painting";

  function weatherFor(placeId: number): Weather | null {
    const load = loads[placeId];
    return load?.status === "done" ? load.weather : null;
  }

  const loadedCount = places.filter((place) => weatherFor(place.id)).length;

  function focusOn(index: number) {
    setFocusCard((last) => ({ index, key: (last?.key ?? 0) + 1 }));
  }

  function notify(next: Omit<Note, "id">) {
    setNote({ ...next, id: timestamp() });
  }

  function refresh() {
    if (places.length === 0) return;
    setRefreshKey((key) => key + 1);
  }

  // Every minute, and when the tab comes back into view: refresh if the weather is older than 15 minutes.
  const autoRefresh = useEffectEvent(() => {
    if (document.hidden || updatedAt === null) return;
    if (timestamp() - updatedAt >= REFRESH_MS) refresh();
  });
  useEffect(() => {
    const check = () => autoRefresh();
    const timer = setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  useEffect(() => {
    const element = paintButton.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setPaintInView(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Esc leaves "choose the card it replaces".
  useEffect(() => {
    if (!pending) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPending(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pending]);

  function pick(place: Place): string | null {
    if (target === null) {
      setPending(place);
      setMessage(`Choose the card ${place.name} replaces.`);
      return null;
    }
    if (current.some((other) => other?.id === place.id)) return `${place.name} is already on the desk.`;
    const before = current[target];
    const next = current.map((other, i) => (i === target ? place : other));
    updateSlots(next);
    setReplacing(null);
    setChosen(null);
    if (before) {
      setMessage(`${placeLabel(place)} replaced ${before.name}.`);
      focusOn(target);
    } else {
      const left = next.filter((other) => other === null).length;
      setMessage(`Added ${placeLabel(place)}. ${left > 0 ? `Add ${left} more ${left === 1 ? "place" : "places"} to paint.` : "All four places are on the desk."}`);
    }
    return null;
  }

  function put(index: number) {
    if (!pending) return;
    const before = current[index];
    updateSlots(current.map((other, i) => (i === index ? pending : other)));
    setPending(null);
    setMessage(`${placeLabel(pending)} replaced ${before?.name ?? "an empty card"}.`);
    focusOn(index);
  }

  function pickSet(set: PlaceSet) {
    const before = current;
    updateSlots([...set.places]);
    setReplacing(null);
    setChosen(null);
    setPending(null);
    setMessage(`Loaded ${set.title}: ${set.description}.`);
    if (before.some(Boolean)) notify({ text: `Loaded ${set.title}.`, undo: before, focusSlot: null, focus: false });
  }

  function remove(index: number) {
    const place = current[index];
    if (!place) return;
    const before = current;
    updateSlots(current.map((other, i) => (i === index ? null : other)));
    if (replacing === index) setReplacing(null);
    setMessage(`Removed ${place.name}.`);
    notify({ text: `Removed ${place.name}.`, undo: before, focusSlot: index, focus: true });
  }

  function undo(done: Note) {
    if (done.undo) updateSlots(done.undo);
    setNote(null);
    setMessage("Undone.");
    if (done.focusSlot !== null) focusOn(done.focusSlot);
  }

  function retry(placeId: number) {
    // A card with older weather keeps showing it while it tries again.
    setLoads((all) => (all[placeId]?.status === "done" ? all : { ...all, [placeId]: { status: "loading" } }));
    setAttempts((all) => ({ ...all, [placeId]: (all[placeId] ?? 0) + 1 }));
  }

  async function paint() {
    if (missing > 0 || painting) return;
    const abort = new AbortController();
    controller.current = abort;
    const startedAt = timestamp();
    setRun({ status: "painting", startedAt });
    setMessage("Painting the picture.");
    const result = await callApi<{ image: string; prompt: string }>("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeIds: places.map((place) => place.id) }),
      signal: abort.signal,
    });
    if (abort.signal.aborted) return;
    controller.current = null;
    if (!result.ok) {
      const place = result.slot === undefined ? null : current[result.slot];
      setRun({ status: "error", message: place ? `Could not get the weather for ${place.name}. ${result.error}` : result.error });
      return;
    }
    const finishedAt = timestamp();
    setPicture({
      id: String(startedAt),
      image: result.data.image,
      prompt: result.data.prompt,
      names: places.map((place) => place.name),
      placeIds,
      createdAt: finishedAt,
      seconds: Math.round((finishedAt - startedAt) / 1000),
    });
    setRun({ status: "idle" });
    setMessage("The painting is ready.");
    notify({ text: "Painted.", undo: null, focusSlot: null, focus: false });
  }

  /** The phone's sticky bar: bring the big card's picture into view, where the painting appears, then paint. */
  function paintFromBar() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    paintButton.current?.closest(".big")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    paintButton.current?.focus({ preventScroll: true });
    void paint();
  }

  function cancel() {
    controller.current?.abort();
    controller.current = null;
    setRun({ status: "idle" });
    setMessage("Painting cancelled.");
  }

  // What the search box does now: add, replace a chosen card, or pick a card afterwards when the desk is full.
  const replacingPlace = replacing === null ? null : current[replacing];
  const chosenEmpty = chosen !== null && current[chosen] === null ? chosen : null;
  let hint: ReactNode = (
    <>
      Same-name places show region and country: <b>Springfield, Illinois</b> or <b>Missouri</b>.
    </>
  );
  if (replacingPlace) hint = `Replacing ${replacingPlace.name}. Pick a place, or`;
  else if (target === null) hint = "The desk is full. Pick a place, then the card it replaces.";
  else if (chosenEmpty !== null) hint = `The place you pick goes on the ${PANEL_POSITIONS[chosenEmpty].toLowerCase()} card.`;

  const paintedAt = current.map((place, index) =>
    picture && place && paintedIds[index] === String(place.id) ? clockTime(undefined, picture.createdAt) : null,
  );
  const paintingUrl = picture ? `url("${picture.image}")` : null;
  const startedAt = run.status === "painting" ? run.startedAt : null;
  const freshPainting = picture !== null && !outdated;

  return (
    <>
      <AppHeader />
      {places.map((place) => (
        <WeatherFeed key={place.id} place={place} refreshKey={refreshKey} attempt={attempts[place.id] ?? 0} onLoad={onLoad} />
      ))}

      <main className="wrap">
        <section className="hero">
          <div>
            <Summary placeCount={places.length} loadedCount={loadedCount} now={now} />
          </div>
          <SetStrips onPick={pickSet} />
        </section>

        <section aria-labelledby="cards-title">
          <div className="toolbar">
            <div className="toolbar-row">
              <div>
                <h2 id="cards-title" className="toolbar-title">
                  Your postcards
                </h2>
                <PlaceSearch
                  label={replacingPlace ? `Replace ${replacingPlace.name}` : "Search for a city or town"}
                  placeholder={replacingPlace ? `Replace ${replacingPlace.name} with…` : "Search for a city or town"}
                  action={target === null ? "Replace…" : replacingPlace ? "Replace" : "Add"}
                  taken={places.map((place) => place.id)}
                  hint={hint}
                  replacing={replacingPlace !== null}
                  focusKey={focusKey}
                  now={now}
                  onPick={pick}
                  onCancel={replacingPlace ? () => setReplacing(null) : chosenEmpty !== null ? () => setChosen(null) : undefined}
                />
              </div>
            </div>
          </div>

          {pending && (
            <div className="pickbar" role="status">
              <span>Choose the card {pending.name} replaces.</span>
              <button type="button" className="btn-ink" onClick={() => setPending(null)}>
                Cancel
              </button>
            </div>
          )}

          {/* One copy of the painting serves all four cards; each shows its own quadrant. */}
          <div
            ref={cardsRef}
            className="cards"
            style={paintingUrl ? ({ "--painting": paintingUrl } as CSSProperties) : undefined}
            onScroll={(event) => {
              const row = event.currentTarget;
              const range = row.scrollWidth - row.clientWidth;
              setShown(range > 0 ? Math.round((row.scrollLeft / range) * (current.length - 1)) : 0);
            }}
          >
            {current.map((place, index) =>
              place ? (
                <Postcard
                  key={place.id}
                  index={index}
                  place={place}
                  load={loads[place.id]}
                  now={now}
                  paintedAt={paintedAt[index]}
                  painting={painting}
                  target={replacing === index}
                  pending={pending}
                  focusKey={focusCard?.index === index ? focusCard.key : 0}
                  onHover={setHovered}
                  onPickUp={() => setHeld(index)}
                  onReplace={() => {
                    setReplacing(index);
                    setChosen(null);
                    setPending(null);
                    setFocusKey((key) => key + 1);
                  }}
                  onRemove={() => remove(index)}
                  onRetry={() => retry(place.id)}
                  onPut={() => put(index)}
                />
              ) : (
                <BlankCard
                  key={`empty-${index}`}
                  index={index}
                  next={index === target}
                  onSearch={() => {
                    setChosen(index);
                    setReplacing(null);
                    setFocusKey((key) => key + 1);
                  }}
                />
              ),
            )}
          </div>
          <CardDots slots={current} shown={shown} cards={cardsRef} />
        </section>

        <BigCard
          slots={current}
          weatherFor={weatherFor}
          now={now}
          picture={picture}
          outdated={outdated}
          startedAt={startedAt}
          error={run.status === "error" ? run.message : null}
          hovered={hovered}
          paint={
            <PaintButton
              ref={paintButton}
              missing={missing}
              startedAt={startedAt}
              painted={freshPainting}
              onPaint={paint}
              onCancel={cancel}
            />
          }
          onOpen={() => setView(WHOLE)}
        />
      </main>

      {/* Phones only: the paint action stays in reach while the big card is off screen. */}
      {missing === 0 && !painting && !paintInView && (
        <div className="paint-bar">
          <PaintButton compact missing={0} startedAt={null} painted={freshPainting} onPaint={paintFromBar} onCancel={cancel} />
        </div>
      )}

      {note && (
        <Toast
          key={note.id}
          text={note.text}
          action={note.undo ? { label: "Undo", onClick: () => undo(note) } : undefined}
          focus={note.focus}
          durationMs={note.undo ? 8_000 : 4_000}
          onClose={() => setNote(null)}
        />
      )}
      <p className="sr-only" aria-live="polite">
        {message}
      </p>
      <PostcardDialog slots={current} loads={loads} now={now} index={held} paintedAt={paintedAt} painting={paintingUrl} onIndex={setHeld} />
      {picture && (
        <PictureLightbox
          image={picture.image}
          names={picture.names}
          prompt={picture.prompt}
          caption={`Painted ${shortDate(undefined, picture.createdAt).split(" ")[0]} ${clockTime(undefined, picture.createdAt)}, your time · took ${picture.seconds} s`}
          view={view}
          onView={setView}
        />
      )}
    </>
  );
}

/** The page before the saved places are read: the same desk with blank cards, so nothing jumps. */
function Placeholder() {
  return (
    <>
      <AppHeader />
      <main className="wrap" aria-busy="true">
        <section className="hero">
          <div className="summary">
            <p className="kicker">&nbsp;</p>
            <p className="headline">&nbsp;</p>
            <p className="sub">&nbsp;</p>
          </div>
        </section>
        <div className="toolbar">
          <div className="toolbar-row">
            <div>
              <p className="toolbar-title">&nbsp;</p>
              <SearchShell />
            </div>
          </div>
        </div>
        <div className="cards">
          {Array.from({ length: SLOT_COUNT }, (_, i) => (
            <BlankCard key={i} index={i} />
          ))}
        </div>
      </main>
    </>
  );
}
