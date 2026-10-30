"use client";

import { useState } from "react";
import type { PanelLine } from "@/lib/prompt-lines";
import { QuadrantMark } from "./quadrant-mark";
import { SLOT_COLORS, SLOT_KEYS } from "./slots";

type Props = {
  prompt: string;
  panels: PanelLine[];
  rules: string[];
};

/**
 * The exact prompt, written as the big card's message: one line per panel, marked with its quadrant
 * and colour, then the style and rule lines on request. A line under the pointer or focus lights its quadrant.
 */
export function PromptText({ prompt, panels, rules }: Props) {
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
    <>
      <ul className="lines">
        {panels.map((panel) => (
          <li key={panel.index} data-q={SLOT_KEYS[panel.index]} tabIndex={0}>
            <QuadrantMark index={panel.index} color={SLOT_COLORS[panel.index]} />
            <div>
              <b>
                {panel.position}
                <span className="sr-only">: </span>
              </b>
              {panel.text}
            </div>
          </li>
        ))}
      </ul>
      <div className="rules">
        {rules.length > 0 && (
          <details>
            <summary>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 3l4 4-4 4" />
              </svg>
              Show the {rules.length} style and rule lines
            </summary>
            <ol>
              {rules.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ol>
          </details>
        )}
        <button type="button" className="copy" onClick={copy}>
          <span aria-live="polite">{copied ? "Copied" : "Copy the prompt"}</span>
        </button>
      </div>
    </>
  );
}
