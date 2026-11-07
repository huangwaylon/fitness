// The service worker registered once the island is up (vite.config.ts: Kit's own registration, on the window's load, is
// off). A first visit's install (the ~2.9 MB precache) ran while three.js and the island's models were still loading,
// both on the one network. Now: when the 3D island has its models in (Island3D's loaded()) or can't draw, soon after the
// window's load where no island comes (another route, /pair; the error and not-set-up screens release it too), and at
// most ISLAND_CAP_MS after the start on the island (its load stuck, a sheet's route opened instead). A phone
// the worker controls already is unaffected: the browser checks for a new worker on each navigation itself.

import { resolve } from '$app/paths';

/** On the island, registered by this long after the start whatever the island is doing. */
export const ISLAND_CAP_MS = 30_000;
/** Off the island: after the window's load, then this. */
export const IDLE_MS = 2000;

let release: () => void = () => {};
const released = new Promise<void>((r) => (release = r));

/** The island has its models in (or failed, or isn't coming): register now. */
export const releaseWorker = (): void => release();

/** Starts the wait (once, at the app's start): `island`, whether this launch opens the island (ui-state/boot.ts). */
export function registerLate(island: boolean, sw: ServiceWorkerContainer | undefined = globalThis.navigator?.serviceWorker): void {
  if (!sw) return;
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
  void wait.then(() => sw.register(`${resolve('/')}service-worker.js`, { type: 'module' })).catch(() => {});
}
