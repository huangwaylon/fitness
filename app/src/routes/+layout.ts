// Client-rendered PWA: the browser computes the week from the record's snapshot (lib/model).
import { loadEnglish, setLocale } from '#lib/i18n/index.ts';
import { DEVICE, localKV, readJson } from '#lib/sync/storage.ts';
import { resolve } from '$app/paths';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const prerender = false;

/** A phone last shown in English loads its strings before the first paint (no flash of Japanese). On the island, the
 *  3D island's chunk (three.js and its scene) is asked for now, while the page reads the week from IndexedDB (the
 *  island scene imports it only once the week is in: the same import, already on its way), and its ground's fields. */
export const load: LayoutLoad = async ({ url, untrack }) => {
  if (untrack(() => url.pathname) === resolve('/')) {
    void import('#lib/components/world3d/Island3D.svelte').catch(() => {});
    // the layout's distance fields in a worker meanwhile (the layout is in localStorage: at hand now), so the 3D
    // island finds them built as it mounts (layout/fieldsPrime.ts; else it builds them itself, as before)
    void Promise.all([import('#lib/store/layout.svelte.ts'), import('#lib/layout/fieldsPrime.ts')]).then(([{ layout }, { primeFields }]) => primeFields(layout.current), () => {});
  }
  if (readJson(localKV(), DEVICE.locale) !== 'en') return;
  await loadEnglish().catch(() => {});
  setLocale('en');
};
