"use client";

import { useState } from "react";
import { callApi } from "@/lib/api-client";
import type { Place, Weather } from "@/lib/schemas";
import { skyForWeather } from "@/lib/sky";
import { SLOT_COUNT, type Slots } from "@/lib/storage";
import { PictureLightbox, WHOLE, type View } from "./picture-lightbox";
import { PicturePreview } from "./picture-preview";
import { PictureView } from "./picture-view";
import { PromptText } from "./prompt-text";
import { useNow } from "./use-now";

type Props = {
  slots: Slots;
  weather: Readonly<Record<number, Weather>>;
};

type Picture = { image: string; prompt: string; placeIds: string; names: string[]; createdAt: number };

type Run =
  | { status: "idle" }
  | { status: "loading"; startedAt: number }
  | { status: "error"; message: string; prompt?: string };

const LINK =
  "rounded-full border border-ink/20 px-4 py-1.5 text-sm font-bold transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function Elapsed({ startedAt }: { startedAt: number }) {
  const now = useNow(1_000);
  return <span className="tabular-nums">{Math.max(0, Math.round((now.getTime() - startedAt) / 1000))} s</span>;
}

export function ImagePanel({ slots, weather }: Props) {
  const [run, setRun] = useState<Run>({ status: "idle" });
  const [picture, setPicture] = useState<Picture | null>(null);
  const [view, setView] = useState<View>(null);
  const now = useNow(60_000);

  const places = slots.filter((place): place is Place => place !== null);
  const missing = SLOT_COUNT - places.length;
  const placeIds = slots.map((place) => place?.id ?? "-").join(",");
  const outdated = picture !== null && picture.placeIds !== placeIds;
  const loading = run.status === "loading";
  const skies = slots.map((place) =>
    place && weather[place.id] ? skyForWeather(weather[place.id], place.timezone, now) : null,
  );

  async function generate() {
    setRun({ status: "loading", startedAt: Date.now() });
    const result = await callApi<{ image: string; prompt: string }>("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeIds: places.map((place) => place.id) }),
    });
    if (!result.ok) {
      const place = result.slot === undefined ? null : slots[result.slot];
      const message = place ? `Could not get the weather for ${place.name}. ${result.error}` : result.error;
      setRun({ status: "error", message, prompt: result.prompt });
      return;
    }
    setPicture({ ...result.data, placeIds, names: places.map((place) => place.name), createdAt: Date.now() });
    setRun({ status: "idle" });
  }

  let label = "Generate picture";
  if (missing > 0) label = `Add ${missing} more ${missing === 1 ? "place" : "places"} to generate`;
  else if (loading) label = "Painting…";
  else if (picture && !outdated) label = "Generate again";

  // While a new picture is painted, the preview pulses in place of the old one.
  const showPicture = picture !== null && !loading;

  return (
    <section
      aria-labelledby="picture-heading"
      className="mx-auto flex w-full max-w-2xl flex-col gap-4 xl:sticky xl:top-6 xl:max-w-none xl:self-start"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="picture-heading" className="font-display text-4xl font-extrabold uppercase leading-none">
          The picture
        </h2>
        <button
          type="button"
          onClick={generate}
          disabled={missing > 0 || loading}
          className="rounded-full bg-windsock px-6 py-3 font-bold text-white shadow-sm transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {label}
        </button>
      </div>

      <div aria-live="polite" className="text-sm empty:hidden">
        {loading && (
          <p>
            Painting the four places… <Elapsed startedAt={run.startedAt} />. This can take up to a minute.
          </p>
        )}
        {run.status === "error" && (
          <p role="alert" className="font-bold text-alert">
            {run.message}
          </p>
        )}
        {outdated && !loading && <p>This picture shows the previous places. Generate again to update it.</p>}
      </div>

      {showPicture ? (
        <figure className="flex flex-col gap-4">
          <PictureView
            key={picture.createdAt}
            image={picture.image}
            names={picture.names}
            skies={skies}
            outdated={outdated}
            onOpen={setView}
          />
          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-auto text-sm text-slate">Click a panel to open it large.</p>
            <button type="button" className={LINK} onClick={() => setView(WHOLE)}>
              Open whole picture
            </button>
            <a className={LINK} href={picture.image} download="weather-in-four-places.webp">
              Download
            </a>
          </div>
          <figcaption>
            <PromptText prompt={picture.prompt} />
          </figcaption>
          <PictureLightbox image={picture.image} names={picture.names} prompt={picture.prompt} view={view} onView={setView} />
        </figure>
      ) : (
        <>
          <PicturePreview slots={slots} weather={weather} painting={loading} />
          <p className="text-sm text-slate">
            {missing > 0
              ? "This is how the places will sit in the picture. Add all four to paint it."
              : "This is how the places will sit in the picture. Generate it to paint each panel."}
          </p>
        </>
      )}

      {run.status === "error" && run.prompt && (
        <details className="text-sm">
          <summary className="cursor-pointer">Prompt that was sent</summary>
          <div className="mt-2">
            <PromptText prompt={run.prompt} />
          </div>
        </details>
      )}
    </section>
  );
}
