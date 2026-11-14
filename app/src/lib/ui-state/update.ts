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
