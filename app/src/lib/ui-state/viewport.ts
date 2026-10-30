// iOS standalone (Home Screen) viewport. On a cold launch iPhone under-reports the height by the status-bar inset
// (`100dvh`, `innerHeight` and `visualViewport` alike) until a rotation, and WebKit paints nothing below the
// document's box, so the bottom showed the manifest's beige `background_color`. In a full-screen standalone window we
// publish the *screen* height as `--doc-height` (tokens.css feeds it into --vh-fill / --vh-page). It depends only on
// the screen size and the window width, so it can't feed back into layout. Same approach as the user's epub reader
// (Tsuzuri, src/services/viewport.ts); assumes app.html's `viewport-fit=cover` + `black-translucent`.

function isStandalone(): boolean {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true || matchMedia('(display-mode: standalone)').matches;
}

/**
 * The screen height when standalone and the window spans a full screen side (not Split View / Stage Manager).
 * `screen` doesn't swap on iOS rotation, so the orientation comes from the width. Null otherwise.
 */
export function fullScreenHeight(width: number, standalone: boolean, screenW: number, screenH: number): number | null {
  if (!standalone) return null;
  const short = Math.min(screenW, screenH);
  const long = Math.max(screenW, screenH);
  if (Math.abs(width - short) <= 2) return long; // portrait
  if (Math.abs(width - long) <= 2) return short; // landscape
  return null;
}

let last: number | null = -1;
let raf = 0;

function apply(): void {
  raf = 0;
  const h = fullScreenHeight(window.innerWidth, isStandalone(), screen.width, screen.height);
  if (h === last) return;
  last = h;
  const root = document.documentElement.style;
  if (h === null) root.removeProperty('--doc-height');
  else root.setProperty('--doc-height', `${h}px`);
}

const schedule = () => { if (!raf) raf = requestAnimationFrame(apply); };

/** A screen-tall document in a short layout viewport can still be scrolled by focus or anchors: keep it pinned. */
const pinScroll = () => { if (document.documentElement.style.getPropertyValue('--doc-height') && (scrollX || scrollY) && document.querySelector('.island')) scrollTo(0, 0); };

/** Call once at startup; returns the cleanup. */
export function startViewport(): () => void {
  apply();
  addEventListener('resize', schedule);
  addEventListener('orientationchange', schedule);
  addEventListener('scroll', pinScroll, { passive: true });
  // The cold-launch viewport can settle a few hundred ms after first paint.
  const t = setTimeout(schedule, 300);
  return () => {
    clearTimeout(t);
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    removeEventListener('resize', schedule);
    removeEventListener('orientationchange', schedule);
    removeEventListener('scroll', pinScroll);
  };
}
