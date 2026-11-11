// The sheets kept mounted after a close (Sheet's `keep`): the next opening shows the content at
// once instead of building it again. A few at most, the least recently opened let go first; every closed one let go
// when the page is hidden (an iOS app switch fires only visibilitychange; pagehide on a navigation or the bfcache) and
// on a lost WebGL context (iOS short of memory takes those first).
// An open sheet is never let go.

/** At most this many kept (the open ones among them). */
export const KEEP_MAX = 3;

interface Kept { id: number; release: () => void; isOpen: () => boolean }
let kept: Kept[] = [];
let listening = false;

function trim(max: number): void {
  while (kept.length > max) {
    const i = kept.findIndex((k) => !k.isOpen());
    if (i < 0) return;
    kept.splice(i, 1)[0].release();
  }
}

/** Every closed sheet let go (their content unmounted). */
export function releaseSheets(): void {
  const gone = kept.filter((k) => !k.isOpen());
  kept = kept.filter((k) => k.isOpen());
  for (const k of gone) k.release();
}

/** A sheet opening with `keep`: kept from now (the most recent), the least recent closed one let go past KEEP_MAX. */
export function keepSheet(id: number, release: () => void, isOpen: () => boolean): void {
  kept = kept.filter((k) => k.id !== id);
  kept.push({ id, release, isOpen });
  trim(KEEP_MAX);
  if (listening || typeof addEventListener !== 'function') return;
  listening = true;
  addEventListener('pagehide', releaseSheets);
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && releaseSheets());
  // (the canvas's event doesn't bubble: seen on the way down)
  addEventListener('webglcontextlost', releaseSheets, { capture: true });
}

/** The sheet itself unmounted. */
export function unkeepSheet(id: number): void {
  kept = kept.filter((k) => k.id !== id);
}
