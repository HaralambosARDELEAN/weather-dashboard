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
  /** "Painted Fri 12:15 AM, your time · took 18 s" */
  caption: string;
  view: View;
  onView: (view: View) => void;
};

export function PictureLightbox({ image, names, prompt, caption, view, onView }: Props) {
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
      className="lightbox"
      aria-label={panel === null ? "The painting, large" : `The ${names[panel]} panel, large`}
      onClose={() => onView(null)}
      onKeyDown={keyDown}
      onClick={(event) => event.target === event.currentTarget && onView(null)}
    >
      {view !== null && (
        <div key={view} className="animate-zoom-in">
          <div className="lightbox-frame">
            <Image
              src={image}
              alt={panel === null ? `The 2×2 painting of ${names.join(", ")}, shown large.` : `The ${names[panel]} panel of the painting`}
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
          <div className="lightbox-bar">
            <div>
              <h2>{panel === null ? "The whole painting" : names[panel]}</h2>
              <p>{line ?? caption}</p>
            </div>
            <div className="big-acts">
              {panel !== null ? (
                <>
                  <button type="button" className="btn-ink" onClick={() => onView((panel + 3) % 4)}>
                    ← Previous
                  </button>
                  <button type="button" className="btn-ink" onClick={() => onView((panel + 1) % 4)}>
                    Next →
                  </button>
                  <button type="button" className="btn-ink" onClick={() => onView(WHOLE)}>
                    Whole painting
                  </button>
                </>
              ) : (
                <button type="button" className="btn-ink" onClick={() => onView(0)}>
                  Panel by panel
                </button>
              )}
              <button type="button" className="btn-ink solid" onClick={() => onView(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
