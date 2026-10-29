"use client";

import { useState } from "react";
import { PANEL_POSITIONS } from "@/lib/prompt";
import { QuadrantMark } from "./quadrant-mark";

/** The exact prompt, with each panel's line marked by its position in the picture. */
export function PromptText({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the text is still there to select by hand.
    }
  }

  return (
    <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold">Prompt sent to the image model</h3>
        <button
          type="button"
          onClick={copy}
          className="rounded-full border border-ink/20 px-3 py-1 text-xs font-bold transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <span aria-live="polite">{copied ? "Copied" : "Copy prompt"}</span>
        </button>
      </div>
      <div className="space-y-1 font-mono text-xs leading-relaxed">
        {prompt.split("\n").map((line, i) => {
          const panel = PANEL_POSITIONS.findIndex((position) => line.startsWith(`${position}:`));
          if (panel === -1) {
            return (
              <p key={i} className="text-slate">
                {line}
              </p>
            );
          }
          const position = PANEL_POSITIONS[panel];
          return (
            <p key={i} className="flex gap-2 border-t border-mist/70 pt-1.5 text-ink">
              <span className="mt-1 text-ink">
                <QuadrantMark index={panel} />
              </span>
              <span>
                <strong>{position}:</strong>
                {line.slice(position.length + 1)}
              </span>
            </p>
          );
        })}
      </div>
    </div>
  );
}
