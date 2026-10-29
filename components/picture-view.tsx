"use client";

import Image from "next/image";
import { listNames } from "@/lib/format";
import { skyStyle, type Sky } from "@/lib/sky";

type Props = {
  image: string;
  names: string[];
  /** The preview colours, which fade away panel by panel to reveal the painting. */
  skies: (Sky | null)[];
  outdated: boolean;
  onOpen: (panel: number) => void;
};

/** The generated picture. Each quarter is a button that opens that panel large. */
export function PictureView({ image, names, skies, outdated, onOpen }: Props) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-ink/5 shadow-lg shadow-ink/10 transition-opacity ${outdated ? "opacity-60" : ""}`}
    >
      <Image
        src={image}
        alt={`AI-generated picture of the weather in ${listNames(names)}`}
        width={1024}
        height={1024}
        unoptimized
        className="block h-auto w-full"
      />
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        {names.map((name, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onOpen(i)}
            aria-label={`Open the ${name} panel large`}
            className="group relative cursor-zoom-in focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-white"
          >
            <span
              aria-hidden="true"
              className="animate-veil-out absolute inset-0"
              style={{
                ...(skies[i] ? skyStyle(skies[i]) : { backgroundColor: "#cbd3da" }),
                animationDelay: `${150 + i * 220}ms`,
              }}
            />
            <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              Open {name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
