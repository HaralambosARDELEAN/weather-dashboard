/**
 * Filters and glyphs shared by every SVG on the page, rendered once in the layout.
 * Blurs for the skies, the ink texture of the postmarks, the quadrant mark and the stamp glyphs.
 */
export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="b6" x="-40%" y="-80%" width="180%" height="260%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="b10" x="-40%" y="-80%" width="180%" height="260%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="b3" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="b1" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.1" />
        </filter>
        {/* Postmark rings and waves: rough edges, ink blots and speckle. */}
        <filter id="ink" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves={2} seed={4} result="fine" />
          <feDisplacementMap in="SourceGraphic" in2="fine" scale="1.5" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves={2} seed={11} result="blot" />
          <feColorMatrix in="blot" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 2.15" result="blotA" />
          <feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves={1} seed={2} result="spk" />
          <feColorMatrix in="spk" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.4" result="spkA" />
          <feComposite in="blotA" in2="spkA" operator="arithmetic" k1="1" result="m" />
          <feComposite in="rough" in2="m" operator="in" />
        </filter>
        {/* Postmark lettering: gentler, so the time stays legible. */}
        <filter id="inkT" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves={2} seed={4} result="fine" />
          <feDisplacementMap in="SourceGraphic" in2="fine" scale="1" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves={2} seed={11} result="blot" />
          <feColorMatrix in="blot" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.3 1.55" result="m" />
          <feComposite in="rough" in2="m" operator="in" />
        </filter>
        <symbol id="quad" viewBox="0 0 20 20">
          <rect x="1" y="1" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10 1v18M1 10h18" stroke="currentColor" strokeWidth="1.4" />
        </symbol>
        {/* Stamp glyphs, 40x28, white line art; parts filled with currentColor cover what is behind them in the stamp's colour. */}
        <symbol id="g-cloud" viewBox="0 0 40 28">
          <g fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M10 22h20.5a5.5 5.5 0 0 0 .6-11 8 8 0 0 0-15.3-1.8A6.4 6.4 0 0 0 10 22Z" />
            <path d="M6 25.5h28" strokeWidth="1" opacity=".7" />
          </g>
        </symbol>
        <symbol id="g-dawn" viewBox="0 0 40 28">
          <g fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 23h32" />
            <path d="M8 23a7 7 0 0 1 14 0" />
            <path d="M15 12v-3M8 15.5 6 13.5M22 15.5l2-2M4.5 20H2" strokeWidth="1.2" />
            <path d="M21 21h12a4 4 0 0 0 .3-8 5.6 5.6 0 0 0-10.8-1.2A4.5 4.5 0 0 0 21 21Z" fill="currentColor" strokeLinejoin="round" />
          </g>
        </symbol>
        <symbol id="g-moon" viewBox="0 0 40 28">
          <g fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M14.5 4.5a7 7 0 1 0 8.6 9.4 6 6 0 0 1-8.6-9.4Z" />
            <path d="M14 24h17a5 5 0 0 0 .4-10 7 7 0 0 0-13.4-1.6A5.8 5.8 0 0 0 14 24Z" fill="currentColor" />
          </g>
        </symbol>
        <symbol id="g-drizzle" viewBox="0 0 40 28">
          <g fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
            <path d="M10 17h20.5a5 5 0 0 0 .5-10 7.5 7.5 0 0 0-14.4-1.6A6 6 0 0 0 10 17Z" />
            <path d="M13 21l-1 2.5M19 21l-1 2.5M25 21l-1 2.5M16 25l-.6 1.6M22 25l-.6 1.6" strokeWidth="1.3" />
          </g>
        </symbol>
        <symbol id="g-drizzle-day" viewBox="0 0 40 28">
          <g fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
            <circle cx="29" cy="7" r="3.6" strokeWidth="1.2" />
            <path d="M9 17h19.5a5 5 0 0 0 .5-10 7.5 7.5 0 0 0-14.4-1.6A6 6 0 0 0 9 17Z" fill="currentColor" />
            <path d="M12 21l-1 2.5M18 21l-1 2.5M24 21l-1 2.5" strokeWidth="1.3" />
          </g>
        </symbol>
        <symbol id="g-sun" viewBox="0 0 40 28">
          <g fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="20" cy="14" r="5.5" />
            <path d="M20 3.5v2.5M20 22v2.5M9.5 14H7M33 14h-2.5M12.6 6.6l1.8 1.8M25.6 19.6l1.8 1.8M12.6 21.4l1.8-1.8M25.6 8.4l1.8-1.8" strokeWidth="1.3" />
          </g>
        </symbol>
        <symbol id="g-moon-clear" viewBox="0 0 40 28">
          <g fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M21 4.5a9.5 9.5 0 1 0 9 13.5 7.8 7.8 0 0 1-9-13.5Z" />
          </g>
          <g fill="#fff">
            <circle cx="30" cy="7" r=".9" />
            <circle cx="33.5" cy="13" r=".7" />
            <circle cx="9" cy="8" r=".7" />
          </g>
        </symbol>
        <symbol id="g-partly-day" viewBox="0 0 40 28">
          <g fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
            <circle cx="15" cy="10" r="5" />
            <path d="M15 2v1.8M6.5 10H8.3M9 4l1.3 1.3M21 4l-1.3 1.3" strokeWidth="1.2" />
            <path d="M14 24h17a5 5 0 0 0 .4-10 7 7 0 0 0-13.4-1.6A5.8 5.8 0 0 0 14 24Z" fill="currentColor" />
          </g>
        </symbol>
        <symbol id="g-rain" viewBox="0 0 40 28">
          <g fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
            <path d="M10 15h20.5a5 5 0 0 0 .5-10 7.5 7.5 0 0 0-14.4-1.6A6 6 0 0 0 10 15Z" />
            <path d="M13 18.5l-2 5M19 18.5l-2 5M25 18.5l-2 5M16 23.5l-1 2.5M22 23.5l-1 2.5" strokeWidth="1.3" />
          </g>
        </symbol>
        <symbol id="g-snow" viewBox="0 0 40 28">
          <g fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
            <path d="M10 15h20.5a5 5 0 0 0 .5-10 7.5 7.5 0 0 0-14.4-1.6A6 6 0 0 0 10 15Z" />
            <path d="M13 19v4M11 21h4M20 21v4M18 23h4M27 19v4M25 21h4" strokeWidth="1.2" />
          </g>
        </symbol>
        <symbol id="g-fog" viewBox="0 0 40 28">
          <g fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 11h20.5a5 5 0 0 0-1.5-8 7.5 7.5 0 0 0-13 1.4A5 5 0 0 0 10 11Z" strokeLinejoin="round" />
            <path d="M5 16h30M8 20.5h24M5 25h30" />
          </g>
        </symbol>
        <symbol id="g-storm" viewBox="0 0 40 28">
          <g fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
            <path d="M10 15h20.5a5 5 0 0 0 .5-10 7.5 7.5 0 0 0-14.4-1.6A6 6 0 0 0 10 15Z" />
            <path d="M21 17l-3.5 5h4l-2.5 5" />
            <path d="M12 19l-1 2.5M28 19l-1 2.5" strokeWidth="1.2" />
          </g>
        </symbol>
      </defs>
    </svg>
  );
}
