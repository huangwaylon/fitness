// A newer service worker's claim of the page, from the app's start (+layout.ts): Kit's version check asked at once. Its
// own module, so the update's rules (update.ts) stay off the first load.
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
