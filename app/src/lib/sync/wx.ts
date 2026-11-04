// Tokyo's real sky by the hour as this phone holds it (docs/design.md "Weather", docs/backend.md "The real weather"):
// the relay's `wx` (sync/live.ts) kept in localStorage (`island.wx`), so a phone opening offline still has the hours
// it was sent (up to 36 h ahead). The island reads it through components/island/weatherNow.svelte.ts. Plain TS.
import { LIVE, localKV, readJson, writeJson } from './storage.ts';
import { wxOf, type Wx } from './live-protocol.ts';

let held: Wx | null | undefined;
const subs = new Set<(w: Wx | null) => void>();

/** The timeline this phone holds (the cache's, read once), or null. */
export function heldWx(): Wx | null {
  if (held === undefined) held = wxOf(readJson<unknown>(localKV(), LIVE.wx));
  return held;
}

/** A timeline from the relay: kept (and cached) unless it is older than the one held. */
export function takeWx(w: Wx): void {
  const had = heldWx();
  if (had && (w.at < had.at || (w.at === had.at && w.rev === had.rev && w.h0 === had.h0 && w.s === had.s))) return;
  held = w;
  writeJson(localKV(), LIVE.wx, w);
  for (const f of subs) f(w);
}

/** Hear each new timeline; returns the unsubscribe. */
export function onWx(fn: (w: Wx | null) => void): () => void {
  subs.add(fn);
  return () => void subs.delete(fn);
}

/** Forget the held one (tests). @public (tests) */
export function resetWx(): void {
  held = undefined;
}
