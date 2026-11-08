// The island's look, live (ui-state/preview.ts resolves it): 設定's 季節, one for the whole island (`pref seasonLook`
// in the record: whoever set it last, every phone at once), and the URL's dev params. Every seasonal look reads
// `scenePreview()` (the theme, the weather, the music, the island's events, visitors, fireworks, birthdays, the
// wedding); a change, here or from another phone, shows at once. The record is the store's (ui-state never imports
// it): the root layout binds it (bindLook). (A look kept on the phone by older builds, `island.preview`, is ignored.)
import { devChoice, lookFrom, resolvePreview, type Choice, type Scene } from './preview.ts';

interface LookSource {
  /** The record's `seasonLook` (reactive). */
  read(): unknown;
  /** Send a new one (null: 自動). */
  write(look: Choice | null): void;
}
let source: LookSource | null = null;

/** Once, in the root layout, before the theme starts: where the island's look is kept. */
export function bindLook(s: LookSource): void {
  source = s;
}

/** The island's setting (all null: 自動). */
export function previewChoice(): Choice {
  return lookFrom(source?.read()) ?? { event: null, season: null, weather: null, tod: null };
}

/** The look now (reactive: the island's setting, and the dev params). */
export function scenePreview(): Scene {
  return resolvePreview(devChoice(typeof location === 'undefined' ? '' : location.search), lookFrom(source?.read()));
}

/** Change the island's setting; all null is 自動. */
export function setPreview(c: Partial<Choice>): void {
  const next = { ...previewChoice(), ...c };
  source?.write(next.event === null && next.season === null && next.weather === null && next.tod === null ? null : next);
}

/** 自動に戻す: the real day again, on every phone. */
export function clearPreview(): void {
  if (lookFrom(source?.read())) source?.write(null);
}
