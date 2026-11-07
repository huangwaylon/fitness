// The island's sheets' chunks (docs/perf-plan.md A3): each loaded once (ui-state/reload.ts lazy), by its first opening
// or ahead of it: one a quiet moment once the island is in and the service worker controls the page (its caches
// serve them: never a second download, never a failed fetch Safari would keep for the page's life), and the one a
// HUD button is touched down for. ごはん's chunk only, never its food data (that loads on use). ききみみ's warm() also
// brings in its hub and the remembered level's items.
import { lazy } from '#lib/ui-state/reload.ts';
import { workerControls } from '#lib/ui-state/swLate.ts';
import { trips } from '../travel/open.svelte.ts';
import { weddingSheet } from '../wedding/open.svelte.ts';
import { hiking } from '../hiking/open.svelte.ts';

export const loadPanel = lazy(() => import('../panel/IslandPanel.svelte'));
export const loadHealth = lazy(() => import('../health/HealthSheet.svelte'));
export const loadFood = lazy(() => import('../food/FoodSheet.svelte'));
export const loadZukan = lazy(() => import('../kiroku/ZukanSheet.svelte'));
export const loadSettings = lazy(() => import('../panel/SettingsSheet.svelte'));
export const loadKikimimi = lazy(() => import('../kikimimi/KikimimiSheet.svelte'));

const CHUNKS = {
  health: () => loadHealth(true),
  food: () => loadFood(true),
  kikimimi: () => loadKikimimi(true).then((m) => m.warm()),
  travel: () => trips.prefetch(),
  hiking: () => hiking.prefetch(),
  wedding: () => weddingSheet.prefetch(),
  panel: () => loadPanel(true),
  settings: () => loadSettings(true),
  zukan: () => loadZukan(true)
} satisfies Record<string, () => Promise<unknown>>;
export type SheetChunk = keyof typeof CHUNKS;

/** That sheet's chunk on its way (a HUD button touched down): online only, a failure the tap's to report. */
export function prefetchSheet(k: SheetChunk): Promise<unknown> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return Promise.resolve();
  return CHUNKS[k]().catch(() => {});
}

const idle = (f: () => void) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(f, { timeout: 1500 }) : setTimeout(f, 200));
let started = false;

/** Every sheet's chunk, one a quiet moment, once the worker controls the page (Hud: on the island only). */
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
  void workerControls().then((on) => on && idle(() => step(0)));
}
