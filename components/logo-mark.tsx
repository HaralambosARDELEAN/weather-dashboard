/** The Skypost mark: a small cancellation, a ring with a yellow clock hand and three waves. */
export function LogoMark() {
  return (
    <svg className="logo" viewBox="0 0 44 28" aria-hidden="true">
      <g fill="none" stroke="#FBFAF7" strokeLinecap="round">
        <circle cx="13" cy="14" r="11" strokeWidth="2.2" />
        <circle cx="13" cy="14" r="6.5" strokeWidth="1.2" />
        <path d="M27 9q3-2.2 6 0t6 0M27 14q3-2.2 6 0t6 0M27 19q3-2.2 6 0t6 0" strokeWidth="1.8" />
      </g>
      <path d="M13 14V9.6M13 14l3.2 1.8" stroke="#FFC933" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** The mark and the wordmark together. */
export function Brand() {
  return (
    <span className="brand-row">
      <LogoMark />
      <span className="wordmark">Skypost</span>
    </span>
  );
}
