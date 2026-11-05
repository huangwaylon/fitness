// Client-rendered PWA: the browser computes the week from the record's snapshot (lib/model).
import { loadEnglish, setLocale } from '#lib/i18n/index.ts';
import { DEVICE, localKV, readJson } from '#lib/sync/storage.ts';

export const ssr = false;
export const prerender = false;

/** A phone last shown in English loads its strings before the first paint (no flash of Japanese). */
export async function load(): Promise<void> {
  if (readJson(localKV(), DEVICE.locale) !== 'en') return;
  await loadEnglish().catch(() => {});
  setLocale('en');
}
