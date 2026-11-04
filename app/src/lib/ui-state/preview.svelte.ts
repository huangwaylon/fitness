// The scene's seasonal preview, live (ui-state/preview.ts resolves it): せってい's きせつ, kept on this phone for the
// Tokyo day it was set on, and the URL's dev params. Every seasonal look reads `scenePreview()` (the theme, the
// weather, the island's events, visitors, fireworks, birthdays, the wedding); a change shows at once.
import { dayKey, minuteNow } from '#lib/time/clock.ts';
import { DEVICE, localKV, readJson, remove, writeJson } from '#lib/sync/storage.ts';
import { devChoice, resolvePreview, savedFrom, type Choice, type Saved, type Scene } from './preview.ts';

let saved = $state<Saved | null>(savedFrom(readJson(localKV(), DEVICE.preview)));

/** The preview now (reactive: the setting, and the day it lapses at). */
export function scenePreview(): Scene {
  return resolvePreview(devChoice(typeof location === 'undefined' ? '' : location.search), saved, dayKey(minuteNow()));
}

/** The setting's own choices today (all null: none). */
export function previewChoice(): Choice {
  const s = saved?.day === dayKey(minuteNow()) ? saved : null;
  return { event: s?.event ?? null, season: s?.season ?? null, weather: s?.weather ?? null, tod: s?.tod ?? null };
}

/** Change the setting (for today); all null clears it. */
export function setPreview(c: Partial<Choice>): void {
  const next = { ...previewChoice(), ...c };
  if (next.event === null && next.season === null && next.weather === null && next.tod === null) return clearPreview();
  saved = { day: dayKey(), ...next };
  writeJson(localKV(), DEVICE.preview, saved);
}

/** もどす: the real day again. */
export function clearPreview(): void {
  saved = null;
  remove(localKV(), DEVICE.preview);
}
