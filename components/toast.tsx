"use client";

import { useEffect, useEffectEvent, useRef } from "react";

type Props = {
  text: string;
  action?: { label: string; onClick: () => void };
  /** Move the focus to the action, so Undo is one key away. */
  focus?: boolean;
  onClose: () => void;
  durationMs?: number;
};

/** A short note at the bottom of the screen, with an optional action. Closes by itself. */
export function Toast({ text, action, focus = false, onClose, durationMs = 8_000 }: Props) {
  const button = useRef<HTMLButtonElement>(null);
  const close = useEffectEvent(onClose);

  useEffect(() => {
    const timer = setTimeout(() => close(), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);

  useEffect(() => {
    if (focus) button.current?.focus();
  }, [focus]);

  return (
    <div className="toast">
      <p>{text}</p>
      {action && (
        <button ref={button} type="button" className="btn-yellow" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
