// When a deployed build is taken (docs/backend.md "Service worker" › Updates). A launch online is the deploy's page
// already (the worker's race: service-worker/caches.ts raceShell); a page left running, or one whose network was slow,
// takes the deploy only out of sight: as the app is hidden, once the new build's worker controls the page and nothing is
// open. In front it never reloads under the player (the phones, 11-11..11-14: 設定 open, then the whole island
// reloaded), but for a build it can't work with (version.json's `compat` past its own: contract/compat.ts), and then
// only once nothing is open. A lazy chunk an older page can't load still reloads it (reload.ts reloadUnlessLeaving).
import { COMPAT } from '#lib/contract/compat.ts';

export interface UpdateState {
  /** A newer build is deployed (Kit's `updated`). */
  updated: boolean;
  /** Its worker controls the page (reload.ts newWorker): a reload is served its shell. */
  ready: boolean;
  /** It can't work with this build (incompatible). */
  incompatible: boolean;
  /** Something is open (a sheet, the harvest, pairing). */
  busy: boolean;
  /** The app is hidden. */
  hidden: boolean;
}

/** Whether to reload into the deployed build now. */
export const takeUpdate = (s: UpdateState): boolean => s.updated && s.ready && !s.busy && (s.hidden || s.incompatible);

/** Whether the deployed build's compatibility epoch (version.json `compat`) is past this build's. */
export const incompatible = (deployed: unknown, own = COMPAT): boolean => typeof deployed === 'number' && deployed > own;

let claims = 0;
/** A newer worker claimed the page (a deploy installed under it: a launch whose network was late, a page left open):
 *  Kit's version check asked at once, from the app's start (+layout.ts: a claim ~0.3 s in came before the layout's
 *  mount, and the deploy waited for the second hide: review 11-14 #4). `claimed()`: how many so far (the layout asks
 *  again at its mount if any came before Kit could). */
export function watchClaims(check: () => Promise<unknown>, sw: ServiceWorkerContainer | undefined = globalThis.navigator?.serviceWorker): void {
  sw?.addEventListener('controllerchange', () => {
    claims++;
    try {
      void check().catch(() => {});
    } catch {
      /* Kit not started yet: the layout's mount asks */
    }
  });
}
export const claimed = (): number => claims;

/** sessionStorage: the deployed version a reload of this kind was last made for (`island.updateFor` at a hide,
 *  `island.staleFor` in front): one reload a deployed version a session, so a reload served an older shell again (slow,
 *  offline, an install that failed) waits for the next launch rather than looping (review 11-14 #3). */
export function doneFor(key: string, version: string): boolean {
  try {
    return sessionStorage.getItem(key) === version;
  } catch {
    return true; // no storage: no loop guard, so no automatic reload
  }
}
export function markDone(key: string, version: string): void {
  try {
    sessionStorage.setItem(key, version);
  } catch {
    /* (doneFor says done) */
  }
}
