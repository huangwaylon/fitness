// The service worker registered once the island is up (vite.config.ts: Kit's own registration, on the window's load, is
// off). A first visit's install (the ~2.9 MB precache) ran while three.js and the island's models were still loading,
// both on the one network. Now: when the 3D island has its models in (Island3D's loaded()) or can't draw, soon after the
// window's load where no island comes (another route, /pair; the error and not-set-up screens release it too), and at
// most ISLAND_CAP_MS after the start on the island (its load stuck, a sheet's route opened instead). A phone
// the worker controls already is unaffected: the browser checks for a new worker on each navigation itself.
// A page it didn't control (a first launch) tells the worker what it fetched (the resource timings'
// URLs: service-worker/index.ts `warm` keeps the models and art among them from the HTTP cache) once it claims the page,
// then clears them. Every page says its build to the worker (`live`), so a deploy keeps the shell it runs on.

import { resolve } from '$app/paths';
import { version } from '$app/env';
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
  // (a launch's ~380 files, a first one's or a warm one's: past the timings' default 250, the rest weren't listed,
  // perf.boot's lateF and net among them)
  performance.setResourceTimingBufferSize?.(1000);
  const fresh = !sw.controller;
  // (a warm launch's let go the same way, nothing told: the worker has them)
  if (!fresh) setTimeout(trimTimings, Math.max(0, TIMINGS_KEEP_MS - performance.now()));
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
  void wait.then(() => sw.register(`${resolve('/')}service-worker.js`, { type: 'module' })).then(() => sw.ready).then(async (reg) => {
    active(!!sw.controller);
    // this page's build, said to the worker in control now and to each new one at its claim: a deploy's worker keeps
    // its shell while it's open (service-worker/caches.ts staleCaches), however many deploys behind
    const live = () => sw.controller?.postMessage?.({ k: 'live', v: version });
    live();
    sw.addEventListener?.('controllerchange', live);
    if (fresh) {
      // Told once the worker controls the page (its clients.claim), not at `ready` (its activation's start): a file
      // asked for between the two went past the worker and wasn't in the list either, fetched again on the next launch
      // (1 cold WebKit launch in 3, ~13 files: fx/*.glb, a KTX2 pack; review 11-13 r2 N-C). One still on its way at the
      // claim (asked before it, not in the timings yet) is told after, when the timings are cleared: the worker keeps
      // what it hasn't (service-worker/index.ts warm).
      await claimed(sw);
      const told = new Set<string>();
      const tell = () => {
        const urls = [...performance.getEntriesByType('resource').map((e) => e.name), ...fetchedElsewhere].filter((u) => !told.has(u));
        for (const u of urls) told.add(u);
        if (urls.length) reg?.active?.postMessage({ k: 'warm', urls });
      };
      tell();
      // (used: the ~0.3 MB of entries not kept for the page's life, the buffer back to its default; after perf.boot's
      // look at them, by world3d/boot.ts's 30 s watch)
      setTimeout(() => (tell(), trimTimings()), Math.max(0, TIMINGS_KEEP_MS - performance.now()));
    }
  }).catch(() => swallowed('sw.register'));
}

const trimTimings = () => {
  performance.clearResourceTimings?.();
  performance.setResourceTimingBufferSize?.(250);
};

/** The worker claims the page (`controllerchange`), or CLAIM_WAIT_MS passed (a claim that never comes: told anyway). */
const CLAIM_WAIT_MS = 10_000;
const claimed = (sw: ServiceWorkerContainer): Promise<void> =>
  sw.controller
    ? Promise.resolve()
    : new Promise((done) => {
        sw.addEventListener?.('controllerchange', () => done(), { once: true });
        setTimeout(done, CLAIM_WAIT_MS);
      });

let active: (on: boolean) => void = () => {};
/** The worker registered and active: whether it controls this page. */
const controls = new Promise<boolean>((r) => (active = r));

let islandUp: () => void = () => {};
const up = new Promise<boolean>((r) => (islandUp = () => r(true)));
/** The 3D island has its models in (IslandScene: Island3D's onready). */
export const islandIn = (): void => islandUp();
/** Whether the worker's caches serve the chunks, as soon as that's known with the island in: a page the worker
 *  controlled from its start at the island's models in (its caches: no network, not before the island), else once
 *  the worker is registered (released, above) and active, whether it controls the page (the island's register; a page
 *  with no island the same; never settles without a worker: the specs block it). */
export const chunksServed = (sw: ServiceWorkerContainer | undefined = globalThis.navigator?.serviceWorker): Promise<boolean> =>
  sw?.controller ? Promise.race([up, controls]) : controls;
