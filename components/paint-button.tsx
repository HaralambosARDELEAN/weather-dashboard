"use client";

import { useId, type Ref } from "react";
import { useNow } from "./use-now";

type Props = {
  /** Places still needed before the picture can be painted. */
  missing: number;
  /** When the current painting started; null when nothing is being painted. */
  startedAt: number | null;
  /** A painting of these exact places exists already. */
  painted: boolean;
  onPaint: () => void;
  onCancel: () => void;
  /** The phone's sticky bar: one line, no note under it. */
  compact?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

// The image model gives no real progress, so only the time is shown; past this, Cancel appears.
const SLOW_S = 40;

/** Seconds since the painting started, and whether it is taking longer than usual. Ticks every second. */
export function usePaintProgress(startedAt: number) {
  const now = useNow(1_000);
  const elapsed = Math.max(0, Math.round((now.getTime() - startedAt) / 1000));
  return {
    elapsed,
    slow: elapsed >= SLOW_S,
  };
}

const BrushIcon = (
  <svg viewBox="0 0 26 26" fill="none" aria-hidden="true">
    <path d="M17.5 3.5 22.5 8.5 12 19l-5-5Z" fill="#171B3D" />
    <path d="M7 14l5 5c-1 3.2-4.4 4.5-8.5 4 1.6-1.4 1.2-3.6 1.6-5.3C5.6 15.9 6.3 14.7 7 14Z" fill="#171B3D" />
    <path d="M17.5 3.5 22.5 8.5" stroke="#FFC933" strokeWidth="1.2" />
  </svg>
);

function PaintingLabel({ startedAt }: { startedAt: number }) {
  const progress = usePaintProgress(startedAt);
  return (
    <span className="airmail-label">
      {BrushIcon}
      Painting… {progress.elapsed} s
    </span>
  );
}

function PaintingNote({ startedAt, onCancel }: { startedAt: number; onCancel: () => void }) {
  const progress = usePaintProgress(startedAt);
  if (progress.slow) {
    return (
      <>
        Taking longer than usual.
        <button type="button" className="btn-ink" onClick={onCancel}>
          Cancel
        </button>
      </>
    );
  }
  return null;
}

/**
 * The paint action, as an airmail label. It stays focusable while it cannot paint, and says why.
 * The same action, with the same name, paints again once a painting exists.
 */
export function PaintButton({ missing, startedAt, painted, onPaint, onCancel, compact = false, ref }: Props) {
  const noteId = useId();
  const painting = startedAt !== null;
  const blocked = missing > 0;
  return (
    <div className="airmail-wrap">
      <button
        ref={ref}
        type="button"
        className={`airmail ${painting ? "is-busy" : ""}`}
        aria-disabled={blocked || painting || undefined}
        aria-busy={painting || undefined}
        aria-describedby={compact ? undefined : noteId}
        onClick={() => {
          if (!blocked && !painting) onPaint();
        }}
      >
        <span className="airmail-inner">
          <span className="par-avion">
            <span>Par avion</span>
            <span>By airmail</span>
          </span>
          {painting ? (
            <PaintingLabel startedAt={startedAt} />
          ) : (
            <span className="airmail-label">
              {BrushIcon}
              {painted ? "Paint again" : "Paint the picture"}
            </span>
          )}
        </span>
      </button>
      {!compact && (
        <p className="airmail-note" id={noteId}>
          {painting ? (
            <PaintingNote startedAt={startedAt} onCancel={onCancel} />
          ) : blocked ? (
            `Add ${missing} more ${missing === 1 ? "place" : "places"} to paint.`
          ) : null}
        </p>
      )}
    </div>
  );
}
