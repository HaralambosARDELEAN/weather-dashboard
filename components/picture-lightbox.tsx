"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { PANEL_POSITIONS } from "@/lib/prompt";

/** 0 to 3 opens one panel, WHOLE opens the whole picture, null closes. */
export const WHOLE = 4;
export type View = number | null;

type Props = {
  image: string;
  names: string[];
  prompt: string;
  view: View;
  onView: (view: View) => void;
};

const BUTTON =
  "rounded-full border border-haze/40 px-4 py-1.5 text-sm font-bold transition-colors hover:bg-haze/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-haze";

export function PictureLightbox({ image, names, prompt, view, onView }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  // A native modal dialog: it traps focus, closes on Escape and gives the focus back afterwards.
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (view !== null && !element.open) element.showModal();
    if (view === null && element.open) element.close();
  }, [view]);

  const panel = view !== null && view < WHOLE ? view : null;
  // The line of the prompt that described this panel.
  const line = panel === null ? null : prompt.split("\n").find((l) => l.startsWith(`${PANEL_POSITIONS[panel]}:`));

  function keyDown(event: React.KeyboardEvent) {
    if (panel === null) return;
    if (event.key === "ArrowRight") onView((panel + 1) % PANEL_POSITIONS.length);
    if (event.key === "ArrowLeft") onView((panel + PANEL_POSITIONS.length - 1) % PANEL_POSITIONS.length);
  }

  return (
    <dialog
      ref={dialog}
      aria-label={panel === null ? "The whole picture" : `The ${names[panel]} panel`}
      onClose={() => onView(null)}
      onKeyDown={keyDown}
      onClick={(event) => event.target === event.currentTarget && onView(null)}
      className="m-auto max-h-none max-w-none bg-transparent p-4 text-haze backdrop:bg-ink/95 backdrop:backdrop-blur-sm"
    >
      {view !== null && (
        <div key={view} className="animate-zoom-in flex w-[min(74vh,92vw)] flex-col gap-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-ink">
            <Image
              src={image}
              alt={panel === null ? "The whole picture" : `The ${names[panel]} panel of the picture`}
              width={1024}
              height={1024}
              unoptimized
              className="absolute max-w-none"
              style={
                panel === null
                  ? { width: "100%", height: "100%", left: 0, top: 0 }
                  : { width: "200%", height: "200%", left: panel % 2 ? "-100%" : 0, top: panel > 1 ? "-100%" : 0 }
              }
            />
          </div>
          <div>
            <p className="font-display text-4xl font-extrabold uppercase leading-none">
              {panel === null ? "The whole picture" : names[panel]}
            </p>
            {line && <p className="mt-2 font-mono text-xs leading-relaxed opacity-80">{line}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {panel !== null && (
              <>
                <button type="button" className={BUTTON} onClick={() => onView((panel + 3) % 4)}>
                  ← Previous
                </button>
                <button type="button" className={BUTTON} onClick={() => onView((panel + 1) % 4)}>
                  Next →
                </button>
                <button type="button" className={BUTTON} onClick={() => onView(WHOLE)}>
                  Whole picture
                </button>
              </>
            )}
            {panel === null && (
              <button type="button" className={BUTTON} onClick={() => onView(0)}>
                Panel by panel
              </button>
            )}
            <button type="button" className={`${BUTTON} ml-auto`} onClick={() => onView(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
