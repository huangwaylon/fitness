// When a deployed build is taken (docs/backend.md "Service worker" › Updates). A launch is always the cached shell of
// the worker in control, every chunk of it cached (service-worker/caches.ts checkShell: a deploy's page booted under the
// older worker missed its cache for each new chunk, 48 % of launches ~650 ms slower, the launch review 11-21); the
// deploy's worker installs meanwhile and claims the page (watchClaims: Kit's check then), so the next cold launch is
// the new build's own shell. A page left open takes it only at a safe moment (review 11-24 R2: 15 reloads a day, three
// in four minutes as the app was switched away from and back): shown again after AWAY_MS hidden, before its first
// touch (FRESH_MS at most), with nothing in hand (inUse). Never at a hide: a quick switch away came back to a reloaded
// app. A build it can't work with (version.json's `compat` past its own: contract/compat.ts) or whose chunks it lost
// (a lazy part not fetched) is taken at a hide too, never in front. A lazy chunk tapped for that won't load still
// reloads it (reload.ts reloadUnlessLeaving).
import { COMPAT } from '#lib/contract/compat.ts';

export interface UpdateState {
  /** A newer build is deployed (Kit's `updated`). */
  updated: boolean;
  /** Its worker controls the page (reload.ts newWorker): a reload is served its shell. */
  ready: boolean;
  /** It can't work with this build (incompatible). */
  incompatible: boolean;
  /** Something is in hand (inUse). */
  busy: boolean;
  /** The app is hidden. */
  hidden: boolean;
  /** Shown again after AWAY_MS hidden, not yet touched (freshUntil). */
  fresh: boolean;
}

/** Whether to reload into the deployed build now: in a fresh return; a build it can't work with as it hides, too. */
export const takeUpdate = (s: UpdateState): boolean => s.updated && s.ready && !s.busy && (s.fresh || (s.hidden && s.incompatible));

/** Hidden this long, the app's return is a safe moment for a deploy (a quick switch away isn't). */
export const AWAY_MS = 5 * 60_000;
/** A return stays safe till its first touch or key, this long at most (the new worker's install may take seconds). */
export const FRESH_MS = 20_000;
/** sessionStorage: when the app was last hidden (ms; the e2e back-dates it). */
const HIDDEN_AT = 'island.hiddenAt';
export function noteHidden(now = Date.now()): void {
  try {
    sessionStorage.setItem(HIDDEN_AT, String(now));
  } catch {
    /* no storage: no return counts as fresh */
  }
}
/** The app shown: until when this return is safe (now + FRESH_MS after AWAY_MS hidden), else 0. */
export function freshUntil(now = Date.now()): number {
  try {
    const at = Number(sessionStorage.getItem(HIDDEN_AT) ?? 0);
    sessionStorage.removeItem(HIDDEN_AT);
    return at > 0 && now - at >= AWAY_MS ? now + FRESH_MS : 0;
  } catch {
    return 0;
  }
}

/** What the player has in hand: a sheet or overlay open (a lesson, a hike's map, the harvest, pairing), a page other
 *  than the island or the tent (すごろく, the shop, the editor…), a hike on, a keyboard up, rows not yet sent. */
export interface InHand {
  open: boolean;
  route: string;
  hike: boolean;
  typing: boolean;
  queued: number;
}
export const inUse = (h: InHand): boolean => h.open || !(h.route === '/' || h.route === '/tent') || h.hike || h.typing || h.queued > 0;
/** A keyboard is up: the focus in a text field. */
export const typingIn = (el: Element | null): boolean =>
  !!el && (el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable === true || (el.tagName === 'INPUT' && !/^(button|checkbox|radio|range|submit|reset|file|color|image)$/i.test((el as HTMLInputElement).type)));

/** Whether the deployed build's compatibility epoch (version.json `compat`) is past this build's. */
export const incompatible = (deployed: unknown, own = COMPAT): boolean => typeof deployed === 'number' && deployed > own;


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
