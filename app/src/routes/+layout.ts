// Client-rendered PWA: the browser computes the week from the record's snapshot (lib/model).
import { loadEnglish, setLocale } from '#lib/i18n/index.ts';
import { DEVICE, localKV, readJson } from '#lib/sync/storage.ts';
import { resolve } from '$app/paths';
import { opensIsland } from '#lib/ui-state/boot.ts';
import type { LayoutLoad } from './$types';
import { quiet } from '#lib/quiet.ts';
import { updated } from '$app/state';
import { watchClaims } from '#lib/ui-state/update.ts';

// the app has started: the boot watchdog stands down (ui-state/bootWatch.ts, inline in index.html)
(globalThis as { __islandStarted?: () => void }).__islandStarted?.();
// a newer worker's claim asks Kit for the deployed version from now on, not from the layout's mount (ui-state/update.ts)
watchClaims(() => updated.check());

export const ssr = false;
export const prerender = false;

/** A phone last shown in English loads its strings before the first paint (no flash of Japanese). On the island, the
 *  3D island's chunk (three.js and its scene) is asked for now, while the page reads the week from IndexedDB (the
 *  island scene imports it only once the week is in: the same import, already on its way), and its ground's fields;
 *  only when this launch opens the island (ui-state/boot.ts: the demo or a paired phone, not one going to /pair). */
export const load: LayoutLoad = async ({ url, untrack }) => {
  if (untrack(() => url.pathname) === resolve('/') && opensIsland()) {
    void import('#lib/components/world3d/Island3D.svelte').catch(() => {});
    // the layout's distance fields in a worker meanwhile (the layout is in localStorage: at hand now), so the 3D
    // island finds them built as it mounts (layout/fieldsPrime.ts: one job, the mount's own call shares it, or starts
    // it if it runs first)
    void Promise.all([import('#lib/store/layout.svelte.ts'), import('#lib/layout/fieldsPrime.ts')]).then(([{ layout }, { primeFields }]) => primeFields(layout.current), () => {});
    // and NH's ground textures (world3d/groundTex.ts): in as the ground is built, its bands baked once, with them
    void import('#lib/components/world3d/groundTex.ts').then(({ primeGround }) => primeGround(), () => {});
  }
  if (readJson(localKV(), DEVICE.locale) !== 'en') return;
  await quiet(loadEnglish(), 'i18n.en');
  setLocale('en');
};
