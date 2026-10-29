"use client";

import Image from "next/image";
import { useState } from "react";
import { callApi } from "@/lib/api-client";
import { listNames } from "@/lib/format";
import type { Place, Weather } from "@/lib/schemas";
import { SLOT_COUNT, type Slots } from "@/lib/storage";
import { PicturePreview } from "./picture-preview";
import { useNow } from "./use-now";

type Props = {
  slots: Slots;
  weather: Readonly<Record<number, Weather>>;
};

type Picture = { image: string; prompt: string; placeIds: string; names: string[] };

type Run =
  | { status: "idle" }
  | { status: "loading"; startedAt: number }
  | { status: "error"; message: string; prompt?: string };

function Elapsed({ startedAt }: { startedAt: number }) {
  const now = useNow(1_000);
  return <span className="tabular-nums">{Math.max(0, Math.round((now.getTime() - startedAt) / 1000))} s</span>;
}

export function ImagePanel({ slots, weather }: Props) {
  const [run, setRun] = useState<Run>({ status: "idle" });
  const [picture, setPicture] = useState<Picture | null>(null);

  const places = slots.filter((place): place is Place => place !== null);
  const missing = SLOT_COUNT - places.length;
  const placeIds = slots.map((place) => place?.id ?? "-").join(",");
  const outdated = picture !== null && picture.placeIds !== placeIds;
  const loading = run.status === "loading";

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
    setPicture({ ...result.data, placeIds, names: places.map((place) => place.name) });
    setRun({ status: "idle" });
  }

  let label = "Generate picture";
  if (missing > 0) label = `Add ${missing} more ${missing === 1 ? "place" : "places"} to generate`;
  else if (loading) label = "Painting…";
  else if (picture && !outdated) label = "Generate again";

  return (
    <section aria-labelledby="picture-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="picture-heading" className="font-display text-4xl font-extrabold uppercase leading-none">
          The picture
        </h2>
        <button
          type="button"
          onClick={generate}
          disabled={missing > 0 || loading}
          className="rounded-sm bg-windsock px-5 py-3 font-bold text-white transition-opacity hover:bg-windsock/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50"
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

      {picture ? (
        <figure className="flex flex-col gap-4">
          <Image
            src={picture.image}
            alt={`AI-generated picture of the weather in ${listNames(picture.names)}`}
            width={1024}
            height={1024}
            unoptimized
            className={`h-auto w-full rounded-sm border border-mist transition-opacity ${outdated ? "opacity-60" : ""}`}
          />
          <figcaption>
            <h3 className="text-sm font-bold">Prompt sent to the image model</h3>
            <pre className="mt-2 whitespace-pre-wrap rounded-sm border border-mist bg-white p-4 font-mono text-xs leading-relaxed">
              {picture.prompt}
            </pre>
          </figcaption>
        </figure>
      ) : (
        <>
          <PicturePreview slots={slots} weather={weather} />
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
          <pre className="mt-2 whitespace-pre-wrap rounded-sm border border-mist bg-white p-4 font-mono text-xs">
            {run.prompt}
          </pre>
        </details>
      )}
    </section>
  );
}
