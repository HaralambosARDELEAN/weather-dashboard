import { Brand } from "./logo-mark";

export function AppHeader() {
  return (
    <header className="wrap top">
      <div className="brand">
        <Brand />
        <p className="tagline">Postcards of the sky in four places, right now</p>
      </div>
    </header>
  );
}

/** The search field as it looks before the page is interactive, so nothing moves when it arrives. */
export function SearchShell() {
  return (
    <div className="search" aria-hidden="true">
      <div className="field">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="8.5" cy="8.5" r="6" />
          <path d="m13 13 5 5" strokeLinecap="round" />
        </svg>
        <span className="text-ink-3">Search for a city or town</span>
      </div>
      <p className="hint">&nbsp;</p>
    </div>
  );
}
