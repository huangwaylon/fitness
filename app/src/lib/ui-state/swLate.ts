// The service worker registered once the island is up (vite.config.ts: Kit's own registration, on the window's load, is
// off). A first visit's install (the ~2.9 MB precache) ran while three.js and the island's models were still loading,
// both on the one network. Now: when the 3D island has its models in (Island3D's loaded()) or can't draw, soon after the
// window's load where no island comes (another route, /pair; the error and not-set-up screens release it too), and at
// most ISLAND_CAP_MS after the start on the island (its load stuck, a sheet's route opened instead). A phone
// the worker controls already is unaffected: the browser checks for a new worker on each navigation itself.
// A page it didn't control (a first launch) tells the worker, once it's in, what it fetched (the resource timings'
// URLs: service-worker/index.ts `warm` keeps the models and art among them from the HTTP cache), then clears them.

import { resolve } from '$app/paths';
import { swallowed } from '#lib/quiet.ts';

/** On the island, registered by this long after the start whatever the island is doing. */
export const ISLAND_CAP_MS = 30_000;
/** A first launch's resource timings cleared once this long after the start (perf.boot reads them within 30 s). */
const TIMINGS_KEEP_MS = 31_000;
/** Off the island: after the window's load, then this. */
export const IDLE_MS = 2000;

let release: () => void = () => {};
const released = new Promise<void>((r) => (release = r));

/** What a first launch fetched outside the page's resource timings (a worker's fetches), warmed with them: the KTX2
 *  transcoder's wasm (world3d/ktx2.ts; else the next launch fetched its ~230 KB again: review 11-13 N2). */
const fetchedElsewhere = new Set<string>();
export const warmToo = (url: string): void => void fetchedElsewhere.add(url);

/** The island has its models in (or failed, or isn't coming): register now. */
export const releaseWorker = (): void => release();

/** Starts the wait (once, at the app's start): `island`, whether this launch opens the island (ui-state/boot.ts). */
export function registerLate(island: boolean, sw: ServiceWorkerContainer | undefined = globalThis.navigator?.serviceWorker): void {
  if (!sw) return;
  // (a first launch's ~370 files: past the timings' default 250, the rest weren't listed)
  const fresh = !sw.controller;
  if (fresh) performance.setResourceTimingBufferSize?.(1000);
  const wait = new Promise<void>((done) => {
    if (island) {
      void released.then(done);
      setTimeout(done, ISLAND_CAP_MS);
      return;
    }
    const later = () => setTimeout(done, IDLE_MS);
    if (document.readyState === 'complete') later();
    else addEventListener('load', later, { once: true });
  });
  void wait.then(() => sw.register(`${resolve('/')}service-worker.js`, { type: 'module' })).then(() => sw.ready).then((reg) => {
    if (fresh) {
      reg?.active?.postMessage({ k: 'warm', urls: [...performance.getEntriesByType('resource').map((e) => e.name), ...fetchedElsewhere] });
      // (used: the ~0.3 MB of entries not kept for the page's life, the buffer back to its default; after perf.boot's
      // look at them, by world3d/boot.ts's 30 s watch)
      setTimeout(() => {
        performance.clearResourceTimings?.();
        performance.setResourceTimingBufferSize?.(250);
      }, Math.max(0, TIMINGS_KEEP_MS - performance.now()));
    }
    active(!!sw.controller);
  }, () => swallowed('sw.register'));
}

let active: (on: boolean) => void = () => {};
const controls = new Promise<boolean>((r) => (active = r));

/** Once the worker is registered (released, above) and active: whether it controls this page (its caches serve the
 *  chunks). Never settles without a worker (the specs block it). */
export const workerControls = (): Promise<boolean> => controls;
