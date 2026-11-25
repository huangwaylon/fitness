// The island's sheets' chunks: each loaded once (ui-state/reload.ts lazy), by its first opening
// or ahead of it: one a quiet moment once the island is in and the service worker controls the page (its caches
// serve them, offline too: never a second download, never a failed fetch Safari would keep for the page's life), the
// most opened first, and the one a HUD button is touched down for. けんこう's chunk holds ごはん's code, never its
// food data (that loads on use).
import { isChunkError, lazy } from '#lib/ui-state/reload.ts';
import { chunkUnreachable } from '#lib/ui-state/lazySheet.svelte.ts';
import { chunkSheet } from '#lib/sync/log.ts';
import { chunksServed } from '#lib/ui-state/swLate.ts';
import { trips } from '../travel/open.svelte.ts';
import { weddingSheet } from '../wedding/open.svelte.ts';
import { todoSheet } from '../todo/open.svelte.ts';
import { hiking } from '../hiking/open.svelte.ts';
import { placesSheet } from '../places/open.svelte.ts';
import { kenkou } from '../health/open.svelte.ts';
import { prefetchBots } from '../bots/open.svelte.ts';
import { english } from '#lib/english/open.svelte.ts';

export const loadPanel = lazy(() => import('../panel/IslandPanel.svelte'));
export const loadZukan = lazy(() => import('../kiroku/ZukanSheet.svelte'));
export const loadSettings = lazy(() => import('../panel/SettingsSheet.svelte'));

/** In prefetchSheets' order: the phones' first openings over 30 days (perf.sheet, 2026-11-23), most first. */
const CHUNKS = {
  // (and ごはん's next opening made ready: the day's pictures, food/prime.ts)
  health: () => Promise.all([kenkou.prefetch(), import('../food/prime.ts').then((m) => m.primeFood())]),
  english: () => english.prefetch(),
  hiking: () => hiking.prefetch(),
  // (demo mode has no ボット: never fetched)
  bots: prefetchBots,
  settings: () => loadSettings(true),
  panel: () => loadPanel(true),
  travel: () => trips.prefetch(),
  todo: () => todoSheet.prefetch(),
  wedding: () => weddingSheet.prefetch(),
  // (and the list's copy read in: the first open's rows at once, no fetch till then)
  places: () => Promise.all([placesSheet.prefetch(), import('#lib/places/store.svelte.ts').then((m) => m.places.prime())]),
  zukan: () => loadZukan(true)
} satisfies Record<string, () => Promise<unknown>>;
export type SheetChunk = keyof typeof CHUNKS;

/** That sheet's chunk on its way (a HUD button touched down), a failure the tap's to report (its chunk.fail named by
 *  the sheet: Safari's names no file). Offline only from the worker's caches, and never 結婚式's: its board's chunk is
 *  kept on first use (service-worker/caches.ts carried), maybe not yet here, and a failed one Safari keeps. */
export function prefetchSheet(k: SheetChunk): Promise<unknown> {
  if (typeof navigator !== 'undefined' && !navigator.onLine && (chunkUnreachable() || k === 'wedding')) return Promise.resolve();
  return CHUNKS[k]().catch((e: unknown) => void (isChunkError(e) && chunkSheet(k)));
}

/** A quiet moment: an idle callback, or (Safari has none) just after a frame. */
const idle = (f: () => void) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(f, { timeout: 1500 }) : requestAnimationFrame(() => setTimeout(f, 0)));
let started = false;

/** Every sheet's chunk, one a quiet moment, once the worker's caches serve them (swLate.ts chunksServed: a warm launch's
 *  at the island's models in; Hud: on the island only). */
export function prefetchSheets(): void {
  if (started) return;
  started = true;
  const order = Object.keys(CHUNKS) as SheetChunk[];
  const step = (i: number) => {
    if (i >= order.length) return;
    // (hidden: the phone put away; on the next show)
    if (document.hidden) return void addEventListener('visibilitychange', () => idle(() => step(i)), { once: true });
    void prefetchSheet(order[i]).then(() => idle(() => step(i + 1)));
  };
  void chunksServed().then((on) => on && idle(() => step(0)));
}
